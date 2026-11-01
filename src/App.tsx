import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentManager } from './components/StudentManager';
import { ScheduleManager } from './components/ScheduleManager';
import { AttendanceTracker } from './components/AttendanceTracker';
import { FeeBillingHub } from './components/FeeBillingHub';
import { StudentProgress } from './components/StudentProgress';
import { ReceiptModal } from './components/ReceiptModal';
import { CenterSettingsModal } from './components/CenterSettingsModal';
import { 
  Student, 
  ClassSession, 
  PaymentRecord, 
  AttendanceRecord, 
  GradeRecord, 
  CenterSettings 
} from './types';
import { 
  loadAppState, 
  saveAppState, 
  exportBackupJson, 
  resetAllToSampleData, 
  AppStateData 
} from './utils/storage';
import { 
  subscribeToRealtimeAppState,
  syncStudentToFirestore,
  removeStudentFromFirestore,
  syncClassToFirestore,
  removeClassFromFirestore,
  syncPaymentToFirestore,
  removePaymentFromFirestore,
  syncAttendanceListToFirestore,
  syncGradeToFirestore,
  removeGradeFromFirestore,
  syncSettingsToFirestore,
  resetFirestoreToSampleData,
  clearAllFirestoreData
} from './utils/firebase';
import { CheckCircle2 } from 'lucide-react';

import { formatMonthNameMalay } from './utils/whatsapp';

