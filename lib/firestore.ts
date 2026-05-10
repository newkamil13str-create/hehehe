import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { adminDb } from "./firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { User, Order, Deposit, AppSettings } from "@/types";

// ─── User (client) ────────────────────────────────────────────────────────────

export async function createUserDocClient(uid: string, data: Partial<User>) {
  await setDoc(doc(db, "users", uid), {
    uid,
    balance: 0,
    role: "user",
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    ...data,
  });
}

export async function getUserDocClient(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export function subscribeUserDoc(uid: string, cb: (user: User) => void): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) cb(snap.data() as User);
  });
}

export async function getUserOrders(
  uid: string,
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
  const constraints: any[] = [
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const q = query(collection(db, "orders"), ...constraints);
  return getDocs(q);
}

export async function getUserDeposits(uid: string) {
  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return getDocs(q);
}

export async function getDepositById(depositId: string) {
  const snap = await getDoc(doc(db, "deposits", depositId));
  return snap.exists() ? (snap.data() as Deposit) : null;
}

export function subscribeDeposit(depositId: string, cb: (d: Deposit) => void): Unsubscribe {
  return onSnapshot(doc(db, "deposits", depositId), (snap) => {
    if (snap.exists()) cb(snap.data() as Deposit);
  });
}

export function subscribeOrder(orderId: string, cb: (o: Order) => void): Unsubscribe {
  return onSnapshot(doc(db, "orders", orderId), (snap) => {
    if (snap.exists()) cb(snap.data() as Order);
  });
}

// ─── Settings (admin SDK, server-side only) ───────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const snap = await adminDb.doc("settings/config").get();
  if (!snap.exists) {
    return {
      markup: 500,
      jasaApiKey: process.env.JASAOTP_API_KEY ?? "",
      pakasirApiKey: process.env.PAKASIR_API_KEY ?? "",
      pakasirProject: process.env.PAKASIR_PROJECT ?? "",
      maintenanceMode: false,
      announcementText: "",
      minDeposit: 10000,
      maxDeposit: 1000000,
    };
  }
  return snap.data() as AppSettings;
}

export async function updateSettings(data: Partial<AppSettings>) {
  await adminDb.doc("settings/config").set(data, { merge: true });
}

// ─── Orders (admin SDK) ───────────────────────────────────────────────────────

export async function createOrderAdmin(order: Omit<Order, "createdAt" | "updatedAt">) {
  const ref = adminDb.doc(`orders/${order.orderId}`);
  await ref.set({
    ...order,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateOrderOtp(orderId: string, otp: string) {
  await adminDb.doc(`orders/${orderId}`).update({
    otp,
    status: "received",
    updatedAt: Timestamp.now(),
  });
}

export async function cancelOrderAdmin(orderId: string) {
  await adminDb.doc(`orders/${orderId}`).update({
    status: "cancelled",
    updatedAt: Timestamp.now(),
  });
}

export async function getOrderAdmin(orderId: string) {
  const snap = await adminDb.doc(`orders/${orderId}`).get();
  return snap.exists ? { ...(snap.data() as Order), orderId: snap.id } : null;
}

// ─── Balance (atomic transactions) ───────────────────────────────────────────

export async function deductBalance(uid: string, amount: number): Promise<void> {
  await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.doc(`users/${uid}`);
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User tidak ditemukan");
    const balance = (snap.data()?.balance as number) ?? 0;
    if (balance < amount) throw new Error("Saldo tidak cukup");
    tx.update(userRef, { balance: FieldValue.increment(-amount) });
  });
}

export async function addBalance(uid: string, amount: number): Promise<void> {
  await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.doc(`users/${uid}`);
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User tidak ditemukan");
    tx.update(userRef, { balance: FieldValue.increment(amount) });
  });
}

export async function setBalanceAdmin(uid: string, balance: number): Promise<void> {
  await adminDb.doc(`users/${uid}`).update({ balance });
}

// ─── Admin queries ─────────────────────────────────────────────────────────

export async function getAllUsersAdmin(pageSize = 50) {
  const snap = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .get();
  return snap.docs.map((d) => d.data() as User);
}

export async function getAllOrdersAdmin(filters?: {
  status?: string;
  limit?: number;
}) {
  let q = adminDb.collection("orders").orderBy("createdAt", "desc");
  if (filters?.status) q = q.where("status", "==", filters.status) as any;
  const snap = await q.limit(filters?.limit ?? 100).get();
  return snap.docs.map((d) => d.data() as Order);
}

export async function getAllDepositsAdmin(status?: string) {
  let q = adminDb.collection("deposits").orderBy("createdAt", "desc");
  if (status) q = q.where("status", "==", status) as any;
  const snap = await q.limit(100).get();
  return snap.docs.map((d) => d.data() as Deposit);
}

export async function getAdminStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tsDay = Timestamp.fromDate(startOfDay);

  const [usersSnap, ordersSnap, todayOrdersSnap, todayDepositsSnap] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("orders").count().get(),
    adminDb.collection("orders").where("createdAt", ">=", tsDay).count().get(),
    adminDb.collection("deposits").where("status", "==", "paid").where("createdAt", ">=", tsDay).get(),
  ]);

  const todayRevenue = todayDepositsSnap.docs.reduce(
    (sum, d) => sum + ((d.data() as Deposit).amount ?? 0),
    0
  );

  return {
    totalUsers: usersSnap.data().count,
    totalOrders: ordersSnap.data().count,
    todayOrders: todayOrdersSnap.data().count,
    todayRevenue,
  };
}
