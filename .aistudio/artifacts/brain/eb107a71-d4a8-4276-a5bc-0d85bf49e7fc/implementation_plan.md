# Sistem Pengurusan Kelas Tuisyen Pintar (e-Tuisyen Manager)

Aplikasi berasaskan web komprehensif dan intuitif untuk pemilik pusat tuisyen fizikal dan tutor persendirian bagi menguruskan rekod pendaftaran pelajar, jadual kelas, semakan kehadiran harian, penjejakan yuran bulanan dengan jana resit rasmi serta komunikasi pantas ke WhatsApp ibu bapa.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan maklum balas anda, aplikasi ini direka khas mengikut keperluan operasi berikut:

- **Model Operasi Disahkan**: Dioptimumkan untuk pusat tuisyen fizikal dan kelas bimbingan persendirian, dengan susun atur bilik kelas fizikal dan kemudahan semakan pantas harian.
- **Struktur Yuran Disahkan**: Penetapan yuran bulanan tetap mengikut subjek atau pakej pembelajaran, dengan status lunas/tertunggak serta rekod kaedah pembayaran (DuitNow/Bank Transfer/Tunai).
- **Ciri Komunikasi Disahkan**: Integrasi templat WhatsApp terus ke nombor ibu bapa (pemberitahuan kehadiran & peringatan yuran), penjana resit rasmi boleh cetak/PDF, dan slip rekod prestasi akademik pelajar.
- **Penyimpanan Rekod & Privasi**: Semua data disimpan secara selamat terus dalam storan setempat pelayar (`localStorage`) dengan fungsi Sandaran & Muat Turun (JSON Backup & Restore) untuk mengelakkan sebarang kehilangan rekod.

---

## 1. Overview & Core Concept

### What It Does
Sistem ini menyediakan satu hab bersepadu yang menghapuskan penggunaan buku log fizikal atau fail hamparan manual yang berselerak. Pengusaha tuisyen boleh:
1. Mendaftar maklumat pelajar, ibu bapa/penjaga, dan subjek yang diambil dalam beberapa saat.
2. Menyusun dan melihat jadual kelas mengikut hari, masa, subjek, tingkatan/tahun, dan nama tutor.
3. Merekod kehadiran bagi setiap sesi kelas dengan butang kehadiran pantas serta pautan makluman ke WhatsApp ibu bapa jika perlu.
4. Memantau aliran tunai yuran bulanan, menjana nombor resit unik automatik, dan menghantar notis peringatan yuran berkhemah ke WhatsApp penjaga.
5. Mencatat markah ujian bulanan dan ulasan perkembangan pelajar untuk dijana sebagai Slip Prestasi ringkas.

### Target Audience & Persona
- Pengusaha dan pentadbir pusat tuisyen fizikal (Tahun 1–6 & Tingkatan 1–5 SPM/STPM).
- Guru dan tutor tuisyen persendirian (home tuition atau studio kelas bimbingan).

### Key Value
Menjimatkan masa pengurusan harian sehingga 80%, mengurangkan isu yuran tertunggak melalui pemantauan visual yang jelas, dan meningkatkan profesionalisme pusat tuisyen di mata ibu bapa.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Papan Pemuka (Dashboard Overview)**:
   - Pengguna disambut dengan 4 metrik utama: Jumlah Pelajar Aktif, Jumlah Yuran Terkumpul Bulan Ini, Tunggakan Yuran Belum Dibayar, dan Purata Kehadiran Mingguan.
   - Bahagian *Kelas Hari Ini* menyenaraikan sesi kelas yang dijadualkan hari ini beserta butang 1-klik untuk "Ambil Kehadiran".
   - Akses pantas (Quick Action) untuk "Daftar Pelajar Baru", "Rekod Pembayaran", dan "Eksport Laporan".

2. **Pengurusan Pelajar (Student Directory)**:
   - Paparan senarai pelajar dalam grid kad kemas atau jadual berketumpatan tinggi.
   - Penapis pintar mengikut Tingkatan (Tahun 1-6, Tingkatan 1-5), Subjek, dan Status (Aktif / Cuti Sementara / Tidak Aktif).
   - Modal pendaftaran pelajar dengan validasi nombor telefon (format Malaysia `+601...`).
   - Paparan profil individu pelajar merangkumi sejarah kehadiran, invois yuran, dan markah penilaian.

3. **Jadual Waktu Kelas (Class Timetable)**:
   - Paparan mingguan (Isnin hingga Ahad) dan paparan harian interaktif.
   - Setiap slot menunjukkan: Subjek, Tingkatan/Tahun, Waktu (Mula-Tamat), Tutor Pengajar, dan Kapasiti Pelajar.
   - Penambahan dan penyuntingan waktu kelas dengan penetapan kadar yuran asas subjek.