export default function App() {
  // Application Central State
  const [appState, setAppState] = useState<AppStateData>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<string | undefined>(undefined);
  
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    payment: PaymentRecord;
    student: Student;
  } | null>(null);

  // Temporary notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeAppState((partialData) => {
      setAppState(prev => ({
        ...prev,
        ...partialData
      }));
    });
    return () => unsubscribe();
  }, []);

  // Save state to localStorage as secondary offline cache
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // One-time wipe of sample student data as explicitly requested by user
  useEffect(() => {
    // If sample data has not been marked as cleared, wipe it immediately
    if (!appState.settings.isSampleDataCleared || appState.students.some(s => s.id === 'std-1' || s.id === 'std-2')) {
      clearAllFirestoreData();
    }
  }, [appState.settings.isSampleDataCleared, appState.students]);

  // Auto-generate current calendar month fee bills for active user-registered students
  useEffect(() => {
    if (appState.students.length === 0) return;
    const currentCalendarMonth = new Date().toISOString().substring(0, 7);

    const activeStudents = appState.students.filter(student => {
      if (student.monthlyFee <= 0 || student.status !== 'active') return false;
      const regMonth = student.registrationDate && student.registrationDate.length >= 7 
        ? student.registrationDate.substring(0, 7) 
        : currentCalendarMonth;
      return regMonth <= currentCalendarMonth;
    });

    const missingBills = activeStudents.filter(student => {
      return !appState.payments.some(p => p.studentId === student.id && p.month === currentCalendarMonth);
    });

    if (missingBills.length > 0) {
      missingBills.forEach(async (student, idx) => {
        const nextReceiptNum = `${appState.settings.receiptPrefix}-${String(appState.payments.length + idx + 1).padStart(4, '0')}`;
        const newPayment: PaymentRecord = {
          id: `pay-${currentCalendarMonth}-${student.id}`,
          receiptNumber: nextReceiptNum,
          studentId: student.id,
          month: currentCalendarMonth,
          amountDue: student.monthlyFee,
          amountPaid: 0,
          paymentMethod: 'DuitNow / Bank Transfer',
          status: 'unpaid',
          receivedBy: appState.settings.principalName,
          notes: `Invois yuran bulanan (${formatMonthNameMalay(currentCalendarMonth)})`
        };
        await syncPaymentToFirestore(newPayment);
      });
    }
  }, [appState.students, appState.payments, appState.settings]);

  // Handlers: Student
  const handleAddStudent = async (newStudentData: Omit<Student, 'id'>) => {
    const newId = `std-${Date.now()}`;
    const newStudent: Student = {
      ...newStudentData,
      id: newId
    };

    const regMonth = newStudent.registrationDate && newStudent.registrationDate.length >= 7
      ? newStudent.registrationDate.substring(0, 7)
      : new Date().toISOString().substring(0, 7);

    if (newStudent.monthlyFee > 0) {
      const receiptNo = `${appState.settings.receiptPrefix}-${String(appState.payments.length + 1).padStart(4, '0')}`;
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNumber: receiptNo,
        studentId: newId,
        month: regMonth,
        amountDue: newStudent.monthlyFee,
        amountPaid: 0,
        paymentMethod: 'DuitNow / Bank Transfer',
        status: 'unpaid',
        receivedBy: appState.settings.principalName,
        notes: `Invois pendaftaran bulan mula masuk (${regMonth})`
      };
      await syncPaymentToFirestore(newPayment);
    }

    await syncStudentToFirestore(newStudent);
    showToast(`Pelajar ${newStudent.name} berjaya didaftarkan! (Segera disegerakkan)`);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    await syncStudentToFirestore(updatedStudent);
    showToast(`Maklumat ${updatedStudent.name} telah dikemaskini.`);
  };

  const handleDeleteStudent = async (id: string) => {
    const relatedPayments = appState.payments.filter(p => p.studentId === id);
    for (const p of relatedPayments) {
      await removePaymentFromFirestore(p.id);
    }
    await removeStudentFromFirestore(id);
    showToast('Rekod pelajar dan invois berkaitan telah dipadam.');
  };

  // Handlers: Class Session
  const handleAddClass = async (newClassData: Omit<ClassSession, 'id'>) => {
    const newClass: ClassSession = {
      ...newClassData,
      id: `cls-${Date.now()}`
    };
    await syncClassToFirestore(newClass);
    showToast(`Sesi kelas ${newClass.subject} berjaya ditambah.`);
  };

  const handleUpdateClass = async (updatedClass: ClassSession) => {
    await syncClassToFirestore(updatedClass);
    showToast(`Jadual kelas ${updatedClass.subject} dikemaskini.`);
  };

  const handleDeleteClass = async (id: string) => {
    await removeClassFromFirestore(id);
    showToast('Sesi kelas telah dipadam dari jadual.');
  };

  // Handlers: Attendance
  const handleSaveAttendance = async (newAttendanceList: AttendanceRecord[]) => {
    await syncAttendanceListToFirestore(newAttendanceList);
    showToast('Rekod kehadiran sesi berjaya disimpan ke cloud.');
  };

  const handleTriggerTakeAttendance = (classId: string) => {
    setSelectedClassForAttendance(classId);
    setActiveTab('attendance');
  };

  // Handlers: Payments
  const handleUpdatePayment = async (updatedPayment: PaymentRecord) => {
    await syncPaymentToFirestore(updatedPayment);
    showToast(`Bayaran resit ${updatedPayment.receiptNumber} berjaya direkod.`);
  };

  const handleAddPayment = async (newPaymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment: PaymentRecord = {
      ...newPaymentData,
      id: `pay-${Date.now()}`
    };
    await syncPaymentToFirestore(newPayment);
  };

  const handleDeletePayment = async (paymentId: string) => {
    await removePaymentFromFirestore(paymentId);
    showToast('Rekod invois bayaran telah dipadam.');
  };

  const handleViewReceipt = (payment: PaymentRecord, student: Student) => {
    setActiveReceiptModal({ payment, student });
  };

  // Handlers: Grades
  const handleAddGrade = async (newGradeData: Omit<GradeRecord, 'id'>) => {
    const newGrade: GradeRecord = {
      ...newGradeData,
      id: `grd-${Date.now()}`
    };
    await syncGradeToFirestore(newGrade);
    showToast('Rekod markah ujian berjaya disimpan.');
  };

  const handleDeleteGrade = async (id: string) => {
    await removeGradeFromFirestore(id);
    showToast('Rekod markah telah dipadam.');
  };

  // Handlers: Center Settings & Backup
  const handleSaveSettings = async (newSettings: CenterSettings) => {
    await syncSettingsToFirestore(newSettings);
    showToast('Tetapan pusat tuisyen dikemaskini secara masa nyata.');
  };

  const handleExportBackup = () => {
    exportBackupJson(appState);
    showToast('Fail sandaran JSON telah dimuat turun.');
  };

  const handleRestoreBackup = (restoredData: AppStateData) => {
    setAppState(restoredData);
    showToast('Data sistem berjaya dipulihkan.');
  };

  const handleResetSampleData = async () => {
    await resetFirestoreToSampleData();
    showToast('Semua rekod telah ditetapkan semula ke data contoh (Cloud).');
  };

  const handleClearAllData = async () => {
    await clearAllFirestoreData();
    showToast('Semua data contoh telah dipadam. Anda boleh mula memasukkan data sendiri!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/50 to-blue-50/80 text-slate-800 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Glassy Ambient Mesh Gradient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl" />
      </div>

      {/* Sticky Frosted Glass Top Navigation Bar */}
      <div className="relative z-40">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openSettingsModal={() => setIsSettingsOpen(true)}
          centerName={appState.settings.centerName}
          onExportBackup={handleExportBackup}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Floating Glassy Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 text-white backdrop-blur-md text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            students={appState.students}
            classes={appState.classes}
            payments={appState.payments}
            attendance={appState.attendance}
            settings={appState.settings}
            setActiveTab={setActiveTab}
            onTakeAttendance={handleTriggerTakeAttendance}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={appState.students}
            classes={appState.classes}
            payments={appState.payments}
            attendance={appState.attendance}
            grades={appState.grades}
            settings={appState.settings}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleManager
            classes={appState.classes}
            students={appState.students}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onTakeAttendance={handleTriggerTakeAttendance}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTracker
            classes={appState.classes}
            students={appState.students}
            attendance={appState.attendance}
            settings={appState.settings}
            selectedClassId={selectedClassForAttendance}
            onSaveAttendance={handleSaveAttendance}
          />
        )}

        {activeTab === 'fees' && (
          <FeeBillingHub
            payments={appState.payments}
            students={appState.students}
            classes={appState.classes}
            settings={appState.settings}
            onUpdatePayment={handleUpdatePayment}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'grades' && (
          <StudentProgress
            grades={appState.grades}
            students={appState.students}
            settings={appState.settings}
            onAddGrade={handleAddGrade}
            onDeleteGrade={handleDeleteGrade}
          />
        )}

      </main>

      {/* Glassy Footer with Real-time Sync Indicator */}
      <footer className="no-print relative z-10 glass-panel border-t border-white/60 py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-heading">e-Tuisyen Pintar</span>
            <span>·</span>
            <span className="text-slate-600 font-medium">{appState.settings.centerName}</span>
            <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full border border-emerald-300/60 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Awan Masa Nyata (Real-time Cloud Sync)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Pendaftaran</span>
            <span>·</span>
            <span>Kehadiran</span>
            <span>·</span>
            <span>Jadual Kelas</span>
            <span>·</span>
            <span>Resit Yuran</span>
            <span>·</span>
            <span>WhatsApp Penjaga</span>
          </div>
        </div>
      </footer>

      {/* Official Printable Receipt Modal */}
      {activeReceiptModal && (
        <ReceiptModal
          payment={activeReceiptModal.payment}
          student={activeReceiptModal.student}
          classes={appState.classes}
          settings={appState.settings}
          onClose={() => setActiveReceiptModal(null)}
        />
      )}

      {/* Center Settings & Backup Modal */}
      {isSettingsOpen && (
        <CenterSettingsModal
          settings={appState.settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onExportBackup={handleExportBackup}
          onRestoreBackup={handleRestoreBackup}
          onResetSampleData={handleResetSampleData}
          onClearAllData={handleClearAllData}
        />
      )}

    </div>
  );
}
