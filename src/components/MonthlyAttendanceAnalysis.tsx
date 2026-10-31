import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Printer, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Award,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Student, ClassSession, AttendanceRecord, CenterSettings, AttendanceStatus } from '../types';
import { formatMonthNameMalay, formatWhatsAppNumber, generateMonthlyAttendanceWhatsAppUrl } from '../utils/whatsapp';

interface MonthlyAttendanceAnalysisProps {
  classes: ClassSession[];
  students: Student[];
  attendance: AttendanceRecord[];
  settings: CenterSettings;
}

export const MonthlyAttendanceAnalysis: React.FC<MonthlyAttendanceAnalysisProps> = ({
  classes,
  students,
  attendance,
  settings
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rateFilter, setRateFilter] = useState<'all' | 'warning' | 'good' | 'excellent'>('all');

  // Month step navigation
  const handleStepMonth = (direction: number) => {
    const parts = selectedMonth.split('-');
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) + direction;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  // Filter attendance records by selected month
  const monthAttendanceRecords = attendance.filter(a => a.date.startsWith(selectedMonth));

  // Filter students based on status and registration date
  const filteredStudents = students.filter(student => {
    // Check status filter
    if (statusFilter === 'active' && student.status !== 'active') return false;
    if (statusFilter === 'inactive' && student.status === 'active') return false;

    // Check class filter
    if (selectedClassFilter !== 'all' && !student.registeredClassIds.includes(selectedClassFilter)) {
      return false;
    }

    // Search query
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate per-student stats for the selected month
  const studentAnalysisList = filteredStudents.map(student => {
    // Records of this student in the selected month
    const studentMonthRecords = monthAttendanceRecords.filter(a => {
      if (a.studentId !== student.id) return false;
      if (selectedClassFilter !== 'all' && a.classId !== selectedClassFilter) return false;
      return true;
    });

    const presentCount = studentMonthRecords.filter(a => a.status === 'present').length;
    const absentCount = studentMonthRecords.filter(a => a.status === 'absent').length;
    const excusedCount = studentMonthRecords.filter(a => a.status === 'excused').length;
    const totalRecordedSessions = studentMonthRecords.length;

    // Estimate total expected sessions:
    // If sessions were recorded for their classes this month, calculate maximum possible
    const attendanceRate = totalRecordedSessions > 0 
      ? Math.round((presentCount / totalRecordedSessions) * 100) 
      : 100;

    // Check if student registered in or after this month
    const regMonth = student.registrationDate ? student.registrationDate.substring(0, 7) : '2026-01';
    const isNewThisMonth = regMonth === selectedMonth;
    const isRegisteredLater = regMonth > selectedMonth;

    // Check if student exited in or before this month
    const exitMonth = student.exitDate ? student.exitDate.substring(0, 7) : null;
    const hasExited = exitMonth ? exitMonth <= selectedMonth : false;

    return {
      student,
      totalRecordedSessions,
      presentCount,
      absentCount,
      excusedCount,
      attendanceRate,
      isNewThisMonth,
      isRegisteredLater,
      hasExited
    };
  }).filter(item => {
    if (rateFilter === 'warning') return item.attendanceRate < 75 && item.totalRecordedSessions > 0;
    if (rateFilter === 'good') return item.attendanceRate >= 75 && item.attendanceRate < 90;
    if (rateFilter === 'excellent') return item.attendanceRate >= 90;
    return true;
  });

  // Overall Month Statistics
  const totalStudentsEvaluated = studentAnalysisList.length;
  const totalPresentSessions = studentAnalysisList.reduce((sum, s) => sum + s.presentCount, 0);
  const totalAbsentSessions = studentAnalysisList.reduce((sum, s) => sum + s.absentCount, 0);
  const totalExcusedSessions = studentAnalysisList.reduce((sum, s) => sum + s.excusedCount, 0);
  const totalRecordedMonth = totalPresentSessions + totalAbsentSessions + totalExcusedSessions;
  const overallMonthRate = totalRecordedMonth > 0 
    ? Math.round((totalPresentSessions / totalRecordedMonth) * 100) 
    : 0;

  const warningStudentsCount = studentAnalysisList.filter(s => s.attendanceRate < 75 && s.totalRecordedSessions > 0).length;
  const excellentStudentsCount = studentAnalysisList.filter(s => s.attendanceRate >= 90 && s.totalRecordedSessions > 0).length;

  // Class by class comparison chart data
  const classComparisonData = classes.map(cls => {
    const classMonthRecords = monthAttendanceRecords.filter(a => a.classId === cls.id);
    const present = classMonthRecords.filter(a => a.status === 'present').length;
    const absent = classMonthRecords.filter(a => a.status === 'absent').length;
    const excused = classMonthRecords.filter(a => a.status === 'excused').length;
    const total = classMonthRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      name: cls.subject.length > 10 ? `${cls.subject.substring(0, 8)}..` : cls.subject,
      fullName: `${cls.subject} (${cls.level})`,
      Hadir: present,
      Ponteng: absent,
      Bersebab: excused,
      PeratusHadir: rate,
      totalSessions: total
    };
  }).filter(c => c.totalSessions > 0 || selectedClassFilter === 'all');

  const handlePrint = () => {
    window.print();
  };

  const handleSendMonthlyReport = (item: typeof studentAnalysisList[0]) => {
    const url = generateMonthlyAttendanceWhatsAppUrl(
      item.student,
      selectedMonth,
      item.presentCount,
      item.absentCount,
      item.excusedCount,
      item.totalRecordedSessions,
      item.attendanceRate,
      settings
    );
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Laporan Analisis Bulanan
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Analisis & Statistik Kehadiran Pelajar Bulanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis peratus kehadiran mengikut bulan, rekod ponteng, sesi kelas, serta penghantaran laporan ke WhatsApp penjaga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Cetak Laporan Bulanan
          </button>
        </div>
      </div>

      {/* Filter & Month Selector Strip */}
      <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Bulan Analisis:</span>
          <div className="flex items-center bg-white/70 backdrop-blur-md rounded-xl p-0.5 border border-white/80 shadow-2xs">
            <button
              onClick={() => handleStepMonth(-1)}
              title="Bulan Sebelumnya"
              className="p-1.5 hover:bg-white/90 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 py-1 px-2.5 focus:outline-hidden cursor-pointer"
            >
              <option value="2026-08">Ogos 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">Disember 2026</option>
              <option value="2027-01">Januari 2027</option>
            </select>
            <button
              onClick={() => handleStepMonth(1)}
              title="Bulan Seterusnya"
              className="p-1.5 hover:bg-white/90 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs border border-white/80 rounded-xl px-2.5 py-1.5 bg-white/70 backdrop-blur-md text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600/40"
          >
            <option value="all">Semua Subjek / Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.subject} ({c.level})</option>
            ))}
          </select>

          {/* Student Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-white/80 rounded-xl px-2.5 py-1.5 bg-white/70 backdrop-blur-md text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600/40"
          >
            <option value="active">Pelajar Aktif Sahaja</option>
            <option value="all">Semua Termasuk Telah Keluar</option>
            <option value="inactive">Pelajar Telah Berhenti</option>
          </select>

          {/* Attendance Rate filter */}
          <select
            value={rateFilter}
            onChange={(e) => setRateFilter(e.target.value as any)}
            className="text-xs border border-white/80 rounded-xl px-2.5 py-1.5 bg-white/70 backdrop-blur-md text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600/40"
          >
            <option value="all">Semua Kadar Kehadiran</option>
            <option value="warning">⚠️ Amaran (Bawah 75%)</option>
            <option value="good">Sederhana (75% - 89%)</option>
            <option value="excellent">🌟 Cemerlang (90% - 100%)</option>
          </select>
        </div>

      </div>

      {/* KPI Overview Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Attendance Rate */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Purata Kehadiran ({formatMonthNameMalay(selectedMonth)})
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-mono font-bold ${
              overallMonthRate >= 85 ? 'text-emerald-700' : 
              overallMonthRate >= 75 ? 'text-blue-700' : 'text-rose-600'
            }`}>
              {overallMonthRate}%
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {overallMonthRate >= 85 ? 'Tahap Cemerlang' : overallMonthRate >= 75 ? 'Tahap Baik' : 'Perlu Tindakan'}
            </span>
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                overallMonthRate >= 85 ? 'bg-emerald-600' : 
                overallMonthRate >= 75 ? 'bg-blue-600' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(overallMonthRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Sessions Conducted */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sesi & Rekod Kehadiran
          </span>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
            {totalRecordedMonth} <span className="text-xs font-normal text-slate-500 font-sans">rekod</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalPresentSessions} hadir · {totalAbsentSessions} ponteng · {totalExcusedSessions} cuti
          </span>
        </div>

        {/* Warning Students (< 75%) */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Pelajar Perlu Perhatian (&lt;75%)
          </span>
          <div className="text-2xl font-mono font-bold text-rose-700 mt-1">
            {warningStudentsCount} <span className="text-xs font-normal text-rose-600 font-sans">pelajar</span>
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block">
            {warningStudentsCount > 0 
              ? 'Perlukan pemantauan & notis WhatsApp' 
              : 'Semua pelajar capai tahap memuaskan'}
          </span>
        </div>

        {/* Excellent Attendance (>= 90%) */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Kehadiran Cemerlang (&ge;90%)
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {excellentStudentsCount} <span className="text-xs font-normal text-emerald-600 font-sans">pelajar</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            Daripada {totalStudentsEvaluated} pelajar dinilai
          </span>
        </div>

      </div>

      {/* Visual Chart: Perbandingan Kehadiran Mengikut Kelas (Recharts) */}
      {classComparisonData.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-white/80 shadow-lg no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Kadar Kehadiran Mengikut Kelas / Subjek ({formatMonthNameMalay(selectedMonth)})
              </h3>
              <p className="text-xs text-slate-500">
                Membandingkan sesi hadir, tidak hadir, dan kadar peratusan mengikut subjek
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {classComparisonData.length} kelas direkodkan
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#475569' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{data.fullName}</p>
                          <p className="text-emerald-400">Hadir: {data.Hadir} sesi</p>
                          <p className="text-rose-400">Ponteng: {data.Ponteng} sesi</p>
                          <p className="text-amber-400">Cuti: {data.Bersebab} sesi</p>
                          <p className="text-blue-300 font-mono font-bold pt-1">
                            Peratus Kehadiran: {data.PeratusHadir}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} name="Sesi Hadir" />
                <Bar dataKey="Ponteng" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Tidak Hadir" />
                <Bar dataKey="Bersebab" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bersebab/Cuti" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search Input Bar for Table */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 no-print">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Cari nama pelajar, tingkatan/tahun, atau nama ibu bapa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs border-none focus:outline-hidden text-slate-800 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Padam
          </button>
        )}
      </div>

      {/* Main Analysis Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Print Header (Only visible on print) */}
        <div className="hidden print:block p-6 border-b border-slate-200">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">{settings.centerName}</h1>
            <p className="text-xs text-slate-600">{settings.address} · Tel: {settings.phone}</p>
            <h2 className="text-base font-bold text-blue-900 mt-2 uppercase tracking-wide">
              Laporan Analisis Kehadiran Bulanan: {formatMonthNameMalay(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500">Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY')}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama Pelajar</th>
                <th className="py-3 px-4">Tingkatan / Darjah</th>
                <th className="py-3 px-4 text-center">Tarikh Daftar / Keluar</th>
                <th className="py-3 px-4 text-center">Sesi Selesai</th>
                <th className="py-3 px-4 text-center">Hadir</th>
                <th className="py-3 px-4 text-center">Ponteng</th>
                <th className="py-3 px-4 text-center">Cuti</th>
                <th className="py-3 px-4 text-center">Peratus (%)</th>
                <th className="py-3 px-4 text-right no-print">Tindakan Laporan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentAnalysisList.length > 0 ? (
                studentAnalysisList.map((item) => {
                  const { student, totalRecordedSessions, presentCount, absentCount, excusedCount, attendanceRate } = item;
                  const isWarning = attendanceRate < 75 && totalRecordedSessions > 0;
                  const isExcellent = attendanceRate >= 90 && totalRecordedSessions > 0;

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isWarning ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Name & IC */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {student.name}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {student.icOrMyKid || 'Tiada No K/P'} · Penjaga: {student.parentName}
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{student.level}</span>
                        <div className="text-slate-500 text-[10px]">
                          {student.registeredClassIds.length} subjek berdaftar
                        </div>
                      </td>

                      {/* Registration & Exit Dates */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px]">
                          <span className="text-slate-500 font-medium">Masuk: </span>
                          <span className="font-mono text-slate-700">{student.registrationDate}</span>
                        </div>
                        {item.isNewThisMonth && (
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                            Daftar Baru ({formatMonthNameMalay(selectedMonth)})
                          </span>
                        )}
                        {item.isRegisteredLater && (
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            Mula Bulan Depan
                          </span>
                        )}
                        {student.exitDate && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            Keluar: {student.exitDate}
                          </div>
                        )}
                      </td>

                      {/* Total sessions */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-800">
                        {totalRecordedSessions}
                      </td>

                      {/* Present count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {presentCount}
                      </td>

                      {/* Absent count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">
                        {absentCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                            {absentCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Excused count */}
                      <td className="py-3.5 px-4 text-center font-mono text-amber-700">
                        {excusedCount}
                      </td>

                      {/* Percentage & Visual Bar */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-mono font-bold text-xs ${
                            isWarning ? 'text-rose-600' :
                            isExcellent ? 'text-emerald-700' : 'text-blue-700'
                          }`}>
                            {totalRecordedSessions > 0 ? `${attendanceRate}%` : 'Tiada Sesi'}
                          </span>
                          
                          {totalRecordedSessions > 0 && (
                            <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isWarning ? 'bg-rose-500' :
                                  isExcellent ? 'bg-emerald-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                              />
                            </div>
                          )}

                          {isWarning && (
                            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Amaran
                            </span>
                          )}
                          {isExcellent && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Cemerlang
                            </span>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp Report Action */}
                      <td className="py-3.5 px-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendMonthlyReport(item)}
                            title="Hantar Laporan Kehadiran Bulanan ke WhatsApp Ibu Bapa"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Slip WhatsApp</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Tiada rekod analisis kehadiran bagi tapisan ini.</p>
                    <p className="text-xs mt-1">Sila pastikan kehadiran sesi harian bagi bulan {formatMonthNameMalay(selectedMonth)} telah direkodkan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Strip */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Menunjukkan {studentAnalysisList.length} pelajar bagi analisis bulan {formatMonthNameMalay(selectedMonth)}</span>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cemerlang: &ge;90%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Sederhana: 75-89%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Amaran: &lt;75%
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
