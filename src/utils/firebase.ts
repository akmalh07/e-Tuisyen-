import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppStateData } from './storage';
import { 
  initialSettings, 
  initialStudents, 
  initialClasses, 
  initialPayments, 
  initialAttendance, 
  initialGrades 
} from '../data/initialData';
import { 
  Student, 
  ClassSession, 
  PaymentRecord, 
  AttendanceRecord, 
  GradeRecord, 
  CenterSettings 
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

// Utility to recursively strip undefined properties prior to sending payloads to Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        sanitized[key] = sanitizeForFirestore(val);
      } else {
        sanitized[key] = val;
      }
    }
  });
  return sanitized;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'test_connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Seed initial data to Firestore ONLY IF never cleared by user
export async function seedInitialFirestoreData() {
  try {
    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (!settingsSnap.empty) {
      const settingsData = settingsSnap.docs[0].data();
      if (settingsData && settingsData.isSampleDataCleared) {
        return; // User explicitly cleared sample data!
      }
    }

    const studentsSnap = await getDocs(collection(db, 'students'));
    if (!studentsSnap.empty) {
      return; // Already populated
    }

    console.log('Seeding initial data to Firestore...');
    const batch = writeBatch(db);

    // Settings
    batch.set(doc(db, 'settings', 'main'), sanitizeForFirestore({ ...initialSettings, isSampleDataCleared: false }));

    // Students
    initialStudents.forEach(s => {
      batch.set(doc(db, 'students', s.id), sanitizeForFirestore(s));
    });

    // Classes
    initialClasses.forEach(c => {
      batch.set(doc(db, 'classes', c.id), sanitizeForFirestore(c));
    });

    // Payments
    initialPayments.forEach(p => {
      batch.set(doc(db, 'payments', p.id), sanitizeForFirestore(p));
    });

    // Attendance
    initialAttendance.forEach(a => {
      batch.set(doc(db, 'attendance', a.id), sanitizeForFirestore(a));
    });

    // Grades
    initialGrades.forEach(g => {
      batch.set(doc(db, 'grades', g.id), sanitizeForFirestore(g));
    });

    await batch.commit();
    console.log('Initial Firestore data seeded successfully!');
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

// Clear all sample data completely from Firestore (triggered on demand by user)
export async function clearAllFirestoreData() {
  try {
    console.log('Clearing all sample data from Firestore...');
    const collections = ['students', 'classes', 'payments', 'attendance', 'grades'];
    
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Keep center settings structure but mark as sample data cleared
    await setDoc(doc(db, 'settings', 'main'), sanitizeForFirestore({
      ...initialSettings,
      isSampleDataCleared: true
    }));

    // Also clear localStorage
    localStorage.removeItem('tuition_center_app_state');
    localStorage.setItem('tuition_center_sample_cleared', 'true');
    console.log('All sample data cleared successfully!');
  } catch (err) {
    console.error('Error clearing Firestore sample data:', err);
  }
}

// Real-time listener subscriber across all 6 collections
export function subscribeToRealtimeAppState(
  onUpdate: (data: Partial<AppStateData>) => void
) {
  // Ensure initial seed check
  seedInitialFirestoreData();

  const unsubSettings = onSnapshot(
    collection(db, 'settings'),
    (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data() as CenterSettings;
        onUpdate({ settings: docData });
      } else {
        onUpdate({ settings: initialSettings });
      }
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'settings')
  );

  const unsubStudents = onSnapshot(
    collection(db, 'students'),
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Student);
      onUpdate({ students: list });
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'students')
  );

  const unsubClasses = onSnapshot(
    collection(db, 'classes'),
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as ClassSession);
      onUpdate({ classes: list });
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'classes')
  );

  const unsubPayments = onSnapshot(
    collection(db, 'payments'),
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as PaymentRecord);
      onUpdate({ payments: list });
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
  );

  const unsubAttendance = onSnapshot(
    collection(db, 'attendance'),
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
      onUpdate({ attendance: list });
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'attendance')
  );

  const unsubGrades = onSnapshot(
    collection(db, 'grades'),
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as GradeRecord);
      onUpdate({ grades: list });
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'grades')
  );

  return () => {
    unsubSettings();
    unsubStudents();
    unsubClasses();
    unsubPayments();
    unsubAttendance();
    unsubGrades();
  };
}

// Write helper functions for individual entities
export async function syncStudentToFirestore(student: Student) {
  try {
    const sanitized = sanitizeForFirestore(student);
    await setDoc(doc(db, 'students', student.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `students/${student.id}`);
  }
}

export async function removeStudentFromFirestore(studentId: string) {
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `students/${studentId}`);
  }
}

export async function syncClassToFirestore(classSession: ClassSession) {
  try {
    const sanitized = sanitizeForFirestore(classSession);
    await setDoc(doc(db, 'classes', classSession.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `classes/${classSession.id}`);
  }
}

export async function removeClassFromFirestore(classId: string) {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
  }
}

export async function syncPaymentToFirestore(payment: PaymentRecord) {
  try {
    const sanitized = sanitizeForFirestore(payment);
    await setDoc(doc(db, 'payments', payment.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `payments/${payment.id}`);
  }
}

export async function removePaymentFromFirestore(paymentId: string) {
  try {
    await deleteDoc(doc(db, 'payments', paymentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `payments/${paymentId}`);
  }
}

export async function syncAttendanceListToFirestore(attendanceRecords: AttendanceRecord[]) {
  try {
    const batch = writeBatch(db);
    attendanceRecords.forEach(record => {
      batch.set(doc(db, 'attendance', record.id), sanitizeForFirestore(record));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'attendance');
  }
}

export async function syncGradeToFirestore(grade: GradeRecord) {
  try {
    const sanitized = sanitizeForFirestore(grade);
    await setDoc(doc(db, 'grades', grade.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `grades/${grade.id}`);
  }
}

export async function removeGradeFromFirestore(gradeId: string) {
  try {
    await deleteDoc(doc(db, 'grades', gradeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `grades/${gradeId}`);
  }
}

export async function syncSettingsToFirestore(settings: CenterSettings) {
  try {
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(doc(db, 'settings', 'main'), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/main');
  }
}

export async function resetFirestoreToSampleData() {
  try {
    const collections = ['students', 'classes', 'payments', 'attendance', 'grades', 'settings'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await seedInitialFirestoreData();
  } catch (err) {
    console.error('Error resetting Firestore:', err);
  }
}
