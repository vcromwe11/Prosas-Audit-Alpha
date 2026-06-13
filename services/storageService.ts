import { SavedReport, AuditResult, Idea, IdeaComment, StoredPrompt, GlobalPrompt, UserProfile } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, onSnapshot, writeBatch, orderBy } from 'firebase/firestore';
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
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Usuário',
        avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=C13B2E&color=fff&size=128`,
        role: 'viewer'
      };
      
      try {
        const payload = {
          ...newUserProfile,
          displayName: newUserProfile.name,
          createdAt: new Date().toISOString()
        };
        console.log("Saving user profile:", JSON.stringify(payload));
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
    editalName: editalName || "Edital Geral",
    candidateName: result.candidateName || "Candidato Desconhecido",
    cnpj: result.organizationData?.cnpj || "N/A",
    timestamp: Date.now(),
    result: result,
    promptId: promptId
  };

  const path = `users/${userId}/reports`;
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