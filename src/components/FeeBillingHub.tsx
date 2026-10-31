import React, { useState } from 'react';
import { 
  Receipt, 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Share2, 
  Printer, 
  PlusCircle, 
  Calendar, 
  X, 
  CreditCard, 
  MessageCircle, 
  Building, 
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Info,
  ShieldAlert
} from 'lucide-react';
import { PaymentRecord, Student, ClassSession, CenterSettings, PaymentStatus, PaymentMethod } from '../types';
import { formatMonthNameMalay, generateFeeReminderWhatsAppUrl } from '../utils/whatsapp';

interface FeeBillingHubProps {
  payments: PaymentRecord[];
  students: Student[];
  classes: ClassSession[];
  settings: CenterSettings;
  onUpdatePayment: (payment: PaymentRecord) => void;
  onAddPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  onDeletePayment?: (paymentId: string) => void;
  onViewReceipt: (payment: PaymentRecord, student: Student) => void;
}

export const FeeBillingHub: React.FC<FeeBillingHubProps> = ({
  payments,
  students,
  classes,
  settings,
  onUpdatePayment,
  onAddPayment,
  onDeletePayment,
  onViewReceipt
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment recording modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activePaymentRecord, setActivePaymentRecord] = useState<PaymentRecord | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Form state inside modal
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>('DuitNow / Bank Transfer');
  const [referenceNoInput, setReferenceNoInput] = useState<string>('');
  const [receivedByInput, setReceivedByInput] = useState<string>(settings.principalName);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');

  // Generate missing fee bills for students for selected month
  // ONLY for students who registered on or before selectedMonth and haven't exited before selectedMonth
  const handleGenerateMonthlyBills = () => {
    let generatedCount = 0;
    let skippedBeforeRegCount = 0;

    // Filter students eligible for this specific month
    const eligibleStudents = students.filter(student => {
      if (student.monthlyFee <= 0) return false;
      if (student.status === 'inactive' && !student.exitDate) return false;

      // Extract month YYYY-MM
      const regMonth = student.registrationDate && student.registrationDate.length >= 7 
        ? student.registrationDate.substring(0, 7) 
        : '2026-01';

      // Pelajar HANYA dikenakan yuran jika bulan yang dipilih adalah sama atau selepas bulan pendaftaran
      if (selectedMonth < regMonth) {
        skippedBeforeRegCount++;
        return false;
      }

      // Jika pelajar telah keluar/berhenti, jangan caj bulan selepas tarikh keluar
      if (student.exitDate && student.exitDate.length >= 7) {
        const exitMonth = student.exitDate.substring(0, 7);
        if (selectedMonth > exitMonth) {
          return false;
        }
      }

      return true;
    });

    eligibleStudents.forEach(student => {
      const exists = payments.some(p => p.studentId === student.id && p.month === selectedMonth);
      if (!exists) {
        const nextReceiptNum = `${settings.receiptPrefix}-${String(payments.length + generatedCount + 1).padStart(4, '0')}`;
        onAddPayment({
          receiptNumber: nextReceiptNum,
          studentId: student.id,
          month: selectedMonth,
          amountDue: student.monthlyFee,
          amountPaid: 0,
          paymentMethod: 'DuitNow / Bank Transfer',
          status: 'unpaid',
          receivedBy: settings.principalName,
          notes: `Invois yuran bulanan (${formatMonthNameMalay(selectedMonth)})`
        });
        generatedCount++;
      }
    });

    if (generatedCount > 0) {
      let msg = `Berjaya menjana ${generatedCount} invois yuran bagi bulan ${formatMonthNameMalay(selectedMonth)}.`;
      if (skippedBeforeRegCount > 0) {
        msg += ` (${skippedBeforeRegCount} pelajar dikecualikan kerana mendaftar pada bulan selepas ini).`;
      }
      alert(msg);
    } else {
      let msg = `Semua pelajar yang layak telah mempunyai rekod yuran bagi bulan ${formatMonthNameMalay(selectedMonth)}.`;
      if (skippedBeforeRegCount > 0) {
        msg += `\nNota: ${skippedBeforeRegCount} pelajar belum dikenakan yuran kerana tarikh mula pendaftaran mereka adalah pada bulan selepas ini (contoh: November).`;
      }
      alert(msg);
    }
  };

  const handleOpenPayModal = (payment: PaymentRecord, student: Student) => {
    setActivePaymentRecord(payment);
    setActiveStudent(student);
    setAmountPaidInput(payment.amountPaid > 0 ? payment.amountPaid : payment.amountDue);
    setPaymentMethodInput(payment.paymentMethod || 'DuitNow / Bank Transfer');
    setReferenceNoInput(payment.referenceNo || '');
    setReceivedByInput(payment.receivedBy || settings.principalName);
    setPaymentDateInput(payment.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentNotesInput(payment.notes || '');
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentRecord) return;

    let newStatus: PaymentStatus = 'unpaid';
    if (amountPaidInput >= activePaymentRecord.amountDue) {
      newStatus = 'paid';
    } else if (amountPaidInput > 0) {
      newStatus = 'partial';
    }

    const updated: PaymentRecord = {
      ...activePaymentRecord,
      amountPaid: amountPaidInput,
      paymentMethod: paymentMethodInput,
      referenceNo: referenceNoInput,
      receivedBy: receivedByInput,
      paymentDate: paymentDateInput,
      status: newStatus,
      notes: paymentNotesInput
    };

    onUpdatePayment(updated);
    setIsPayModalOpen(false);
  };

  const handleResetToUnpaid = () => {
    if (!activePaymentRecord) return;
    if (confirm(`Adakah anda pasti ingin membatalkan bayaran bagi ${activeStudent?.name}? Status invois ini akan ditukar semula kepada BELUM BAYAR (RM0).`)) {
      const updated: PaymentRecord = {
        ...activePaymentRecord,
        amountPaid: 0,
        status: 'unpaid',
        paymentDate: undefined,
        referenceNo: undefined,
        notes: 'Bayaran dibatalkan dan status ditetapkan semula kepada Belum Bayar'
      };
      onUpdatePayment(updated);
      setIsPayModalOpen(false);
    }
  };

  const handleSendWhatsAppReminder = (payment: PaymentRecord, student: Student) => {
    const url = generateFeeReminderWhatsAppUrl(student, payment, settings);
    window.open(url, '_blank');
  };

  // Filter payments by selected month
  const monthPayments = payments.filter(p => p.month === selectedMonth);

  // Filtered by status and search
  const filteredPayments = monthPayments.filter(payment => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return false;

    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Detect any payments mistakenly generated for a student before their registration month
  const invalidPreRegPayments = monthPayments.filter(payment => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return false;
    const regMonth = student.registrationDate && student.registrationDate.length >= 7 
      ? student.registrationDate.substring(0, 7) 
      : '2026-01';
    return selectedMonth < regMonth;
  });

  const handleCleanupPreRegBills = () => {
    if (!onDeletePayment) return;
    if (confirm(`Padam ${invalidPreRegPayments.length} rekod invois bagi pelajar yang mendaftar pada bulan terkehadapan? Pelajar-pelajar ini akan mula dicaj pada bulan pendaftaran mereka yang sebenar.`)) {
      invalidPreRegPayments.forEach(p => onDeletePayment(p.id));
    }
  };

  // Calculate monthly metrics
  const totalDueMonth = monthPayments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalCollectedMonth = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOutstandingMonth = Math.max(0, totalDueMonth - totalCollectedMonth);
  const paidCount = monthPayments.filter(p => p.status === 'paid').length;
  const unpaidCount = monthPayments.filter(p => p.status === 'unpaid').length;
  const partialCount = monthPayments.filter(p => p.status === 'partial').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekod & Pengurusan Yuran Bulanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kutipan yuran, jana invois, keluarkan resit rasmi, dan hantar peringatan WhatsApp.
          </p>
        </div>

        <button
          onClick={handleGenerateMonthlyBills}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600/90 hover:bg-blue-600 rounded-xl transition-all shadow-md backdrop-blur-md border border-blue-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          Jana Bil Yuran ({formatMonthNameMalay(selectedMonth)})
        </button>
      </div>

      {/* Alert Banner: Invois Pra-Pendaftaran Dikesan (jika wujud) */}
      {invalidPreRegPayments.length > 0 && (
        <div className="p-4 bg-amber-500/10 backdrop-blur-md border border-amber-300/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-amber-900 shadow-sm">
          <div className="flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm block">Penyelarasan Invois Pra-Pendaftaran Diperlukan</strong>
              <span>
                Terdapat <strong>{invalidPreRegPayments.length} invois</strong> pada bulan {formatMonthNameMalay(selectedMonth)} bagi pelajar yang mendaftar pada bulan selepas ini (contoh: November). Mengikut peraturan tuisyen, yuran pelajar hanya bermula pada bulan pendaftarannya.
              </span>
            </div>
          </div>
          {onDeletePayment && (
            <button
              onClick={handleCleanupPreRegBills}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700/90 hover:bg-amber-700 rounded-xl transition-all shrink-0 shadow-sm backdrop-blur-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Padam & Selaraskan ({invalidPreRegPayments.length})
            </button>
          )}
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Expected */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sasaran Yuran ({formatMonthNameMalay(selectedMonth)})
          </span>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1">
            RM {totalDueMonth.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Daripada {monthPayments.length} invois berdaftar
          </span>
        </div>

        {/* Total Collected */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Jumlah Kutipan (Lunas)
          </span>
          <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
            RM {totalCollectedMonth.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            {paidCount} pelajar telah lunas sepenuhnya
          </span>
        </div>

        {/* Total Outstanding */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Baki Yuran Tertunggak
          </span>
          <div className="text-xl font-mono font-bold text-rose-700 mt-1">
            RM {totalOutstandingMonth.toFixed(2)}
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block font-medium">
            {unpaidCount + partialCount} invois belum selesai
          </span>
        </div>

        {/* Collection Percentage */}
        <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            Kadar Kutipan Semasa
          </span>
          <div className="text-xl font-mono font-bold text-blue-900 mt-1">
            {totalDueMonth > 0 ? Math.round((totalCollectedMonth / totalDueMonth) * 100) : 0}%
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${totalDueMonth > 0 ? Math.min((totalCollectedMonth / totalDueMonth) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* Filter and Month Picker Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/80 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-semibold text-slate-700">Pilih Bulan:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs border border-white/80 rounded-xl px-3 py-1.5 bg-white/70 backdrop-blur-md text-slate-800 font-medium focus:ring-2 focus:ring-blue-600/40 focus:outline-hidden"
          >
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">Disember 2026</option>
            <option value="2026-08">Ogos 2026</option>
          </select>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pelajar, resit, atau penjaga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-white/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600/40 bg-white/60 backdrop-blur-md"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="text-xs border border-white/80 rounded-xl px-2.5 py-1.5 bg-white/70 backdrop-blur-md text-slate-700 focus:ring-2 focus:ring-blue-600/40 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Lunas Sahaja</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="partial">Separa Sahaja</option>
          </select>
        </div>

      </div>

      {/* Payment Records Table */}
      <div className="glass-panel rounded-2xl border border-white/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-white/50 backdrop-blur-md border-b border-slate-200/60 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Resit</th>
                <th className="py-3 px-4">Pelajar & Penjaga</th>
                <th className="py-3 px-4">Tingkatan & Subjek</th>
                <th className="py-3 px-4 text-right">Perlu Dibayar</th>
                <th className="py-3 px-4 text-right">Telah Dibayar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Kaedah Bayaran</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => {
                  const student = students.find(s => s.id === payment.studentId);
                  if (!student) return null;

                  const balance = Math.max(0, payment.amountDue - payment.amountPaid);
                  const isFullyPaid = payment.status === 'paid';
                  const regMonth = student.registrationDate && student.registrationDate.length >= 7 
                    ? student.registrationDate.substring(0, 7) 
                    : '2026-01';
                  const isPreRegBill = selectedMonth < regMonth;

                  return (
                    <tr 
                      key={payment.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isPreRegBill ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {payment.receiptNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {student.name}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {student.parentName} · {student.parentPhone}
                        </div>
                        {isPreRegBill && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            Daftar {formatMonthNameMalay(regMonth)} (Yuran sepatutnya mula {formatMonthNameMalay(regMonth)})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{student.level}</div>
                        <div className="text-slate-500 text-[11px]">
                          {student.registeredClassIds.length} subjek berdaftar
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        RM {payment.amountDue.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        RM {payment.amountPaid.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {payment.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Lunas
                          </span>
                        )}
                        {payment.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" />
                            Separa (-RM{balance.toFixed(0)})
                          </span>
                        )}
                        {payment.status === 'unpaid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Belum Bayar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {payment.paymentDate ? (
                          <div>
                            <span className="font-medium text-slate-800">{payment.paymentMethod}</span>
                            <span className="text-slate-400 text-[10px] block">{payment.paymentDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum dibuat</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Butang: Rekod / Kemaskini Bayaran */}
                          <button
                            onClick={() => handleOpenPayModal(payment, student)}
                            title={isFullyPaid ? "Ubah atau Batal Bayaran" : "Rekod Bayaran"}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                              isFullyPaid
                                ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                            }`}
                          >
                            {isFullyPaid ? 'Ubah / Batal' : 'Rekod Bayaran'}
                          </button>

                          {/* Butang: Papar Resit Rasmi */}
                          <button
                            onClick={() => onViewReceipt(payment, student)}
                            title="Papar & Cetak Resit Rasmi"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Butang: Peringatan WhatsApp (jika belum lunas) */}
                          {!isFullyPaid && (
                            <button
                              onClick={() => handleSendWhatsAppReminder(payment, student)}
                              title="Hantar Peringatan Yuran WhatsApp ke Penjaga"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Butang: Padam Invois (jika silap jana atau pra-pendaftaran) */}
                          {onDeletePayment && (
                            <button
                              onClick={() => {
                                if (confirm(`Adakah anda pasti ingin memadam rekod invois ${payment.receiptNumber} bagi ${student.name}?`)) {
                                  onDeletePayment(payment.id);
                                }
                              }}
                              title="Padam Invois Ini"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Tiada rekod yuran bagi bulan {formatMonthNameMalay(selectedMonth)}.</p>
                    <p className="text-xs mt-1">Sila klik butang "Jana Bil Yuran" di atas untuk menjana bil secara automatik.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Rekod Pembayaran Yuran */}
      {isPayModalOpen && activePaymentRecord && activeStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Rekod Transaksi Pembayaran Yuran
                </h3>
                <p className="text-xs text-slate-500">
                  {activePaymentRecord.receiptNumber} · Bulan: {formatMonthNameMalay(activePaymentRecord.month)}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              
              {/* Ringkasan Pelajar */}
              <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-blue-700 font-semibold uppercase block">Pelajar:</span>
                  <span className="font-bold text-blue-950 text-sm">{activeStudent.name}</span>
                  <span className="text-slate-600 text-[11px] block mt-0.5">Penjaga: {activeStudent.parentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Jumlah Perlu Dibayar:</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    RM {activePaymentRecord.amountDue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Amaun Bayaran Diterima (RM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={activePaymentRecord.amountDue * 2}
                    required
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono text-base font-bold text-slate-900 bg-white"
                  />
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(activePaymentRecord.amountDue)}
                      className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded font-semibold"
                    >
                      Bayar Penuh (RM {activePaymentRecord.amountDue.toFixed(0)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(activePaymentRecord.amountDue / 2)}
                      className="text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded font-medium"
                    >
                      Bayar Separuh (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(0)}
                      className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-600" />
                      Set Semula ke RM0 (Belum Bayar)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Kaedah Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="DuitNow / Bank Transfer">DuitNow / Bank Transfer</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Kad / Online Banking">Kad / Online Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Tarikh Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    No. Rujukan Transaksi (Pilihan)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MBB-983274 atau Tunai"
                    value={referenceNoInput}
                    onChange={(e) => setReferenceNoInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Pegawai Penerima
                  </label>
                  <input
                    type="text"
                    value={receivedByInput}
                    onChange={(e) => setReceivedByInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bayaran baki akan diselesaikan minggu hadapan"
                    value={paymentNotesInput}
                    onChange={(e) => setPaymentNotesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

              </div>

              {/* Status Preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span>Status Bayaran Yang Akan Dikemaskini:</span>
                <span className={`font-semibold ${
                  amountPaidInput >= activePaymentRecord.amountDue ? 'text-emerald-700' :
                  amountPaidInput > 0 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {amountPaidInput >= activePaymentRecord.amountDue ? 'LUNAS SEPENUHNYA' :
                   amountPaidInput > 0 ? `SEPARA (BAKI: RM${(activePaymentRecord.amountDue - amountPaidInput).toFixed(2)})` : 'BELUM BAYAR'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                {activePaymentRecord.amountPaid > 0 ? (
                  <button
                    type="button"
                    onClick={handleResetToUnpaid}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    Batal Bayaran (Set Belum Bayar)
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-semibold shadow-sm"
                  >
                    Simpan Rekod Bayaran
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
