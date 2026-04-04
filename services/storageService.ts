import { SavedReport, AuditResult } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, query, onSnapshot, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const saveReport = async (editalName: string, result: AuditResult): Promise<SavedReport | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  
  const newReport: SavedReport = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    editalName: editalName || "Edital Geral",
    candidateName: result.candidateName || "Candidato Desconhecido",
    cnpj: result.organizationData?.cnpj || "N/A",
    timestamp: Date.now(),
    result: result
  };

  const path = `users/${userId}/reports`;
  try {
    const docRef = doc(db, path, newReport.id);
    await setDoc(docRef, {
      ...newReport,
      userId: userId,
      result: JSON.stringify(newReport.result)
    });
    return newReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const subscribeToReports = (callback: (groupedReports: Record<string, SavedReport[]>, allReports: SavedReport[]) => void) => {
  if (!auth.currentUser) return () => {};
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/reports`;
  
  const q = query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    const reports: SavedReport[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: data.id,
        editalName: data.editalName,
        candidateName: data.candidateName,
        cnpj: data.cnpj,
        timestamp: data.timestamp,
        result: JSON.parse(data.result),
        manualStatus: data.manualStatus,
        userNotes: data.userNotes
      });
    });
    
    // Group by Edital Name
    const grouped = reports.reduce((acc, report) => {
      if (!acc[report.editalName]) {
        acc[report.editalName] = [];
      }
      acc[report.editalName].push(report);
      acc[report.editalName].sort((a, b) => b.timestamp - a.timestamp);
      return acc;
    }, {} as Record<string, SavedReport[]>);
    
    callback(grouped, reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const deleteReport = async (id: string) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/reports/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const updateReport = async (report: SavedReport) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/reports`;
  try {
    const docRef = doc(db, path, report.id);
    
    const dataToSave: any = {
      ...report,
      userId: userId,
      result: JSON.stringify(report.result)
    };
    
    if (dataToSave.manualStatus === undefined) delete dataToSave.manualStatus;
    if (dataToSave.userNotes === undefined) delete dataToSave.userNotes;
    
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Function to bulk overwrite reports (for Restore)
export const saveAllReports = async (reports: SavedReport[]) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/reports`;
  
  try {
    const batch = writeBatch(db);
    reports.forEach(report => {
      const docRef = doc(db, path, report.id);
      const dataToSave: any = {
        ...report,
        userId: userId,
        result: JSON.stringify(report.result)
      };
      if (dataToSave.manualStatus === undefined) delete dataToSave.manualStatus;
      if (dataToSave.userNotes === undefined) delete dataToSave.userNotes;
      batch.set(docRef, dataToSave);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};