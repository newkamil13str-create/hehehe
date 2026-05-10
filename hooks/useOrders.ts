"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types";
import { useAuth } from "./useAuth";

export function useOrders(pageSize = 10) {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("uid", "==", firebaseUser.uid),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => d.data() as Order));
      setLoading(false);
    });

    return unsub;
  }, [firebaseUser, pageSize]);

  return { orders, loading };
}

export function useActiveOrders() {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, "orders"),
      where("uid", "==", firebaseUser.uid),
      where("status", "==", "waiting"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => d.data() as Order));
    });

    return unsub;
  }, [firebaseUser]);

  return orders;
}
