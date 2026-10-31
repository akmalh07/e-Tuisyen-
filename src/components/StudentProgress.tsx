import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Share2, 
  Printer, 
  BookOpen, 
  Calendar, 
  User, 
  MessageCircle, 
  Trash2, 
  X,
  FileCheck
} from 'lucide-react';
import { GradeRecord, Student, CenterSettings } from '../types';
import { generateGradeWhatsAppUrl } from '../utils/whatsapp';

interface StudentProgressProps {
  grades: GradeRecord[];
  students: Student[];
  settings: CenterSettings;
  onAddGrade: (grade: Omit<GradeRecord, 'id'>) => void;
  onDeleteGrade: (id: string) => void;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({
  grades,
  students,
  settings,
  onAddGrade,
  onDeleteGrade
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReportGrade, setSelectedReportGrade] = useState<{ grade: GradeRecord; student: Student } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    subject: 'Matematik SPM',
    examName: 'Ujian Bulanan',
    marks: 80,
    maxMarks: 100,
    grade: 'A',
    tutorFeedback: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate SPM grade helper
  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    if (percentage >= 20) return 'E';
    return 'G';
  };

  const handleMarksChange = (marks: number, maxMarks: number) => {
    const autoGrade = calculateGrade(marks, maxMarks);
    setFormData(prev => ({
      ...prev,
      marks,
      maxMarks,
      grade: autoGrade
    }));
  };

  const handleOpenAdd = () => {
    setFormData({
      studentId: students[0]?.id || '',
      subject: 'Matematik SPM',
      examName: 'Ujian Bulanan',
      marks: 80,
      maxMarks: 100,
      grade: 'A',
      tutorFeedback: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert('Sila pilih pelajar.');
      return;
    }

    onAddGrade(formData);
    setIsModalOpen(false);
  };

  const handleShareWhatsApp = (grade: GradeRecord, student: Student) => {
    const url = generateGradeWhatsAppUrl(student, grade, settings);
    window.open(url, '_blank');
  };

  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.studentId);
    if (!student) return false;

    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.examName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStudent = selectedStudentFilter === 'all' || grade.studentId === selectedStudentFilter;

    return matchesSearch && matchesStudent;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekod Prestasi & Perkembangan Pelajar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Merekod markah ujian bulanan, ulasan tutor, dan menjana slip laporan untuk ibu bapa.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600/90 hover:bg-blue-600 rounded-xl transition-all shadow-md backdrop-blur-md border border-blue-400/30"
        >
          <Plus className="w-4 h-4" />
          Tambah Rekod Ujian / Kuiz
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelajar, subjek, atau jenis ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-white/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600/40 bg-white/60 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Pelajar:</label>
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="text-xs border border-white/80 rounded-xl px-3 py-1.5 bg-white/70 backdrop-blur-md text-slate-800 font-medium focus:ring-2 focus:ring-blue-600/40 focus:outline-hidden"
          >
            <option value="all">Semua Pelajar ({students.length})</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grades Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGrades.length > 0 ? (
          filteredGrades.map(grade => {
            const student = students.find(s => s.id === grade.studentId);
            if (!student) return null;

            return (
              <div 
                key={grade.id}
                className="glass-card rounded-2xl border border-white/80 shadow-md p-5 flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                        {grade.subject}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                        {student.name}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {student.level} · {grade.examName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded font-bold text-sm">
                        {grade.grade}
                      </span>
                      <span className="text-[11px] font-mono text-slate-600 block mt-1 font-semibold">
                        {grade.marks} / {grade.maxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Quote */}
                  <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                    <span className="font-semibold text-slate-800 block text-[11px] mb-1">
                      Ulasan & Bimbingan Tutor:
                    </span>
                    <p className="italic leading-relaxed">
                      "{grade.tutorFeedback || 'Tiada ulasan lanjut dicatatkan.'}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Tarikh Penilaian: {grade.date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(grade, student)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Keputusan
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedReportGrade({ grade, student })}
                      title="Papar Slip Laporan Lengkap"
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Padam rekod markah ini?`)) {
                          onDeleteGrade(grade.id);
                        }
                      }}
                      title="Padam Rekod"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Tiada rekod markah dijumpai.</p>
            <p className="text-xs mt-1">Sila klik "Tambah Rekod Ujian / Kuiz" untuk merekod markah pertama.</p>
          </div>
        )}
      </div>

      {/* Modal: Tambah Rekod Markah Ujian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Tambah Rekod Prestasi & Markah Ujian
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Pilih Pelajar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Nama Subjek <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematik SPM"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Jenis Ujian / Penilaian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ujian Bulanan 1"
                    value={formData.examName}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Markah Diperoleh
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.maxMarks}
                    value={formData.marks}
                    onChange={(e) => handleMarksChange(parseFloat(e.target.value) || 0, formData.maxMarks)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Markah Penuh
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxMarks}
                    onChange={(e) => handleMarksChange(formData.marks, parseFloat(e.target.value) || 100)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Gred Penilaian
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-bold text-blue-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Tarikh Penilaian
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Ulasan Perkembangan & Nasihat Tutor
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Menunjukkan peningkatan ketara dalam topik aljabar. Perlu lebih banyak latihan soalan esei..."
                    value={formData.tutorFeedback}
                    onChange={(e) => setFormData({ ...formData, tutorFeedback: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Slip Laporan Prestasi Cetak */}
      {selectedReportGrade && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="no-print bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Slip Laporan Prestasi Pelajar</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(selectedReportGrade.grade, selectedReportGrade.student)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Slip
                </button>
                <button
                  onClick={() => setSelectedReportGrade(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Body */}
            <div className="p-8 space-y-6 text-xs bg-white" id="printable-report-slip">
              <div className="text-center pb-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{settings.centerName}</h3>
                <p className="text-xs text-slate-500">{settings.address}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-bold rounded text-[11px] uppercase tracking-wider">
                  SLIP LAPORAN PRESTASI AKADEMIK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Nama Pelajar:</span>
                  <span className="text-sm font-bold text-slate-900">{selectedReportGrade.student.name}</span>
                  <span className="text-slate-500 block">{selectedReportGrade.student.level}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-semibold">Penilaian:</span>
                  <span className="text-sm font-bold text-slate-900">{selectedReportGrade.grade.examName}</span>
                  <span className="text-slate-500 block">Tarikh: {selectedReportGrade.grade.date}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-5 text-center bg-blue-50/30">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  {selectedReportGrade.grade.subject}
                </span>
                <div className="text-3xl font-mono font-bold text-blue-900 my-2">
                  {selectedReportGrade.grade.marks} <span className="text-lg text-slate-400 font-normal">/ {selectedReportGrade.grade.maxMarks}</span>
                </div>
                <span className="inline-block px-3 py-1 bg-blue-700 text-white font-bold rounded-md text-sm">
                  Gred: {selectedReportGrade.grade.grade}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block text-xs mb-1">
                  Ulasan Perkembangan Guru Pembimbing:
                </span>
                <p className="italic text-slate-700 text-xs leading-relaxed">
                  "{selectedReportGrade.grade.tutorFeedback || 'Pelajar menunjukkan komitmen yang baik dalam sesi pembelajaran.'}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-400">
                <span>Disahkan oleh: {settings.principalName}</span>
                <span>Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY')}</span>
              </div>
            </div>

            <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReportGrade(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