4. **Sistem Kehadiran (Attendance Station)**:
   - Pilih hari dan sesi kelas yang berlangsung.
   - Senarai nama pelajar berdaftar dipaparkan dengan 3 butang status pantas: **Hadir**, **Tidak Hadir**, atau **Bersebab/Cuti**.
   - Ringkasan peratus kehadiran automatik dan butang 1-klik WhatsApp status kehadiran terus ke telefon penjaga.

5. **Pengurusan Yuran & Penjana Resit (Fee & Billing Hub)**:
   - Senarai invois yuran bulanan pelajar dengan status jelas: *Lunas*, *Separa*, atau *Tertunggak*.
   - Butang *Rekod Bayaran* yang mencatat tarikh, kaedah (DuitNow QR, Pindahan Bank, Tunai), dan nombor rujukan.
   - **Pratonton & Cetak Resit Rasmi**: Paparan slip resit kemas dengan logo/nama pusat tuisyen, rincian subjek, jumlah bayaran, dan tandatangan pentadbir yang mesra cetakan terus (A4/Slip).
   - **Peringatan WhatsApp 1-Klik**: Mesej pra-format yang sopan beserta nombor akaun pusat tuisyen dan amaun yuran tertunggak.

6. **Rekod Prestasi & Perkembangan (Academic Progress)**:
   - Log markah ujian/kuiz berkala mengikut subjek bagi setiap pelajar.
   - Catatan ulasan tutor mengenai kefahaman topik atau komitmen pelajar.
   - Pilihan jana Slip Laporan Prestasi mini untuk ditunjukkan kepada ibu bapa semasa perjumpaan atau melalui WhatsApp.

7. **Tetapan Pusat Tuisyen & Sandaran Data (Center Profile & Data)**:
   - Kemas kini Nama Pusat Tuisyen, Alamat, No. Telefon Pentadbir, dan Maklumat Akaun Bank untuk paparan resit.
   - Muat turun fail sandaran `JSON` dan muat naik semula data pada bila-bila masa.

### Visual Identity & Theme

- **Aesthetic Direction**: *Refined Academic Utility* — profesional, kemas, mesra pengguna tanpa kekusutan warna yang berlebihan, mencerminkan ketelitian institusi pendidikan moden.
- **Color Palette & Distribution (60-30-10 Rule)**:
  - **Neutral Canvas (60%)**: Latar belakang bersih Slate-50 / White (`#F8FAFC` / `#FFFFFF`) dengan kontras lembut, memberi tumpuan kepada teks dan maklumat penting.
  - **Structural Surfaces (30%)**: Kad dan panel dengan latar belakang putih (`#FFFFFF`), garisan sempadan halus slate (`#E2E8F0`), dan tipografi slate gelap (`#0F172A`).
  - **Accent Budget (10%)**: Biru Pendidikan Diraja (`#1E40AF` / Indigo-600) untuk elemen tindakan utama, tab aktif, dan butang navigasi.
  - **Status Semantik**: Hijau Zamrud (`#059669`) untuk *Hadir* & *Lunas*; Amber/Kuning Gelap (`#D97706`) untuk *Separa / Bersebab*; Merah Padat (`#DC2626`) untuk *Tidak Hadir* & *Tertunggak*.
- **Typography & Hierarchy**:
  - *Display / Headings*: Plus Jakarta Sans — kemas, moden dan berwibawa.
  - *Body Prose*: DM Sans — mudah dibaca pada pelbagai saiz skrin.
  - *Data & Financial Figures*: Monospace bertabular (`tabular-nums font-mono`) untuk penjajaran tepat nombor resit, masa kelas, dan angka Ringgit Malaysia (RM).
- **Anti-Slop Restraint**:
  - Tiada badge pill berganda yang berselerak; metadata dipaparkan dengan pemisah tipografi bersih (`·`).
  - Tiada graf palsu atau status sistem olok-olok.
  - Setiap butang mempunyai tindak balas nyata (modal dibuka, status dikemas kini, resit dipaparkan, mesej WhatsApp dibuka).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Penyimpanan Data Pelayar Tempatan (`localStorage`) + JSON Export/Import**
  - *Chosen Approach*: Menyimpan semua struktur rekod pelajar, jadual, kehadiran, dan pembayaran secara automatik di pelayar pengguna dengan ciri sandaran fail satu klik (Export/Import JSON).
  - *Why*: Sangat pantas, sifar kos pelayan tambahan, tidak memerlukan log masuk rumit untuk bermula, serta selamat kerana rekod sulit nombor telefon dan yuran pelajar kekal di bawah kawalan penuh guru tuisyen.
  - *Alternatives Considered*: Pangkalan data cloud luaran memerlukan persediaan akaun dan konfigurasi kunci API tambahan yang merumitkan penggunaan harian pantas.

- **Decision 2: Integrasi Komunikasi WhatsApp Berasaskan URL Protocol (`wa.me`)**
  - *Chosen Approach*: Menggunakan protokol pautan rasmi WhatsApp Web / App (`https://wa.me/60.../?text=...`) dengan templat mesej siap bina yang telah disanitasi.
  - *Why*: Berfungsi serta-merta pada komputer riba dan telefon pintar tanpa memerlukan langganan API berbayar WhatsApp Business yang mahal, membolehkan guru menyemak mesej sebelum menekan butang hantar.

