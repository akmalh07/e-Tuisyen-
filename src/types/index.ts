export type StudentStatus = 'active' | 'suspended' | 'inactive';
export type DayOfWeek = 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu' | 'Ahad';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'DuitNow / Bank Transfer' | 'Tunai' | 'Kad / Online Banking';

export interface Student {
  id: string;
  name: string;
  icOrMyKid: string;
  level: string; // cth: 'Tingkatan 5', 'Tingkatan 4', 'Tahun 6'
  school: string;
  parentName: string;
  parentPhone: string; // Format: 60123456789
  parentEmail?: string;
  registeredClassIds: string[]; // ID kelas yang didaftarkan
  monthlyFee: number; // Jumlah yuran bulanan dalam RM
  registrationDate: string; // YYYY-MM-DD (Tarikh Masuk/Mendaftar)
  exitDate?: string; // YYYY-MM-DD (Tarikh Keluar/Berhenti/Tamat)
  exitReason?: string; // Sebab berhenti/tamat
  status: StudentStatus;
  notes?: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  level: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm (cth: '20:00')
  endTime: string;   // HH:mm (cth: '21:30')
  tutorName: string;
  room: string;
  feePerMonth: number;
  maxCapacity: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // cth: 'RCP-2026-0012'
  studentId: string;
  month: string; // Format: 'YYYY-MM', cth: '2026-10' (Oktober 2026)
  amountDue: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  status: PaymentStatus;
  referenceNo?: string;
  receivedBy: string;
  notes?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subject: string;
  examName: string; // cth: 'Ujian Bulanan 1', 'Peperiksaan Percubaan SPM'
  marks: number;
  maxMarks: number;
  grade: string;
  tutorFeedback: string;
  date: string; // YYYY-MM-DD
}

export interface CenterSettings {
  centerName: string;
  tagline: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  receiptPrefix: string;
  currency: string;
  principalName: string;
}
