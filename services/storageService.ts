import { SavedReport, AuditResult, Idea, IdeaComment, StoredPrompt, GlobalPrompt, UserProfile, RepositoryFile, RepositoryFolder } from '../types';
import { db, auth, storage } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, onSnapshot, writeBatch, orderBy, where, updateDoc, limit } from 'firebase/firestore';
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
  
  const usersMap = new Map<string, UserProfile>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        usersMap.delete(change.doc.id);
      } else {
        const data = change.doc.data();
        usersMap.set(data.uid, {
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
      }
    });

    if (hasChanges || snapshot.empty) {
      callback(Array.from(usersMap.values()));
    }
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
  await logAuditAction('ALTERAR_PERMISSAO', { targetUserId: uid, newRole });
};

export const logAuditAction = async (action: string, details: any = {}) => {
  if (!auth.currentUser) return;
  try {
    const logId = `${Date.now()}_${auth.currentUser.uid}`;
    const logEntry = {
      action,
      details,
      timestamp: Date.now(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email
    };
    await setDoc(doc(db, "audit_logs", logId), logEntry);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};

export const subscribeToGlobalPrompts = (callback: (prompts: GlobalPrompt[]) => void) => {
  const path = `global_prompts`;
  const q = query(collection(db, path));
  
  const promptsMap = new Map<string, GlobalPrompt>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        promptsMap.delete(change.doc.id);
      } else {
        const data = change.doc.data();
        promptsMap.set(data.id, {
          id: data.id,
          key: data.key,
          text: data.text,
          updatedBy: data.updatedBy,
          timestamp: data.timestamp
        });
      }
    });

    if (hasChanges || snapshot.empty) {
      callback(Array.from(promptsMap.values()));
    }
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

