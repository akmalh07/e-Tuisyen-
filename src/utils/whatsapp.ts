import { CenterSettings, PaymentRecord, Student, ClassSession, GradeRecord } from '../types';

/**
 * Format phone number for WhatsApp wa.me link.
 * Removes symbols, spaces, and ensures 60 country prefix for Malaysia.
 */
export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  } else if (!cleaned.startsWith('60') && cleaned.length >= 9) {
    cleaned = '60' + cleaned;
  }
  return cleaned;
}

/**
 * Month formatting helper in Malay.
 */
export function formatMonthNameMalay(monthStr: string): string {
  // Accepts YYYY-MM
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const monthNum = parseInt(parts[1], 10);
  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];
  const monthName = months[monthNum - 1] || monthStr;
  return `${monthName} ${parts[0]}`;
}

/**
 * Generate WhatsApp link for Monthly Tuition Fee Reminder.
 */
export function generateFeeReminderWhatsAppUrl(
  student: Student,
  payment: PaymentRecord,
  settings: CenterSettings
): string {
  const phone = formatWhatsAppNumber(student.parentPhone);
  const monthMalay = formatMonthNameMalay(payment.month);
  const balanceDue = Math.max(0, payment.amountDue - payment.amountPaid);

  const message = `Assalamualaikum & Salam Sejahtera Tuan/Puan ${student.parentName},\n\n` +
    `Pemberitahuan mesra mengenai *Yuran Tuisyen ${monthMalay}* bagi anak tuan/puan, *${student.name}* (${student.level}):\n\n` +
    `📌 *Jumlah Yuran:* RM${payment.amountDue.toFixed(2)}\n` +
    `💵 *Telah Dibayar:* RM${payment.amountPaid.toFixed(2)}\n` +
    `⚠️ *Baki Tertunggak:* *RM${balanceDue.toFixed(2)}*\n\n` +
    `Pembayaran boleh dibuat ke akaun rasmi kami:\n` +
    `🏦 *Bank:* ${settings.bankName}\n` +
    `🔢 *No. Akaun:* ${settings.accountNumber}\n` +
    `👤 *Nama Akaun:* ${settings.accountHolder}\n\n` +
    `Sila kemukakan slip/resit transaksi kepada pihak kami selepas pembayaran dibuat untuk pengeluaran resit rasmi.\n\n` +
    `Kerjasama dan perhatian tuan/puan amat kami hargai. Terima kasih.\n\n` +
    `Daripada,\n` +
    `*${settings.centerName}*\n` +
    `Tel: ${settings.phone}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for Attendance Notification.
 */
export function generateAttendanceWhatsAppUrl(
  student: Student,
  classSession: ClassSession,
  status: 'present' | 'absent' | 'excused',
  date: string,
  settings: CenterSettings
): string {
  const phone = formatWhatsAppNumber(student.parentPhone);
  const statusMalay = status === 'present' 
    ? '✅ TELAH HADIR' 
    : status === 'absent' 
    ? '❌ TIDAK HADIR' 
    : 'ℹ️ BERSEBAB / CUTI';

  const message = `Assalamualaikum & Salam Sejahtera Tuan/Puan ${student.parentName},\n\n` +
    `Laporan Kehadiran Kelas Tuisyen bagi *${student.name}*:\n\n` +
    `📅 *Tarikh:* ${date}\n` +
    `📚 *Kelas / Subjek:* ${classSession.subject} (${classSession.level})\n` +
    `⏰ *Waktu:* ${classSession.startTime} - ${classSession.endTime}\n` +
    `👨‍🏫 *Tutor:* ${classSession.tutorName}\n` +
    `📍 *Status Kehadiran:* *${statusMalay}*\n\n` +
    (status === 'absent' ? `Sekiranya ada sebarang makluman atau kecemasan, sila hubungi pihak kami di talian ${settings.phone}.\n\n` : '') +
    `Terima kasih atas keprihatinan tuan/puan.\n\n` +
    `*${settings.centerName}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for Receipt Confirmation.
 */
export function generateReceiptWhatsAppUrl(
  student: Student,
  payment: PaymentRecord,
  settings: CenterSettings
): string {
  const phone = formatWhatsAppNumber(student.parentPhone);
  const monthMalay = formatMonthNameMalay(payment.month);

  const message = `Assalamualaikum & Salam Sejahtera Tuan/Puan ${student.parentName},\n\n` +
    `*PENGESAHAN PENERIMAAN BAYARAN YURAN*\n` +
    `Kami telah menerima bayaran yuran bagi pelajar: *${student.name}*.\n\n` +
    `🧾 *No. Resit:* ${payment.receiptNumber}\n` +
    `📅 *Bulan:* ${monthMalay}\n` +
    `💰 *Amaun Diterima:* RM${payment.amountPaid.toFixed(2)}\n` +
    `💳 *Kaedah:* ${payment.paymentMethod}\n` +
    `🗓️ *Tarikh Bayaran:* ${payment.paymentDate || 'Hari ini'}\n` +
    `✅ *Status:* LUNAS SEPENUHNYA\n\n` +
    `Terima kasih atas sokongan berterusan tuan/puan terhadap pembelajaran anak di ${settings.centerName}.\n\n` +
    `Yang benar,\n` +
    `*${settings.centerName}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for Student Academic Progress / Grade Report.
 */
export function generateGradeWhatsAppUrl(
  student: Student,
  grade: GradeRecord,
  settings: CenterSettings
): string {
  const phone = formatWhatsAppNumber(student.parentPhone);

  const message = `Assalamualaikum & Salam Sejahtera Tuan/Puan ${student.parentName},\n\n` +
    `*LAPORAN PRESTASI & PENILAIAN PELAJAR*\n` +
    `Berikut adalah keputusan penilaian bagi *${student.name}* (${student.level}):\n\n` +
    `📝 *Ujian/Penilaian:* ${grade.examName}\n` +
    `📚 *Subjek:* ${grade.subject}\n` +
    `🎯 *Markah:* ${grade.marks}/${grade.maxMarks} (Gred: *${grade.grade}*)\n` +
    `📅 *Tarikh:* ${grade.date}\n\n` +
    `💬 *Ulasan Tutor:*\n` +
    `"${grade.tutorFeedback}"\n\n` +
    `Pihak kami akan terus membimbing ${student.name} untuk mencapai potensi terbaik. Terima kasih!\n\n` +
    `*${settings.centerName}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for Monthly Attendance Report.
 */
export function generateMonthlyAttendanceWhatsAppUrl(
  student: Student,
  monthStr: string,
  presentCount: number,
  absentCount: number,
  excusedCount: number,
  totalSessions: number,
  attendanceRate: number,
  settings: CenterSettings
): string {
  const phone = formatWhatsAppNumber(student.parentPhone);
  const monthMalay = formatMonthNameMalay(monthStr);

  const statusDesc = attendanceRate >= 90 
    ? '🌟 CEMERLANG' 
    : attendanceRate >= 75 
    ? '✅ BAIK' 
    : '⚠️ PERLU PERHATIAN';

  const message = `Assalamualaikum & Salam Sejahtera Tuan/Puan ${student.parentName},\n\n` +
    `*RINGKASAN KEHADIRAN BULANAN PELAJAR*\n` +
    `Pihak *${settings.centerName}* ingin berkongsi rekod kehadiran anak tuan/puan bagi bulan *${monthMalay}*:\n\n` +
    `👤 *Nama Pelajar:* ${student.name} (${student.level})\n` +
    `🗓️ *Bulan:* ${monthMalay}\n` +
    `📊 *Peratus Kehadiran:* *${attendanceRate}%* (${statusDesc})\n\n` +
    `Perincian Sesi Kelas:\n` +
    `• Jumlah Sesi Dijalankan: ${totalSessions} sesi\n` +
    `• Hadir: ${presentCount} sesi\n` +
    `• Tidak Hadir: ${absentCount} sesi\n` +
    `• Bersebab / Cuti: ${excusedCount} sesi\n\n` +
    (absentCount > 0 
      ? `Kerjasama tuan/puan untuk memastikan kehadiran penuh ke kelas amat kami hargai demi kesinambungan pembelajaran anak.\n\n` 
      : `Tahniah atas komitmen kehadiran yang konsisten!\n\n`) +
    `Sekiranya ada pertanyaan, sila hubungi kami di talian ${settings.phone}.\n\n` +
    `Terima kasih.\n` +
    `*${settings.centerName}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

