import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Hashing function using Web Crypto API
export const generateCacheKey = async (data: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const getCachedAudit = async (cacheKey: string): Promise<any | null> => {
  try {
    const docRef = doc(db, 'ai_audits_cache', cacheKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().result;
    }
    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

export const setCachedAudit = async (cacheKey: string, result: any, promptText: string): Promise<void> => {
  try {
    const docRef = doc(db, 'ai_audits_cache', cacheKey);
    await setDoc(docRef, {
      result,
      promptText,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error writing cache:", error);
  }
};