- **Decision 3: Paparan Resit Sedia Cetak Terus Berasaskan CSS Print Media**
  - *Chosen Approach*: Mereka bentuk komponen resit rasmi dengan gaya cetakan (`@media print`) khusus yang menyembunyikan navigasi web dan memformat slip A4/resit secara kemas apabila butang "Cetak Resit" ditekan.
  - *Why*: Menghasilkan cetakan fizikal atau simpanan "Save as PDF" yang cantik tanpa bergantung kepada pustaka PDF berat yang sering mengalami isu fon atau pemotongan halaman.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│  [Logo: e-Tuisyen Manager]  [Tabs: Dashboard | Pelajar | Jadual | Kehadiran | Yuran | Prestasi | Tetapan] │
└────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  DashboardOverview   │  │    StudentManager    │  │   ScheduleManager    │
│ ∙ 4 Kad Metrik Utama │  │ ∙ Senarai & Carian   │  │ ∙ Jadual Mingguan    │
│ ∙ Kelas Hari Ini     │  │ ∙ Form Daftar Baru   │  │ ∙ Penapis Hari/Subjek│
│ ∙ Peringatan Segera  │  │ ∙ Profil & Sejarah   │  │ ∙ Tambah/Ubah Slot   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
    │                               │                               │
    ▼                               ▼                               ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  AttendanceTracker   │  │    FeeBillingHub     │  │    StudentProgress   │
│ ∙ Pilih Sesi & Tarikh│  │ ∙ Status Bayaran     │  │ ∙ Markah Ujian/Kuiz  │
│ ∙ Tik Hadir/Tidak/Cuti│ │ ∙ Rekod Bayaran & QR │  │ ∙ Ulasan Perkembangan│
│ ∙ Notifikasi WA      │  │ ∙ Cetak Resit Rasmi  │  │ ∙ Slip Prestasi Mini │
└──────────────────────┘  │ ∙ WhatsApp Peringatan│  └──────────────────────┘
                          └──────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      State & Storage Repository                        │
│  ∙ tuition_students  ∙ tuition_classes  ∙ tuition_attendance           │
│  ∙ tuition_payments  ∙ tuition_grades   ∙ tuition_settings             │
│  [Sinkronisasi automatik LocalStorage + Eksport/Import JSON Backup]    │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Entities

```typescript
// Profil Pelajar
interface Student {
  id: string;
  name: string;
  icOrMyKid: string;
  level: string; // cth: 'Tingkatan 4', 'Tahun 6'
  school: string;
  parentName: string;
  parentPhone: string; // format WhatsApp: cth '60123456789'
  registeredSubjects: string[]; // cth: ['Matematik', 'Sains']
  monthlyFee: number; // Jumlah yuran bulanan (RM)
  registrationDate: string;
  status: 'active' | 'suspended' | 'inactive';
}

// Sesi Kelas / Jadual
interface ClassSession {
  id: string;
  subject: string;
  level: string;
  dayOfWeek: 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu' | 'Ahad';
  startTime: string; // cth: '20:00'
  endTime: string;   // cth: '21:30'
  tutorName: string;
  room: string;
  feePerMonth: number;
}

// Rekod Kehadiran
interface AttendanceRecord {
  id: string;
  date: string; // 'YYYY-MM-DD'
  classId: string;
  studentId: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
}

// Rekod Pembayaran Yuran
interface PaymentRecord {
  id: string;
  receiptNumber: string; // cth: 'RCP-2026-0042'
  studentId: string;
  month: string; // cth: 'Oktober 2026'
  amount: number;
  paymentMethod: 'DuitNow / Bank Transfer' | 'Tunai' | 'Kad';
  paymentDate: string;
  status: 'paid' | 'partial' | 'unpaid';
  referenceNo?: string;
  receivedBy: string;
}

// Rekod Prestasi Akademik
interface GradeRecord {
  id: string;
  studentId: string;
  subject: string;
  examName: string; // cth: 'Ujian Bulanan 1', 'Percubaan SPM'
  marks: number;
  grade: string;
  tutorFeedback: string;
  date: string;
}

// Profil Tetapan Pusat Tuisyen
interface CenterSettings {
  centerName: string;
  registrationNumber: string;
  phone: string;
  address: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  currency: 'RM';
}
```

### Pre-loaded Realistic Sample Data
Aplikasi ini akan dibekalkan terus dengan set data contoh yang realistik berasaskan sukatan dan sistem tuisyen di Malaysia (pelajar Tingkatan 1–5 SPM, subjek teras seperti Matematik Tambahan, Sains, Bahasa Melayu, Bahasa Inggeris, serta contoh rekod pembayaran yuran dan jadual waktu sebenar) supaya pengusaha boleh terus melihat dan menguji sistem serta-merta tanpa skrin kosong.
