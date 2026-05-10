"use client";

import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "@/types";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = undefined;
      }

      if (!fbUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      unsubFirestore = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
        if (snap.exists()) {
          setUserData(snap.data() as User);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    // clear session cookie
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  const getIdToken = useCallback(async (): Promise<string> => {
    if (!firebaseUser) throw new Error("Not authenticated");
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getIdToken();
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers ?? {}),
        },
      });
    },
    [getIdToken]
  );

  return {
    firebaseUser,
    userData,
    loading,
    isAdmin: userData?.role === "admin",
    logout,
    getIdToken,
    authFetch,
  };
}
