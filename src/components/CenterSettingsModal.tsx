import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  X, 
  AlertTriangle, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { CenterSettings } from '../types';
import { AppStateData } from '../utils/storage';

interface CenterSettingsModalProps {
  settings: CenterSettings;
  onSaveSettings: (settings: CenterSettings) => void;
  onClose: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (restoredData: AppStateData) => void;
  onResetSampleData: () => void;
}

export const CenterSettingsModal: React.FC<CenterSettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onExportBackup,
  onRestoreBackup,
  onResetSampleData
}) => {
  const [formData, setFormData] = useState<CenterSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'backup'>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSuccessMessage('Tetapan pusat tuisyen berjaya disimpan.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.data && parsed.data.students && parsed.data.classes) {
          onRestoreBackup(parsed.data);
          alert('Sandaran berjaya dipulihkan sepenuhnya!');
          onClose();
        } else {
          alert('Format fail JSON tidak sah. Sila gunakan fail sandaran e-Tuisyen yang sah.');
        }
      } catch (err) {
        alert('Ralat membaca fail sandaran JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl shadow-2xl max-w-xl w-full border border-white/80 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-md px-6 py-4 border-b border-white/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Tetapan Pusat Tuisyen & Sandaran Data
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi maklumat rasmi pusat tuisyen, akaun bank untuk resit, dan pengurusan data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profil Pusat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'bank'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Akaun Bank & Resit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sandaran & Pulih Data
          </button>
        </div>

        {/* Alert Feedback */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Pusat Tuisyen / Akademi
                </label>
                <input
                  type="text"
                  required
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    No. Pendaftaran (SSM / KPM)
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Nama Pengetua / Pengurus
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    No. Telefon Pusat
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Emel Rasmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Alamat Premis Fizikal
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Bank Info */}
          {activeTab === 'bank' && (
            <div className="space-y-3">
              <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
                Maklumat akaun bank ini akan dipaparkan secara automatik dalam slip resit rasmi dan dijana dalam templat peringatan yuran WhatsApp kepada ibu bapa.
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Maybank Berhad / CIMB Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombor Akaun Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5628 3491 8820"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono text-sm font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Pemegang Akaun
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pusat Tuisyen Intelek Gemilang"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Awalan No. Resit (Prefix)
                </label>
                <input
                  type="text"
                  value={formData.receiptPrefix}
                  onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  1. Muat Turun Salinan Sandaran (Backup JSON)
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Simpan semua rekod pelajar, jadual kelas, rekod kehadiran, dan penyata bayaran yuran ke komputer anda sebagai fail sandaran selamat.
                </p>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Muat Turun Fail Sandaran (.json)
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  2. Muat Naik & Pulihkan Sandaran
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Pulihkan data daripada fail sandaran JSON yang telah dimuat turun sebelum ini.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Pilih Fail Sandaran JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                <span className="font-bold text-rose-900 block text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  3. Tetapkan Semula Data Contoh
                </span>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  Memadamkan rekod semasa dan memuatkan semula set data contoh asal (pelajar Tingkatan 5, jadual, dan yuran asas).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Adakah anda pasti ingin menetapkan semula semua data kepada data contoh asal? Tindakan ini akan menggantikan rekod semasa.')) {
                      onResetSampleData();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tetapkan Semula ke Data Contoh
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Tutup
            </button>
            {activeTab !== 'backup' && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Save className="w-4 h-4" />
                Simpan Tetapan
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
