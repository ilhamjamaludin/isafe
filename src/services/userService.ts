'use client';

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { CustomUser, UserRole } from '@/types/user';

export class UserService {
  
  // Utility function to remove undefined values from objects before Firestore save
  private cleanDataForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }
  
  // Get all users
  async getUsers(): Promise<CustomUser[]> {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as CustomUser[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(uid: string): Promise<CustomUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return {
          uid,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate() || new Date()
        } as CustomUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user (Admin only)
  async createUser(email: string, password: string, role: UserRole, displayName?: string): Promise<CustomUser> {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        role,
        displayName: displayName || '',
        createdAt: new Date()
      };

      // Save user data to Firestore using the same UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), 
        this.cleanDataForFirestore({
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt)
        })
      );

      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(uid: string, updates: Partial<Pick<CustomUser, 'displayName' | 'role'>>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, 
        this.cleanDataForFirestore({
          ...updates,
          updatedAt: Timestamp.now()
        })
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(uid: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', uid));
      
      // Note: Deleting from Firebase Auth requires the user to be signed in
      // In a real app, you would need Firebase Admin SDK for this
      // For now, we'll just delete from Firestore
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<CustomUser[]> {
    try {
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'users'),
        where('role', '==', role)
      );
      const querySnapshot = await getDocs(q);
      
      const users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as CustomUser[];

      // Sort in JavaScript instead of Firestore
      return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    adminCount: number;
    workerCount: number;
    viewerCount: number;
  }> {
    try {
      const users = await this.getUsers();
      
      return {
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        workerCount: users.filter(u => u.role === 'worker').length,
        viewerCount: users.filter(u => u.role === 'viewer').length,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
}
