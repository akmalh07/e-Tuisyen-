import React from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  User, 
  CreditCard 
} from 'lucide-react';
import { PaymentRecord, Student, CenterSettings, ClassSession } from '../types';
import { formatMonthNameMalay, generateReceiptWhatsAppUrl } from '../utils/whatsapp';

interface ReceiptModalProps {
  payment: PaymentRecord;
  student: Student;
  classes: ClassSession[];
  settings: CenterSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  student,
  classes,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const url = generateReceiptWhatsAppUrl(student, payment, settings);
    window.open(url, '_blank');
  };

  // Get enrolled class details
  const enrolledClasses = classes.filter(c => student.registeredClassIds.includes(c.id));
  const monthMalay = formatMonthNameMalay(payment.month);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl shadow-2xl max-w-2xl w-full border border-white/80 overflow-hidden my-8">
        
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print bg-white/40 backdrop-blur-md px-6 py-4 border-b border-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">Resit Rasmi Pembayaran</span>
            <span className="text-xs text-slate-500">· {payment.receiptNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp Penjaga
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Receipt Document Container */}
        <div className="p-8 sm:p-10 bg-white" id="printable-receipt">
          {/* Header Center Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-sm">
                  {settings.centerName.charAt(0)}
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {settings.centerName}
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                No. Pendaftaran: {settings.registrationNumber}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {settings.address}
              </p>
              <p className="text-xs text-slate-500">
                Tel: {settings.phone} · Emel: {settings.email}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 sm:border-l sm:border-slate-100 sm:pl-6">
              <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded font-semibold text-xs uppercase tracking-wider mb-1">
                RESIT RASMI BAYARAN
              </div>
              <p className="text-xs font-mono font-bold text-slate-800">
                {payment.receiptNumber}
              </p>
              <p className="text-xs text-slate-500">
                Tarikh: {payment.paymentDate || new Date().toISOString().split('T')[0]}
              </p>
              <p className="text-xs text-slate-500">
                Bulan Yuran: <span className="font-semibold text-slate-700">{monthMalay}</span>
              </p>
            </div>
          </div>

          {/* Student & Parent Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Maklumat Pelajar
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {student.name}
              </p>
              <p className="text-slate-600">
                No. K/P: <span className="font-mono text-slate-800">{student.icOrMyKid || '-'}</span>
              </p>
              <p className="text-slate-600">
                Tingkatan/Tahun: <span className="font-medium text-slate-800">{student.level}</span>
              </p>
              <p className="text-slate-600">
                Sekolah: {student.school || '-'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Maklumat Pembayar / Penjaga
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {student.parentName}
              </p>
              <p className="text-slate-600">
                No. WhatsApp: <span className="font-mono text-slate-800">{student.parentPhone}</span>
              </p>
              <p className="text-slate-600">
                Kaedah Bayaran: <span className="font-medium text-slate-800">{payment.paymentMethod}</span>
              </p>
              {payment.referenceNo && (
                <p className="text-slate-600">
                  No. Rujukan: <span className="font-mono text-slate-800">{payment.referenceNo}</span>
                </p>
              )}
            </div>
          </div>

          {/* Table Breakdown of Tuition Subjects */}
          <div className="py-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Perincian Yuran Pembelajaran
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-4 text-left font-semibold">Bil</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Keterangan Subjek / Pakej</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Tutor & Waktu</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Jumlah (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledClasses.length > 0 ? (
                    enrolledClasses.map((cls, idx) => (
                      <tr key={cls.id}>
                        <td className="py-2.5 px-4 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {cls.subject} ({cls.level})
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {cls.tutorName} · {cls.dayOfWeek} {cls.startTime}-{cls.endTime}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                          {cls.feePerMonth.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-4 text-slate-500">1</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800" colSpan={2}>
                        Yuran Bulanan Tuisyen ({monthMalay})
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                        {payment.amountDue.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                    <td colSpan={3} className="py-3 px-4 text-right">
                      Jumlah Yuran Perlu Dibayar:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      RM {payment.amountDue.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200 bg-blue-50/50">
                    <td colSpan={3} className="py-3 px-4 text-right font-bold text-blue-900">
                      Jumlah Diterima (Lunas):
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 text-base">
                      RM {payment.amountPaid.toFixed(2)}
                    </td>
                  </tr>
                  {payment.amountDue > payment.amountPaid && (
                    <tr className="border-t border-slate-200 text-rose-700 bg-rose-50/50">
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">
                        Baki Tertunggak:
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold">
                        RM {(payment.amountDue - payment.amountPaid).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Stamp, Signature & Footnote */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="space-y-2 text-slate-500 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                STATUS: {payment.status === 'paid' ? 'BAYARAN LUNAS' : payment.status === 'partial' ? 'BAYARAN SEPARA' : 'BELUM BAYAR'}
              </div>
              <p className="text-[11px] leading-relaxed">
                * Resit ini dijana oleh Sistem Pengurusan e-Tuisyen Pintar dan diakui sah tanpa tandatangan fizikal. Simpan slip ini sebagai rujukan bayaran rasmi anda.
              </p>
            </div>

            <div className="text-center sm:text-right space-y-1 w-full sm:w-auto">
              <div className="h-12 flex items-center justify-center sm:justify-end">
                <span className="font-heading italic font-bold text-slate-400 text-base">
                  {payment.receivedBy || settings.principalName}
                </span>
              </div>
              <div className="w-48 border-t border-slate-300 pt-1 text-slate-700 font-semibold text-center sm:text-right">
                {payment.receivedBy || settings.principalName}
              </div>
              <p className="text-[11px] text-slate-400 text-center sm:text-right">
                Pentadbiran {settings.centerName}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (hidden during print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Kongsi ke WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Resit
          </button>
        </div>

      </div>
    </div>
  );
};
