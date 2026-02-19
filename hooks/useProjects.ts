/**
 * useProjects — Hook for managing user projects
 *
 * Handles Firestore CRUD operations with cursor-based pagination.
 * Extracted from Dashboard page for reusability and testability.
 *
 * @module hooks/useProjects
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
} from '@/lib/firebase/client';

const PAGE_SIZE = 25;

export interface UserProject {
  id: string;
  userId: string;
  name: string;
  width: number;
  height: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  thumbnail?: string;
}

interface UseProjectsReturn {
  projects: UserProject[];
  recentProjects: UserProject[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  loadMore: () => Promise<void>;
  createProject: (userId: string) => Promise<string | null>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  duplicateProject: (project: UserProject, userId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

export function useProjects(userId: string | undefined): UseProjectsReturn {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [recentProjects, setRecentProjects] = useState<UserProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // Fetch initial page of projects
  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isFirebaseConfigured()) {
          setProjects([]);
          setRecentProjects([]);
          setIsLoading(false);
          return;
        }

        const db = getFirebaseDb();
        const projectsQuery = query(
          collection(db, 'user_projects'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc'),
          limit(PAGE_SIZE)
        );

        const snapshot = await getDocs(projectsQuery);
        const projectsData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as UserProject[];

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setProjects(projectsData);
        setRecentProjects(projectsData.slice(0, 3));
      } catch (err) {
        console.error('[useProjects] Failed to fetch projects:', err);
        setError('Failed to load projects. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (!userId || !lastDocRef.current || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const db = getFirebaseDb();
      const nextQuery = query(
        collection(db, 'user_projects'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(nextQuery);
      const nextProjects = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as UserProject[];

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setProjects(prev => [...prev, ...nextProjects]);
    } catch (err) {
      console.error('[useProjects] Failed to load more:', err);
      setError('Failed to load more projects.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, isLoadingMore]);

  // Create new project, returns the new doc ID or null on error
  const createProject = useCallback(async (uid: string): Promise<string | null> => {
    try {
      if (!isFirebaseConfigured()) {
        setError('Projects require Firebase. Not available in dev mode.');
        return null;
      }

      const db = getFirebaseDb();
      const docRef = await addDoc(collection(db, 'user_projects'), {
        userId: uid,
        name: 'Untitled',
        width: 1920,
        height: 1080,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.error('[useProjects] Failed to create project:', err);
      setError('Failed to create project. Please try again.');
      return null;
    }
  }, []);

  // Rename project
  const renameProject = useCallback(async (projectId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      if (!isFirebaseConfigured()) return;
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'user_projects', projectId), {
        name: newName.trim(),
        updatedAt: serverTimestamp(),
      });

      const trimmed = newName.trim();
      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, name: trimmed } : p)));
      setRecentProjects(prev => prev.map(p => (p.id === projectId ? { ...p, name: trimmed } : p)));
    } catch (err) {
      console.error('[useProjects] Failed to rename:', err);
      setError('Failed to rename project.');
    }
  }, []);

  // Duplicate project
  const duplicateProject = useCallback(async (project: UserProject, uid: string) => {
    try {
      if (!isFirebaseConfigured()) return;
      const db = getFirebaseDb();

      const newDocRef = await addDoc(collection(db, 'user_projects'), {
        userId: uid,
        name: `${project.name} (copy)`,
        width: project.width,
        height: project.height,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const now = Timestamp.now();
      setProjects(prev => [
        {
          id: newDocRef.id,
          userId: uid,
          name: `${project.name} (copy)`,
          width: project.width,
          height: project.height,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('[useProjects] Failed to duplicate:', err);
      setError('Failed to duplicate project.');
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      if (!isFirebaseConfigured()) return;
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'user_projects', projectId));

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setRecentProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('[useProjects] Failed to delete:', err);
      setError('Failed to delete project.');
    }
  }, []);

  return {
    projects,
    recentProjects,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    setError,
    loadMore,
    createProject,
    renameProject,
    duplicateProject,
    deleteProject,
  };
}
