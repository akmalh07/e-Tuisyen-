import { 
  CenterSettings, 
  ClassSession, 
  Student, 
  PaymentRecord, 
  AttendanceRecord, 
  GradeRecord 
} from '../types';
import { 
  initialSettings, 
  initialClasses, 
  initialStudents, 
  initialPayments, 
  initialAttendance, 
  initialGrades 
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'tuition_app_settings',
  CLASSES: 'tuition_app_classes',
  STUDENTS: 'tuition_app_students',
  PAYMENTS: 'tuition_app_payments',
  ATTENDANCE: 'tuition_app_attendance',
  GRADES: 'tuition_app_grades'
};

export interface AppStateData {
  settings: CenterSettings;
  classes: ClassSession[];
  students: Student[];
  payments: PaymentRecord[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
}

export function loadAppState(): AppStateData {
  try {
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const rawClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const rawAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const rawGrades = localStorage.getItem(STORAGE_KEYS.GRADES);

    return {
      settings: rawSettings ? JSON.parse(rawSettings) : initialSettings,
      classes: rawClasses ? JSON.parse(rawClasses) : initialClasses,
      students: rawStudents ? JSON.parse(rawStudents) : initialStudents,
      payments: rawPayments ? JSON.parse(rawPayments) : initialPayments,
      attendance: rawAttendance ? JSON.parse(rawAttendance) : initialAttendance,
      grades: rawGrades ? JSON.parse(rawGrades) : initialGrades,
    };
  } catch (error) {
    console.error('Ralat membaca storan tempatan, menggunakan data lalai:', error);
    return {
      settings: initialSettings,
      classes: initialClasses,
      students: initialStudents,
      payments: initialPayments,
      attendance: initialAttendance,
      grades: initialGrades,
    };
  }
}

export function saveAppState(state: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(state.classes));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(state.payments));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(state.attendance));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(state.grades));
  } catch (error) {
    console.error('Ralat menyimpan ke storan tempatan:', error);
  }
}

export function exportBackupJson(state: AppStateData): void {
  const exportData = {
    appName: 'e-Tuisyen Pintar',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data: state
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `Sandaran_eTuisyen_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetAllToSampleData(): AppStateData {
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CLASSES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.GRADES);

  return {
    settings: initialSettings,
    classes: initialClasses,
    students: initialStudents,
    payments: initialPayments,
    attendance: initialAttendance,
    grades: initialGrades
  };
}
