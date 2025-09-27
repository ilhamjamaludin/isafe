'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/services/userService';
import { CustomUser, UserRole } from '@/types/user';

const userService = new UserService();

export const useUsers = () => {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(async (email: string, password: string, role: UserRole, displayName?: string) => {
    try {
      setError(null);
      const newUser = await userService.createUser(email, password, role, displayName);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateUser = useCallback(async (uid: string, updates: Partial<Pick<CustomUser, 'displayName' | 'role'>>) => {
    try {
      setError(null);
      await userService.updateUser(uid, updates);
      setUsers(prev => 
        prev.map(user => 
          user.uid === uid 
            ? { ...user, ...updates }
            : user
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteUser = useCallback(async (uid: string) => {
    try {
      setError(null);
      await userService.deleteUser(uid);
      setUsers(prev => prev.filter(user => user.uid !== uid));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch
  };
};

export const useUserStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    workerCount: 0,
    viewerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userStats = await userService.getUserStats();
      setStats(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

export const useUsersByRole = (role: UserRole) => {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersByRole = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getUsersByRole(role);
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users by role');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchUsersByRole();
  }, [fetchUsersByRole]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsersByRole
  };
};