export const saveReport = async (editalName: string, result: AuditResult, promptId?: string, documentHash?: string): Promise<SavedReport | null> => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  
  const newReport: SavedReport = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    userId: userId,
    editalName: editalName || "Edital Geral",
    candidateName: result.candidateName || "Candidato Desconhecido",
    cnpj: result.organizationData?.cnpj || "N/A",
    timestamp: Date.now(),
    promptId: promptId,
    overallStatus: result.overallStatus,
    documentHash: documentHash,
    result: result // kept in memory for immediate use
  };

  const path = `reports`;
  try {
    const docRef = doc(db, path, newReport.id);
    const dataToSave: any = {
      ...newReport,
      userId: userId
    };
    
    // Do not save the massive result object in the main document
    delete dataToSave.result;
    
    if (dataToSave.promptId === undefined) delete dataToSave.promptId;
    
    // 1. Save metadata
    await setDoc(docRef, dataToSave);
    
    // 2. Save dense data in subcollection
    const detailsRef = doc(db, `${path}/${newReport.id}/details`, 'content');
    await setDoc(detailsRef, { result: JSON.stringify(result) });
    
    return newReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const getReportResult = async (reportId: string): Promise<AuditResult | null> => {
  if (!auth.currentUser) return null;
  const path = `reports/${reportId}/details/content`;
  try {
    const docRef = doc(db, path);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists() && snapshot.data().result) {
      const data = snapshot.data();
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
    
    // Fallback for legacy items where result might still be directly inside the document.
    const legacySnapshot = await getDoc(doc(db, 'reports', reportId));
    if (legacySnapshot.exists() && legacySnapshot.data().result) {
      const legacyData = legacySnapshot.data();
      return typeof legacyData.result === 'string' ? JSON.parse(legacyData.result) : legacyData.result;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
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

export const subscribeToReports = (callback: (groupedReports: Record<string, SavedReport[]>, allReports: SavedReport[]) => void, limitCount: number = 50) => {
  if (!auth.currentUser) return () => {};
  const path = `reports`;
  
  const q = query(
    collection(db, path),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const reportsMap = new Map<string, SavedReport>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;

    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        reportsMap.delete(change.doc.id);
      } else {
        const data = change.doc.data();
        let parsedResult;
        
        // For backwards compatibility with old records that have 'result' directly loaded
        if (data.result) {
            try {
                parsedResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            } catch (e) {
                console.error("Failed to parse result for report", data.id, e);
                parsedResult = {};
            }
        }

        reportsMap.set(data.id, {
          id: data.id,
          editalName: data.editalName,
          candidateName: data.candidateName,
          cnpj: data.cnpj,
          timestamp: data.timestamp,
          overallStatus: data.overallStatus || parsedResult?.overallStatus,
          result: undefined, // intentionally undefined to save memory - use getReportResult to fetch lazy data
          manualStatus: data.manualStatus,
          userNotes: data.userNotes,
          promptId: data.promptId,
          evaluatedBy: data.evaluatedBy,
          evaluatedAt: data.evaluatedAt,
          documentHash: data.documentHash
        });
      }
    });
    
    if (hasChanges || snapshot.empty) {
        const reports = Array.from(reportsMap.values());
        
        // Group by Edital Name
        const grouped = reports.reduce((acc, report) => {
          if (!acc[report.editalName]) {
            acc[report.editalName] = [];
          }
          acc[report.editalName].push(report);
          return acc;
        }, {} as Record<string, SavedReport[]>);

        // Sort the arrays within grouped
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => b.timestamp - a.timestamp);
        });
        
        callback(grouped, reports);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const deleteReport = async (id: string) => {
  if (!auth.currentUser) return;
  const path = `reports/${id}`;
  try {
    await logAuditAction('DELETAR_RELATORIO', { reportId: id });
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
  
  const ideasMap = new Map<string, Idea>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        ideasMap.delete(change.doc.id);
      } else {
        const data = change.doc.data();
        ideasMap.set(data.id, {
          id: data.id,
          userId: data.userId,
          userName: data.userName,
          title: data.title,
          description: data.description,
          timestamp: data.timestamp,
          comments: [] // Comments will be fetched separately or via subcollection
        });
      }
    });

    if (hasChanges || snapshot.empty) {
      const sortedIdeas = Array.from(ideasMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      callback(sortedIdeas);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToComments = (ideaId: string, callback: (comments: IdeaComment[]) => void) => {
  const path = `ideas/${ideaId}/comments`;
  const q = query(collection(db, path), orderBy('timestamp', 'asc'));
  
  const commentsMap = new Map<string, IdeaComment>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        commentsMap.delete(change.doc.id);
      } else {
        const data = change.doc.data();
        commentsMap.set(data.id, {
          id: data.id,
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          timestamp: data.timestamp
        });
      }
    });

    if (hasChanges || snapshot.empty) {
      const sortedComments = Array.from(commentsMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      callback(sortedComments);
    }
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
  
  const foldersMap = new Map<string, RepositoryFolder>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        foldersMap.delete(change.doc.id);
      } else {
        foldersMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as RepositoryFolder);
      }
    });

    if (hasChanges || snapshot.empty) {
      const sortedFolders = Array.from(foldersMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      callback(sortedFolders);
    }
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
      const fileData = { id: docSnapshot.id, ...docSnapshot.data() } as RepositoryFile;
      try {
         await deleteRepositoryFile(fileData);
      } catch (e) {
         console.warn("Failed to delete file inside folder", e);
      }
    });
    await Promise.all(fileDeletePromises);

    // 2. Find all subfolders and delete them recursively
    const subfoldersQuery = query(collection(db, 'repository_folders'), where('parentId', '==', folderId));
    const subfoldersSnapshot = await getDocs(subfoldersQuery);
    
    const subfolderDeletePromises = subfoldersSnapshot.docs.map(async docSnapshot => {
      try {
         await deleteRepositoryFolder(docSnapshot.id);
      } catch (e) {
         console.warn("Failed to delete subfolder", e);
      }
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
  
  // Use 'in' to check for both strictly null and empty string if we're at root
  let q;
  if (!folderId) {
     q = query(collection(db, path), where('folderId', 'in', [null, '']));
  } else {
     q = query(collection(db, path), where('folderId', '==', folderId));
  }
  
  const filesMap = new Map<string, RepositoryFile>();

  return onSnapshot(q, (snapshot) => {
    let hasChanges = false;
    snapshot.docChanges().forEach((change) => {
      hasChanges = true;
      if (change.type === 'removed') {
        filesMap.delete(change.doc.id);
      } else {
        filesMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as RepositoryFile);
      }
    });

    if (hasChanges || snapshot.empty) {
      const sortedFiles = Array.from(filesMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      callback(sortedFiles);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const uploadRepositoryFile = async (folderId: string | null, file: File, onProgress?: (progress: number) => void): Promise<string> => {
  if (!auth.currentUser) throw new Error("Requires authentication");
  const userId = auth.currentUser.uid;
  const fileId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const chunkSize = 250000; // 250KB per chunk to be safely under 1MB even with overhead
        const chunksCount = Math.ceil(base64Data.length / chunkSize);
        
        for (let i = 0; i < chunksCount; i++) {
          const chunkData = base64Data.substring(i * chunkSize, (i + 1) * chunkSize);
          const chunkPath = `repository_files/${fileId}/chunks/chunk_${i}`;
          try {
             // Added await with simple Promise wrapper to ensure event loop ticks
             await new Promise(r => setTimeout(r, 10));
             await setDoc(doc(db, chunkPath), { data: chunkData });
             console.log(`Uploaded chunk ${i+1}/${chunksCount}`);
          } catch(err) {
             console.error("Error setting chunk doc:", chunkPath, err);
             throw err;
          }
          
          if (onProgress) {
             onProgress(Math.round(((i + 1) / chunksCount) * 100));
          }
        }
        
        const path = `repository_files/${fileId}`;
        const newFile: RepositoryFile = {
            id: fileId,
            folderId: folderId || '',
            name: file.name,
            userId,
            storagePath: '',
            size: file.size,
            type: file.type || 'application/octet-stream',
            createdAt: Date.now(),
            chunkCount: chunksCount
        };
        
        try {
            await setDoc(doc(db, path), newFile);
        } catch(err) {
            console.error("Error setting main file doc:", path, err);
            throw err;
        }
        resolve(fileId);
      } catch (e) {
          reject(e);
      }
    };
    reader.onerror = (error) => {
        console.error("File reading error:", error);
        reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export const getFileDownloadUrl = async (file: RepositoryFile): Promise<string> => {
  if (file.chunkCount) {
    let base64 = '';
    for (let i = 0; i < file.chunkCount; i++) {
       const chunkPath = `repository_files/${file.id}/chunks/chunk_${i}`;
       const snap = await getDoc(doc(db, chunkPath));
       if (snap.exists()) {
          base64 += snap.data().data;
       }
    }
    return `data:${file.type || 'application/octet-stream'};base64,${base64}`;
  } else if (file.storagePath) {
    const fileRef = ref(storage, file.storagePath);
    return await getDownloadURL(fileRef);
  }
  throw new Error("File output missing");
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
  
  if (file.chunkCount) {
      for (let i = 0; i < file.chunkCount; i++) {
          const chunkPath = `repository_files/${file.id}/chunks/chunk_${i}`;
          try {
             await deleteDoc(doc(db, chunkPath));
          } catch(e) { console.warn("Failed to delete chunk", e); }
      }
  } else if (file.storagePath) {
      try {
        const storageRef = ref(storage, file.storagePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("Storage object may already be deleted:", e);
      }
  }

  const path = `repository_files/${file.id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};