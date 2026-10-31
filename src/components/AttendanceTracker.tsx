import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  AlertCircle, 
  Share2, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, ClassSession, Student, CenterSettings } from '../types';
import { generateAttendanceWhatsAppUrl, formatWhatsAppNumber } from '../utils/whatsapp';
import { MonthlyAttendanceAnalysis } from './MonthlyAttendanceAnalysis';

interface AttendanceTrackerProps {
  classes: ClassSession[];
  students: Student[];
  attendance: AttendanceRecord[];
  settings: CenterSettings;
  selectedClassId?: string;
  initialMode?: 'daily' | 'monthly';
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  classes,
  students,
  attendance,
  settings,
  selectedClassId: initialClassId,
  initialMode = 'daily',
  onSaveAttendance
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>(initialMode);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes[0] ? classes[0].id : '')
  );

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Get enrolled students for this class
  const enrolledStudents = students.filter(s => 
    selectedClass && s.registeredClassIds.includes(selectedClass.id) && s.status !== 'inactive'
  );

  // Helper to get attendance record for a student on selected date and class
  const getRecordForStudent = (studentId: string): AttendanceRecord | undefined => {
    return attendance.find(
      a => a.classId === selectedClassId && a.studentId === studentId && a.date === selectedDate
    );
  };

  // Quick mark a student's attendance
  const handleMarkStatus = (studentId: string, status: AttendanceStatus, notes?: string) => {
    const existingIndex = attendance.findIndex(
      a => a.classId === selectedClassId && a.studentId === studentId && a.date === selectedDate
    );

    let updatedList = [...attendance];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        status,
        notes: notes !== undefined ? notes : updatedList[existingIndex].notes,
        timestamp: new Date().toISOString()
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        classId: selectedClassId,
        studentId,
        date: selectedDate,
        status,
        notes: notes || '',
        timestamp: new Date().toISOString()
      };
      updatedList.push(newRecord);
    }

    onSaveAttendance(updatedList);
  };

  // Mark all enrolled students as present
  const handleMarkAllPresent = () => {
    let updatedList = [...attendance];

    enrolledStudents.forEach(student => {
      const idx = updatedList.findIndex(
        a => a.classId === selectedClassId && a.studentId === student.id && a.date === selectedDate
      );
      if (idx >= 0) {
        updatedList[idx] = {
          ...updatedList[idx],
          status: 'present',
          timestamp: new Date().toISOString()
        };
      } else {
        updatedList.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          classId: selectedClassId,
          studentId: student.id,
          date: selectedDate,
          status: 'present',
          timestamp: new Date().toISOString()
        });
      }
    });

    onSaveAttendance(updatedList);
  };

  // Send WhatsApp attendance notification
  const handleSendWhatsAppNotification = (student: Student, status: AttendanceStatus) => {
    if (!selectedClass) return;
    const url = generateAttendanceWhatsAppUrl(
      student,
      selectedClass,
      status,
      selectedDate,
      settings
    );
    window.open(url, '_blank');
  };

  // Statistics calculation for the session
  const totalEnrolled = enrolledStudents.length;
  const presentCount = enrolledStudents.filter(s => getRecordForStudent(s.id)?.status === 'present').length;
  const absentCount = enrolledStudents.filter(s => getRecordForStudent(s.id)?.status === 'absent').length;
  const excusedCount = enrolledStudents.filter(s => getRecordForStudent(s.id)?.status === 'excused').length;
  const unrecordedCount = totalEnrolled - (presentCount + absentCount + excusedCount);
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Date step helper
  const handleStepDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation Tabs: Sesi Harian vs Analisis Kehadiran Bulanan */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 pb-3 no-print">
        <div className="flex items-center gap-2 p-1 bg-slate-200/50 backdrop-blur-md rounded-xl border border-white/60">
          <button
            onClick={() => setViewMode('daily')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white shadow-md border border-blue-400/30'
                : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Semakan Sesi Harian</span>
          </button>

          <button
            onClick={() => setViewMode('monthly')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-md border border-blue-400/30'
                : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analisis Kehadiran Bulanan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
              Baru
            </span>
          </button>
        </div>

        {viewMode === 'daily' && enrolledStudents.length > 0 && (
          <button
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-300/60 shadow-sm backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-emerald-700" />
            Tandakan Semua Hadir ({enrolledStudents.length} Pelajar)
          </button>
        )}
      </div>

      {viewMode === 'monthly' ? (
        <MonthlyAttendanceAnalysis
          classes={classes}
          students={students}
          attendance={attendance}
          settings={settings}
        />
      ) : (
        <>
          {/* Title & Header for Daily Session */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pengurusan & Semakan Kehadiran Sesi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Merekod kehadiran pelajar harian mengikut jadual kelas dan menghantar notis terus ke WhatsApp ibu bapa.
              </p>
            </div>
          </div>

      {/* Date & Class Select Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStepDate(-1)}
            title="Hari Sebelumnya"
            className="p-2 border border-white/80 rounded-xl text-slate-600 hover:bg-white/60 backdrop-blur-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="relative flex-1">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-white/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600/40 font-mono font-medium text-slate-800 bg-white/60 backdrop-blur-md"
            />
          </div>

          <button
            onClick={() => handleStepDate(1)}
            title="Hari Seterusnya"
            className="p-2 border border-white/80 rounded-xl text-slate-600 hover:bg-white/60 backdrop-blur-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-100/80 hover:bg-blue-100 rounded-xl transition-all border border-blue-200/60 shadow-xs backdrop-blur-md"
          >
            Hari Ini
          </button>
        </div>

        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Pilih Kelas:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex-1 text-xs border border-white/80 rounded-xl px-3 py-2 bg-white/70 backdrop-blur-md text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/40 font-medium"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.subject} ({cls.level}) · {cls.dayOfWeek} {cls.startTime}-{cls.endTime}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Selected Class Banner & Metrics */}
      {selectedClass ? (
        <div className="glass-panel rounded-2xl border border-white/80 p-5 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                {selectedClass.dayOfWeek} · {selectedClass.startTime} - {selectedClass.endTime}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedClass.subject} ({selectedClass.level})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tutor: <span className="font-medium text-slate-700">{selectedClass.tutorName}</span> · Bilik: {selectedClass.room}
              </p>
            </div>

            {/* Attendance Stat Strip */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-center min-w-[70px]">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Berdaftar</span>
                <span className="text-sm font-mono font-bold text-slate-800">{totalEnrolled}</span>
              </div>
              <div className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center min-w-[70px]">
                <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Hadir</span>
                <span className="text-sm font-mono font-bold text-emerald-800">{presentCount}</span>
              </div>
              <div className="px-3 py-2 bg-rose-50 rounded-lg border border-rose-100 text-center min-w-[70px]">
                <span className="text-[10px] text-rose-700 uppercase block font-semibold">Tidak Hadir</span>
                <span className="text-sm font-mono font-bold text-rose-800">{absentCount}</span>
              </div>
              <div className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-center min-w-[70px]">
                <span className="text-[10px] text-amber-700 uppercase block font-semibold">Bersebab</span>
                <span className="text-sm font-mono font-bold text-amber-800">{excusedCount}</span>
              </div>
              <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-center min-w-[80px]">
                <span className="text-[10px] text-blue-700 uppercase block font-semibold">Kadar Hadir</span>
                <span className="text-sm font-mono font-bold text-blue-900">{attendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Pelajar</th>
                  <th className="py-2.5 px-4">Ibu Bapa / Telefon</th>
                  <th className="py-2.5 px-4 text-center">Status Kehadiran</th>
                  <th className="py-2.5 px-4">Catatan Sesi</th>
                  <th className="py-2.5 px-4 text-right">Notifikasi WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents.length > 0 ? (
                  enrolledStudents.map(student => {
                    const record = getRecordForStudent(student.id);
                    const currentStatus = record?.status;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{student.icOrMyKid || student.school}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{student.parentName}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{student.parentPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Button: Hadir */}
                            <button
                              onClick={() => handleMarkStatus(student.id, 'present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Hadir
                            </button>

                            {/* Button: Tidak Hadir */}
                            <button
                              onClick={() => handleMarkStatus(student.id, 'absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Tidak Hadir
                            </button>

                            {/* Button: Cuti / Bersebab */}
                            <button
                              onClick={() => handleMarkStatus(student.id, 'excused')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-amber-500 text-white shadow-xs scale-102'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Bersebab
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Contoh: Datang 8.15pm / Cuti sakit"
                            defaultValue={record?.notes || ''}
                            onBlur={(e) => {
                              if (currentStatus) {
                                handleMarkStatus(student.id, currentStatus, e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                          />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSendWhatsAppNotification(student, currentStatus || 'present')}
                            title="Hantar Notis Kehadiran ke WhatsApp Penjaga"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            WhatsApp Notis
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tiada pelajar berdaftar untuk kelas ini. Sila daftar pelajar pada modul "Pelajar".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
          Sila tambah kelas tuisyen terlebih dahulu pada modul "Jadual Kelas".
        </div>
      )}
      </>
      )}

    </div>
  );
};
