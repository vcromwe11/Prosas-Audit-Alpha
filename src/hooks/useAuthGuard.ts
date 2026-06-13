import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppStage } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export interface UseAuthGuardOptions {
  stage?: AppStage;
  onUnauthorized?: () => void;
  requireAdmin?: boolean;
}

export const useAuthGuard = (options?: UseAuthGuardOptions) => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;

    // Check if user is trying to access an admin-only feature while not being an admin
    if (options?.requireAdmin && user.role !== 'admin') {
      console.warn('Unauthorized access attempt: requires admin role.');
      if (options?.onUnauthorized) {
        options.onUnauthorized();
      }
    }
    
    // Check if the user document is in sync with the requested permissions
    const verifyIntegrity = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const actualRole = userDoc.data().role;
          
          if (user.role !== actualRole) {
            console.error('Role mismatch detected. Forcing relogin or rejecting action.');
            // We could force a sign out or just fire the unauthorized callback
            if (options?.requireAdmin && actualRole !== 'admin') {
                if (options?.onUnauthorized) {
                    options.onUnauthorized();
                }
            }
          }
        }
      } catch (error) {
        console.error('Error verifying user role:', error);
      }
    };
    
    verifyIntegrity();
  }, [user, options?.stage, options?.requireAdmin]);

  // Expose an imperative check for specific actions
  const checkPermission = (action: 'edit_profile' | 'change_role' | 'mutate_data' | 'admin_action'): boolean => {
    if (!user) return false;
    
    if (action === 'admin_action' || action === 'change_role') {
      return user.role === 'admin';
    }
    
    if (action === 'mutate_data') {
      return user.role === 'admin' || user.role === 'analyst';
    }
    
    if (action === 'edit_profile') {
       return true; // Anyone can edit their own basic profile, but role change is checked independently
    }
    
    return false;
  };

  return { checkPermission };
};
