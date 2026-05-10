import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  balance: number;
  role: "user" | "admin";
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface Order {
  orderId: string;
  uid: string;
  jasaOrderId: number;
  number: string;
  negara: number;
  namaLayanan: string;
  layananCode: string;
  operator: string;
  harga: number;
  status: "waiting" | "received" | "cancelled" | "expired";
  otp: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Deposit {
  depositId: string;
  uid: string;
  amount: number;
  fee: number;
  totalPayment: number;
  paymentMethod: string;
  pakasirOrderId: string;
  paymentNumber: string;
  expiredAt: Timestamp;
  status: "pending" | "paid" | "expired";
  createdAt: Timestamp;
}

export interface AppSettings {
  markup: number;
  jasaApiKey: string;
  pakasirApiKey: string;
  pakasirProject: string;
  maintenanceMode: boolean;
  announcementText: string;
  minDeposit: number;
  maxDeposit: number;
}

export interface JasaService {
  id: string;
  name: string;
  code: string;
  harga: number;
  stok: number;
}

export interface JasaCountry {
  id: number;
  name: string;
}

export interface JasaOperator {
  id: string;
  name: string;
}

export interface JasaOrderResult {
  order_id: number;
  number: string;
  status?: string;
}

export interface JasaOtpResult {
  sms?: string;
  status?: string;
}

export interface PakasirResult {
  payment_number: string;
  fee: number;
  total: number;
  expired_at: string;
  status?: string;
}
