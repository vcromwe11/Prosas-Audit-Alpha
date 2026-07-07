// Service to interact with Google Drive API using pure fetch and GIS Token
// Scope required: https://www.googleapis.com/auth/drive.file

const BACKUP_FILENAME = 'prosas_audit_backup.json';

interface DriveFile {
  id: string;
  name: string;
}

export class DriveAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriveAuthError';
  }
}

/**
 * Searches for the backup file in the user's Drive.
 * Returns the file ID if found, null otherwise.
 */
export const findBackupFile = async (accessToken: string): Promise<string | null> => {
  const query = `name = '${BACKUP_FILENAME}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new DriveAuthError('Token expirado ou inválido');
  }

  if (!response.ok) throw new Error('Falha ao buscar arquivos no Drive');
  
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

/**
 * Uploads data to Drive.
 * If fileId is provided, it updates the existing file.
 * If not, it creates a new one.
 */
export const uploadToDrive = async (accessToken: string, data: any, fileId?: string | null): Promise<string> => {
  const fileContent = JSON.stringify(data, null, 2);
  const metadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (fileId) {
    // Update existing file
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method: method,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: form
  });

  if (response.status === 401) {
    throw new DriveAuthError('Token expirado ou inválido');
  }

  if (!response.ok) {
     const err = await response.json();
     throw new Error(`Erro no upload: ${err.error?.message || 'Desconhecido'}`);
  }

  const result = await response.json();
  return result.id;
};

/**
 * Downloads the content of the backup file.
 */
export const downloadFromDrive = async (accessToken: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) {
    throw new DriveAuthError('Token expirado ou inválido');
  }

  if (!response.ok) throw new Error('Falha ao baixar backup');
  
  return await response.json();
};