import { SavedReport, AuditResult, Idea, IdeaComment, StoredPrompt, GlobalPrompt, UserProfile, RepositoryFile, RepositoryFolder } from '../types';
import { db, auth, storage } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, onSnapshot, writeBatch, orderBy, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
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

export const syncUserProfile = async (): Promise<UserProfile | null> => {
  if (!auth.currentUser) return null;
  const user = auth.currentUser;
  const path = `users/${user.uid}`;
  try {
    const docRef = doc(db, path);
    
    let docSnap;
    try {
      docSnap = await getDoc(docRef);
    } catch (getError) {
      handleFirestoreError(getError, OperationType.GET, path);
      return null;
    }

    if (!docSnap.exists()) {
      let existingProfileByEmail: any = null;
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email && data.email.toLowerCase() === user.email?.toLowerCase()) {
            existingProfileByEmail = data;
          }
        });
      } catch (err) {
        console.error("Erro ao verificar pré-cadastro por e-mail:", err);
      }

      if (!existingProfileByEmail) {
        await auth.signOut();
        throw new Error("Usuário não cadastrado. Entre em contato com um administrador para obter acesso.");
      }

      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || existingProfileByEmail.name || user.email?.split('@')[0] || 'Usuário',
        avatarUrl: user.photoURL || existingProfileByEmail.avatarUrl || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=C13B2E&color=fff&size=128`,
        role: existingProfileByEmail.role || 'viewer',
        company: existingProfileByEmail.company || '',
        state: existingProfileByEmail.state || '',
        jobFunction: existingProfileByEmail.jobFunction || ''
      };
      
      try {
        const payload = {
          ...newUserProfile,
          displayName: newUserProfile.name,
          createdAt: new Date().toISOString()
        };
        console.log("Saving user profile linked to pre-existing email registration:", JSON.stringify(payload));
        await setDoc(docRef, payload);
      } catch (setError) {
        handleFirestoreError(setError, OperationType.CREATE, path);
        return null;
      }
      return newUserProfile;
    } else {
      const data = docSnap.data();
      return {
        uid: data.uid,
        email: data.email,
        name: data.displayName,
        avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${data.displayName}&background=C13B2E&color=fff&size=128`,
        role: data.role || 'viewer'
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  const path = `users`;
  const q = query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: data.uid,
        email: data.email,
        name: data.displayName,
        avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${data.displayName}&background=C13B2E&color=fff&size=128`,
        role: data.role,
        state: data.state,
        company: data.company,
        jobFunction: data.jobFunction,
        temporaryPassword: data.temporaryPassword
      });
    });
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, path);
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateUserRole = async (uid: string, newRole: 'admin' | 'analyst' | 'viewer') => {
  await updateUserProfile(uid, { role: newRole });
};

export const subscribeToGlobalPrompts = (callback: (prompts: GlobalPrompt[]) => void) => {
  const path = `global_prompts`;
  const q = query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    const prompts: GlobalPrompt[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      prompts.push({
        id: data.id,
        key: data.key,
        text: data.text,
        updatedBy: data.updatedBy,
        timestamp: data.timestamp
      });
    });
    callback(prompts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const updateGlobalPrompt = async (key: string, text: string) => {
  if (!auth.currentUser) return;
  const path = `global_prompts/${key}`;
  try {
    const docRef = doc(db, path);
    await setDoc(docRef, {
      id: key,
      key: key,
      text: text,
      updatedBy: auth.currentUser.email || auth.currentUser.uid,
      timestamp: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getGlobalPrompt = async (key: string, defaultText: string): Promise<string> => {
  const path = `global_prompts/${key}`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().text;
    }
  } catch (error) {
    console.error("Failed to fetch global prompt", error);
  }
  return defaultText;
};

export const savePrompt = async (text: string): Promise<string | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  
  const newPrompt: StoredPrompt = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId: userId,
    text: text,
    timestamp: Date.now()
  };

  const path = `users/${userId}/prompts`;
  try {
    const docRef = doc(db, path, newPrompt.id);
    await setDoc(docRef, newPrompt);
    return newPrompt.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const getPrompt = async (promptId: string): Promise<StoredPrompt | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/prompts/${promptId}`;
  
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as StoredPrompt;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const saveReport = async (editalName: string, result: AuditResult, promptId?: string): Promise<SavedReport | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  
  const newReport: SavedReport = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId: userId,
    editalName: editalName || "Edital Geral",
    candidateName: result.candidateName || "Candidato Desconhecido",
    cnpj: result.organizationData?.cnpj || "N/A",
    timestamp: Date.now(),
    result: result,
    promptId: promptId
  };

  const path = `reports`;
  try {
    const docRef = doc(db, path, newReport.id);
    const dataToSave: any = {
      ...newReport,
      userId: userId,
      result: JSON.stringify(newReport.result)
    };
    if (dataToSave.promptId === undefined) delete dataToSave.promptId;
    
    await setDoc(docRef, dataToSave);
    return newReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const migrateUserReports = async () => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const legacyPath = `users/${userId}/reports`;
  
  try {
    let snapshot;
    try {
      console.log(`[Migration] Reading from legacy path: ${legacyPath}`);
      snapshot = await getDocs(query(collection(db, legacyPath)));
      console.log(`[Migration] Successfully read legacy reports. Found records: ${snapshot.size}`);
    } catch (readError) {
      console.error('[Migration Error] Failed to read legacy reports:', readError);
      return;
    }

    if (!snapshot.empty) {
      console.log(`[Migration] Initiating batch update for ${snapshot.size} legacy reports...`);
      const batch = writeBatch(db);
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const newRef = doc(db, 'reports', docSnap.id);
        const dataToSave = {
          ...data,
          userId: userId // Force override with current user's authenticated ID to ensure permissions check passes
        };
        batch.set(newRef, dataToSave);
        batch.delete(docSnap.ref);
      });
      
      try {
        await batch.commit();
        console.log('[Migration] Legacy reports batch write/delete migration complete.');
      } catch (writeError) {
        console.error('[Migration Error] Failed during batch commit:', writeError);
      }
    } else {
      console.log('[Migration] No legacy reports to migrate.');
    }
  } catch (error) {
    console.error('[Migration Error] Unknown error in migration:', error);
  }
};

