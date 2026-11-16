import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  preferredShowroom: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ReservationRecord {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleId: string;
  vehicleName: string;
  trimName: string;
  exteriorColor: string;
  interiorFinish: string;
  wheelPackage: string;
  vehiclePrice: number;
  depositAmount: number;
  paymentMethod: 'card' | 'wire' | 'apple_pay';
  cardLast4: string;
  transactionRef: string;
  paymentStatus: 'paid' | 'refunded';
  reservationStatus: 'confirmed' | 'cancelled';
  showroomLocation: string;
  deliveryWindow: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

export interface TourBookingRecord {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  tourType: 'virtual_live' | 'showroom_visit';
  showroomLocation: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: 'scheduled' | 'cancelled';
  createdAt?: { seconds: number; nanoseconds: number } | null;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

function sanitizeId(raw: string, maxLen = 64): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, maxLen);
  return cleaned || 'id-1';
}

function clampStr(raw: string, maxLen: number, fallback = ''): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User): Promise<UserProfileRecord> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileRecord;
    }
    const profile: UserProfileRecord = {
      uid: sanitizeId(user.uid, 128),
      displayName: clampStr(user.displayName || 'Valued Client', 100, 'Valued Client'),
      email: clampStr(user.email || 'client@velocemotors.com', 160, 'client@velocemotors.com'),
      phone: '',
      preferredShowroom: 'San Francisco Flagship',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: { displayName: string; phone: string; preferredShowroom: string }
): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    await updateDoc(ref, {
      displayName: clampStr(updates.displayName, 100, 'Valued Client'),
      phone: clampStr(updates.phone, 32, ''),
      preferredShowroom: clampStr(updates.preferredShowroom, 80, 'San Francisco Flagship'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createReservation(
  input: Omit<ReservationRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReservationRecord> {
  const reservationId = sanitizeId(
    `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    64
  );
  const path = `reservations/${reservationId}`;
  const ref = doc(db, 'reservations', reservationId);

  const payload = {
    userId: sanitizeId(input.userId, 128),
    customerName: clampStr(input.customerName, 100, 'Valued Client'),
    customerEmail: clampStr(input.customerEmail, 160, 'client@velocemotors.com'),
    customerPhone: clampStr(input.customerPhone, 32, '000-000-0000'),
    vehicleId: sanitizeId(input.vehicleId, 64),
    vehicleName: clampStr(input.vehicleName, 120, 'Veloce Vehicle'),
    trimName: clampStr(input.trimName, 80, 'Standard'),
    exteriorColor: clampStr(input.exteriorColor, 60, 'Obsidian'),
    interiorFinish: clampStr(input.interiorFinish, 60, 'Cognac Nappa'),
    wheelPackage: clampStr(input.wheelPackage, 80, 'Forged 20'),
    vehiclePrice: Math.max(10000, Math.min(2000000, Math.round(input.vehiclePrice))),
    depositAmount: Math.max(500, Math.min(100000, Math.round(input.depositAmount))),
    paymentMethod: input.paymentMethod,
    cardLast4: clampStr(input.cardLast4, 4, '0000').padStart(4, '0').slice(-4),
    transactionRef: sanitizeId(input.transactionRef, 64),
    paymentStatus: 'paid' as const,
    reservationStatus: 'confirmed' as const,
    showroomLocation: clampStr(input.showroomLocation, 80, 'San Francisco Flagship'),
    deliveryWindow: clampStr(input.deliveryWindow, 60, '4–6 Weeks'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
    return {
      ...payload,
      id: reservationId,
      createdAt: null,
      updatedAt: null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const path = `reservations/${reservationId}`;
  const ref = doc(db, 'reservations', reservationId);
  try {
    await updateDoc(ref, {
      reservationStatus: 'cancelled',
      paymentStatus: 'refunded',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateReservationShowroom(
  reservationId: string,
  showroomLocation: string,
  deliveryWindow: string
): Promise<void> {
  const path = `reservations/${reservationId}`;
  const ref = doc(db, 'reservations', reservationId);
  try {
    await updateDoc(ref, {
      showroomLocation: clampStr(showroomLocation, 80, 'San Francisco Flagship'),
      deliveryWindow: clampStr(deliveryWindow, 60, '4–6 Weeks'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createTourBooking(
  input: Omit<TourBookingRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<TourBookingRecord> {
  const bookingId = sanitizeId(
    `tour_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    64
  );
  const path = `tourBookings/${bookingId}`;
  const ref = doc(db, 'tourBookings', bookingId);

  const payload = {
    userId: sanitizeId(input.userId, 128),
    vehicleId: sanitizeId(input.vehicleId, 64),
    vehicleName: clampStr(input.vehicleName, 120, 'Veloce Vehicle'),
    tourType: input.tourType,
    showroomLocation: clampStr(input.showroomLocation, 80, 'San Francisco Flagship'),
    preferredDate: clampStr(input.preferredDate, 32, '2026-11-24'),
    preferredTime: clampStr(input.preferredTime, 24, '11:00 AM'),
    notes: input.notes.trim().slice(0, 400),
    status: 'scheduled' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
    return {
      ...payload,
      id: bookingId,
      createdAt: null,
      updatedAt: null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelTourBooking(bookingId: string): Promise<void> {
  const path = `tourBookings/${bookingId}`;
  const ref = doc(db, 'tourBookings', bookingId);
  try {
    await updateDoc(ref, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserReservations(
  uid: string,
  onData: (items: ReservationRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'reservations';
  const q = query(
    collection(db, path),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const records: ReservationRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ReservationRecord, 'id'>),
      }));
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );
}

export function subscribeUserTourBookings(
  uid: string,
  onData: (items: TourBookingRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'tourBookings';
  const q = query(
    collection(db, path),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const records: TourBookingRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TourBookingRecord, 'id'>),
      }));
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );
}
