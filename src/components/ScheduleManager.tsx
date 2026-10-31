import React, { useState } from 'react';
import { 
  CalendarPlus, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Edit, 
  Trash2, 
  CheckSquare, 
  X,
  Calendar,
  BookOpen
} from 'lucide-react';
import { ClassSession, DayOfWeek, Student } from '../types';

interface ScheduleManagerProps {
  classes: ClassSession[];
  students: Student[];
  onAddClass: (newClass: Omit<ClassSession, 'id'>) => void;
  onUpdateClass: (updatedClass: ClassSession) => void;
  onDeleteClass: (id: string) => void;
  onTakeAttendance: (classId: string) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  classes,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onTakeAttendance
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  const daysList: DayOfWeek[] = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

  const [formData, setFormData] = useState({
    subject: '',
    level: 'Tingkatan 5 (SPM)',
    dayOfWeek: 'Isnin' as DayOfWeek,
    startTime: '20:00',
    endTime: '21:30',
    tutorName: '',
    room: 'Bilik Utama',
    feePerMonth: 65,
    maxCapacity: 15
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      subject: '',
      level: 'Tingkatan 5 (SPM)',
      dayOfWeek: selectedDay === 'all' ? 'Isnin' : selectedDay,
      startTime: '20:00',
      endTime: '21:30',
      tutorName: '',
      room: 'Bilik Utama',
      feePerMonth: 65,
      maxCapacity: 15
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassSession) => {
    setEditingClass(cls);
    setFormData({
      subject: cls.subject,
      level: cls.level,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      tutorName: cls.tutorName,
      room: cls.room,
      feePerMonth: cls.feePerMonth,
      maxCapacity: cls.maxCapacity
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.tutorName.trim()) {
      alert('Sila lengkapkan nama subjek dan tutor pengajar.');
      return;
    }

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        ...formData
      });
    } else {
      onAddClass(formData);
    }

    setIsModalOpen(false);
  };

  const filteredClasses = classes.filter(cls => {
    if (selectedDay === 'all') return true;
    return cls.dayOfWeek === selectedDay;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Jadual Waktu Sesi Kelas Tuisyen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun slot waktu kelas mengikut hari, masa, tutor, bilik fizikal dan kapasiti pelajar.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600/90 hover:bg-blue-600 rounded-xl transition-all shadow-md backdrop-blur-md border border-blue-400/30"
        >
          <CalendarPlus className="w-4 h-4" />
          Tambah Sesi Kelas
        </button>
      </div>

      {/* Day Filter Segmented Controls */}
      <div className="glass-card p-2 rounded-2xl border border-white/80 shadow-md flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
            selectedDay === 'all'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Semua Hari ({classes.length})
        </button>
        {daysList.map(day => {
          const count = classes.filter(c => c.dayOfWeek === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedDay === day
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{day}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedDay === day ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length > 0 ? (
          filteredClasses.map(cls => {
            const enrolled = students.filter(s => s.registeredClassIds.includes(cls.id));
            const capacityRatio = cls.maxCapacity > 0 ? (enrolled.length / cls.maxCapacity) * 100 : 0;

            return (
              <div 
                key={cls.id}
                className="glass-card rounded-2xl border border-white/80 shadow-md hover:shadow-xl transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                        {cls.dayOfWeek} · {cls.level}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {cls.subject}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        RM {cls.feePerMonth}
                      </span>
                      <span className="text-[10px] text-slate-400">/bulan</span>
                    </div>
                  </div>

                  {/* Class Info Meta */}
                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-800 font-medium">
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.tutorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span>Kapasiti Pelajar:</span>
                          <span className="font-semibold text-slate-800">
                            {enrolled.length} / {cls.maxCapacity} orang
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              capacityRatio >= 90 ? 'bg-rose-500' : capacityRatio >= 60 ? 'bg-blue-600' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(capacityRatio, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Student Mini Preview */}
                  {enrolled.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] text-slate-400 block mb-1">Pelajar Berdaftar:</span>
                      <div className="flex flex-wrap gap-1">
                        {enrolled.slice(0, 3).map(s => (
                          <span key={s.id} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-100">
                            {s.name.split(' ')[0]}
                          </span>
                        ))}
                        {enrolled.length > 3 && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            +{enrolled.length - 3} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onTakeAttendance(cls.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Ambil Kehadiran
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      title="Sunting Sesi"
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Padam sesi kelas ${cls.subject} (${cls.dayOfWeek})?`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      title="Padam Sesi"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Tiada kelas dijadualkan pada hari ini.</p>
            <p className="text-xs mt-1">Sila klik "Tambah Sesi Kelas" untuk menjadualkan kelas baharu.</p>
          </div>
        )}
      </div>

      {/* Modal: Tambah / Sunting Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass ? 'Sunting Sesi Kelas' : 'Tambah Sesi Kelas Baharu'}
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
                  <label className="block text-slate-700 font-medium mb-1">
                    Nama Subjek <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematik Tambahan SPM"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Tingkatan / Sasaran Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="level-presets"
                    placeholder="Contoh: Tahun 1 / Tahun 2 / Tingkatan 5..."
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                  <datalist id="level-presets">
                    <option value="Tahun 1" />
                    <option value="Tahun 2" />
                    <option value="Tahun 3" />
                    <option value="Tahun 4" />
                    <option value="Tahun 5" />
                    <option value="Tahun 6" />
                    <option value="Tahun 1 - 3 (Tahap 1)" />
                    <option value="Tahun 4 - 6 (Tahap 2)" />
                    <option value="Prasekolah / Tadika" />
                    <option value="Tingkatan 1" />
                    <option value="Tingkatan 2" />
                    <option value="Tingkatan 3" />
                    <option value="Tingkatan 4" />
                    <option value="Tingkatan 5 (SPM)" />
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, level: lvl })}
                        className="text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 px-1.5 py-0.5 rounded transition-colors"
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Hari Sesi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {daysList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Waktu Mula
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Waktu Tamat
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Nama Tutor / Guru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Cikgu Azman"
                    value={formData.tutorName}
                    onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Bilik / Lokasi Kelas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bilik Al-Khawarizmi"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Kadar Yuran Bulanan (RM)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.feePerMonth}
                    onChange={(e) => setFormData({ ...formData, feePerMonth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Kapasiti Maksimum Pelajar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || 15 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
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
                  {editingClass ? 'Simpan Perubahan' : 'Tambah Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