export const subscribeToReports = (callback: (groupedReports: Record<string, SavedReport[]>, allReports: SavedReport[]) => void) => {
  if (!auth.currentUser) return () => {};
  const path = `reports`;
  
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
        userNotes: data.userNotes,
        promptId: data.promptId
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
  const path = `reports/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const updateReport = async (report: SavedReport) => {
  if (!auth.currentUser) return;
  const path = `reports`;
  try {
    const docRef = doc(db, path, report.id);
    
    const dataToSave: any = {
      ...report,
      userId: report.userId || auth.currentUser.uid,
      result: JSON.stringify(report.result)
    };
    
    if (dataToSave.manualStatus === undefined) delete dataToSave.manualStatus;
    if (dataToSave.userNotes === undefined) delete dataToSave.userNotes;
    
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveIdea = async (title: string, description: string): Promise<Idea | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  const userName = auth.currentUser.displayName || auth.currentUser.email || "Usuário";
  
  const newIdea: Idea = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    userName,
    title,
    description,
    timestamp: Date.now(),
    comments: []
  };

  const path = `ideas`;
  try {
    const docRef = doc(db, path, newIdea.id);
    const { comments, ...ideaData } = newIdea;
    await setDoc(docRef, ideaData);
    return newIdea;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const subscribeToIdeas = (callback: (ideas: Idea[]) => void) => {
  const path = `ideas`;
  const q = query(collection(db, path), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const ideas: Idea[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: data.id,
        userId: data.userId,
        userName: data.userName,
        title: data.title,
        description: data.description,
        timestamp: data.timestamp,
        comments: [] // Comments will be fetched separately or via subcollection
      });
    });
    callback(ideas);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToComments = (ideaId: string, callback: (comments: IdeaComment[]) => void) => {
  const path = `ideas/${ideaId}/comments`;
  const q = query(collection(db, path), orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const comments: IdeaComment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: data.id,
        userId: data.userId,
        userName: data.userName,
        text: data.text,
        timestamp: data.timestamp
      });
    });
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveComment = async (ideaId: string, text: string): Promise<IdeaComment | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  const userName = auth.currentUser.displayName || auth.currentUser.email || "Usuário";
  
  const newComment: IdeaComment = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    userName,
    text,
    timestamp: Date.now()
  };

  const path = `ideas/${ideaId}/comments`;
  try {
    const docRef = doc(db, path, newComment.id);
    await setDoc(docRef, newComment);
    return newComment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const deleteIdea = async (id: string) => {
  if (!auth.currentUser) return;
  const path = `ideas/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Admin functionality to create a user using a secondary Firebase app instance
const secondaryApp = initializeApp(firebaseConfig, "AdminActionApp");
const secondaryAuth = getAuth(secondaryApp);

export const adminCreateUser = async (profile: Partial<UserProfile>) => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  
  try {
    // Attempt to create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, profile.email!, profile.temporaryPassword!);
    await updateProfile(userCredential.user, { displayName: profile.name });
    await secondaryAuth.signOut(); // Clear secondary session
    
    // Attempt to create user document in Firestore
    const newProfile = {
      uid: userCredential.user.uid,
      email: profile.email!,
      name: profile.name || profile.email!.split('@')[0],
      displayName: profile.name || profile.email!.split('@')[0],
      avatarUrl: `https://ui-avatars.com/api/?name=${profile.name}&background=C13B2E&color=fff&size=128`,
      role: profile.role || 'viewer',
      state: profile.state || '',
      company: profile.company || '',
      jobFunction: profile.jobFunction || '',
      temporaryPassword: profile.temporaryPassword, // Visible only for admins as requested
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, `users/${userCredential.user.uid}`), newProfile);
    return newProfile;
  } catch (error) {
    console.error("Error creating user admin side:", error);
    throw error;
  }
};

