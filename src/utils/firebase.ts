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

// Seed initial data to Firestore if database is empty
export async function seedInitialFirestoreData() {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (!studentsSnap.empty) {
      return; // Already populated
    }

    console.log('Seeding initial data to Firestore...');
    const batch = writeBatch(db);

    // Settings
    batch.set(doc(db, 'settings', 'main'), initialSettings);

    // Students
    initialStudents.forEach(s => {
      batch.set(doc(db, 'students', s.id), s);
    });

    // Classes
    initialClasses.forEach(c => {
      batch.set(doc(db, 'classes', c.id), c);
    });

    // Payments
    initialPayments.forEach(p => {
      batch.set(doc(db, 'payments', p.id), p);
    });

    // Attendance
    initialAttendance.forEach(a => {
      batch.set(doc(db, 'attendance', a.id), a);
    });

    // Grades
    initialGrades.forEach(g => {
      batch.set(doc(db, 'grades', g.id), g);
    });

    await batch.commit();
    console.log('Initial Firestore data seeded successfully!');
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

// Real-time listener subscriber across all 6 collections
export function subscribeToRealtimeAppState(
  onUpdate: (data: Partial<AppStateData>) => void
) {
  // Ensure initial seed is done if empty
  seedInitialFirestoreData();

  const unsubSettings = onSnapshot(
    collection(db, 'settings'),
    (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data() as CenterSettings;
        onUpdate({ settings: docData });
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
    await setDoc(doc(db, 'students', student.id), student);
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
    await setDoc(doc(db, 'classes', classSession.id), classSession);
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
    await setDoc(doc(db, 'payments', payment.id), payment);
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
      batch.set(doc(db, 'attendance', record.id), record);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'attendance');
  }
}

export async function syncGradeToFirestore(grade: GradeRecord) {
  try {
    await setDoc(doc(db, 'grades', grade.id), grade);
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
    await setDoc(doc(db, 'settings', 'main'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/main');
  }
}

export async function resetFirestoreToSampleData() {
  try {
    const collections = ['students', 'classes', 'payments', 'attendance', 'grades', 'settings'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await seedInitialFirestoreData();
  } catch (err) {
    console.error('Error resetting Firestore:', err);
  }
}