export const deleteUserProfile = async (uid: string) => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

export const saveAllReports = async (reports: SavedReport[]) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `reports`;
  
  try {
    const batch = writeBatch(db);
    reports.forEach(report => {
      const docRef = doc(db, path, report.id);
      const dataToSave: any = {
        ...report,
        userId: report.userId || userId,
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

// --- Repository Folders ---
export const subscribeToRepositoryFolders = (callback: (folders: RepositoryFolder[]) => void) => {
  const path = `repository_folders`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const folders: RepositoryFolder[] = [];
    snapshot.forEach((doc) => {
      folders.push({ id: doc.id, ...doc.data() } as RepositoryFolder);
    });
    callback(folders);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const createRepositoryFolder = async (name: string, parentId: string | null = null): Promise<string> => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  
  const folderId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  const path = `repository_folders/${folderId}`;
  
  const newFolder: RepositoryFolder = {
    id: folderId,
    parentId,
    name,
    userId: auth.currentUser.uid,
    createdAt: Date.now()
  };
  
  try {
    await setDoc(doc(db, path), newFolder);
    return folderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateRepositoryFolder = async (folderId: string, name: string) => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  const path = `repository_folders/${folderId}`;
  try {
    await updateDoc(doc(db, path), { name });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteRepositoryFolder = async (folderId: string) => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  const path = `repository_folders/${folderId}`;
  try {
    // 1. Delete all files in this folder
    const filesQuery = query(collection(db, 'repository_files'), where('folderId', '==', folderId));
    const filesSnapshot = await getDocs(filesQuery);
    
    const fileDeletePromises = filesSnapshot.docs.map(async (docSnapshot) => {
      const fileData = docSnapshot.data() as RepositoryFile;
      // Delete from storage
      if (fileData.storagePath) {
        const fileRef = ref(storage, fileData.storagePath);
        try {
          await deleteObject(fileRef);
        } catch (e) {
          console.warn("Storage item might already be deleted", e);
        }
      }
      // Delete from firestore
      await deleteDoc(docSnapshot.ref);
    });
    await Promise.all(fileDeletePromises);

    // 2. Find all subfolders and delete them recursively
    const subfoldersQuery = query(collection(db, 'repository_folders'), where('parentId', '==', folderId));
    const subfoldersSnapshot = await getDocs(subfoldersQuery);
    
    const subfolderDeletePromises = subfoldersSnapshot.docs.map(docSnapshot => {
      return deleteRepositoryFolder(docSnapshot.id);
    });
    await Promise.all(subfolderDeletePromises);

    // 3. Delete the folder itself
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

// --- Repository Files ---
export const subscribeToRepositoryFiles = (folderId: string | null, callback: (files: RepositoryFile[]) => void) => {
  const path = `repository_files`;
  let q;
  if (folderId) {
    q = query(collection(db, path), where('folderId', '==', folderId));
  } else {
    q = query(collection(db, path));
  }
  
  return onSnapshot(q, (snapshot) => {
    const files: RepositoryFile[] = [];
    snapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() } as RepositoryFile);
    });
    // Sort locally by createdAt desc
    files.sort((a, b) => b.createdAt - a.createdAt);
    callback(files);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const uploadRepositoryFile = async (folderId: string, file: File, onProgress?: (progress: number) => void): Promise<string> => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  const userId = auth.currentUser.uid;
  const fileId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  const storagePath = `repository/${userId}/${folderId}/${fileId}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      }, 
      async () => {
        try {
          const path = `repository_files/${fileId}`;
          const newFile: RepositoryFile = {
            id: fileId,
            folderId,
            name: file.name,
            userId,
            storagePath,
            size: file.size,
            type: file.type,
            createdAt: Date.now()
          };
          
          await setDoc(doc(db, path), newFile);
          resolve(fileId);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const getFileDownloadUrl = async (storagePath: string): Promise<string> => {
  const fileRef = ref(storage, storagePath);
  return await getDownloadURL(fileRef);
};

export const updateRepositoryFile = async (fileId: string, updates: Partial<RepositoryFile>) => {
  const path = `repository_files/${fileId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteRepositoryFile = async (file: RepositoryFile) => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  
  try {
    // Delete from Storage
    const storageRef = ref(storage, file.storagePath);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn("Storage object may already be deleted:", e);
  }

  const path = `repository_files/${file.id}`;
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};