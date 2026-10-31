import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  BarChart, 
  LineChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Users,
  UserPlus,
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { PaymentRecord, Student } from '../types';
import { formatMonthNameMalay } from '../utils/whatsapp';

interface MonthlyRevenueFlowChartProps {
  payments: PaymentRecord[];
  students: Student[];
  onNavigateToFees?: () => void;
  onNavigateToStudents?: () => void;
}

type ChartMode = 'growth-revenue' | 'registration' | 'flow' | 'comparison' | 'rate';
type TimeframeOption = 'all' | '6m' | '3m';

export const MonthlyRevenueFlowChart: React.FC<MonthlyRevenueFlowChartProps> = ({
  payments,
  students,
  onNavigateToFees,
  onNavigateToStudents
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('growth-revenue');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');

  // Compute aggregated monthly data for both Student Registration Growth & Revenue Trends
  const allMonthlyData = useMemo(() => {
    // Collect all YYYY-MM from student registration dates and payment records
    const studentMonths = students
      .map(s => (s.registrationDate ? s.registrationDate.substring(0, 7) : ''))
      .filter(Boolean);
    const paymentMonths = payments.map(p => p.month).filter(Boolean);

    // Merge and sort all months chronologically
    const monthSet = new Set([...studentMonths, ...paymentMonths]);

    // Ensure current month is included
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    monthSet.add(currentMonthStr);

    const sortedMonths = Array.from(monthSet).sort();

    return sortedMonths.map((m, idx) => {
      // New student registrations in month m
      const newStudentsInMonth = students.filter(
        s => s.registrationDate && s.registrationDate.substring(0, 7) === m
      );
      const newRegistrationsCount = newStudentsInMonth.length;

      // Cumulative active/registered students up to month m
      const cumulativeStudentsCount = students.filter(s => {
        if (!s.registrationDate) return false;
        return s.registrationDate.substring(0, 7) <= m;
      }).length;

      // Payment calculations for month m
      const mPayments = payments.filter(p => p.month === m);
      const target = mPayments.reduce((sum, p) => sum + p.amountDue, 0);
      const collected = mPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const outstanding = Math.max(0, target - collected);
      const rate = target > 0 ? Math.round((collected / target) * 100) : 0;
      const paidStudentsCount = mPayments.filter(p => p.status === 'paid').length;
      const totalInvoices = mPayments.length;

      // Malay month formatting (e.g. "Jan 2026")
      const fullName = formatMonthNameMalay(m);
      const parts = fullName.split(' ');
      const shortName = parts.length >= 2 
        ? `${parts[0].substring(0, 3)} '${parts[1].slice(-2)}` 
        : fullName;

      return {
        monthKey: m,
        fullName,
        shortName,
        PendaftaranBaru: newRegistrationsCount,
        JumlahPelajar: cumulativeStudentsCount,
        Kutipan: collected,
        Sasaran: target,
        Tertunggak: outstanding,
        KadarKutipan: rate,
        paidStudentsCount,
        totalInvoices,
        index: idx
      };
    });
  }, [payments, students]);

  // Apply timeframe filter
  const chartData = useMemo(() => {
    if (timeframe === '3m') {
      return allMonthlyData.slice(-3);
    }
    if (timeframe === '6m') {
      return allMonthlyData.slice(-6);
    }
    return allMonthlyData;
  }, [allMonthlyData, timeframe]);

  // Financial and Student KPI Metrics
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.Kutipan, 0);
  }, [chartData]);

  const totalTarget = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.Sasaran, 0);
  }, [chartData]);

  const totalNewRegistrations = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.PendaftaranBaru, 0);
  }, [chartData]);

  const avgMonthlyRevenue = useMemo(() => {
    const activeRevenueMonths = chartData.filter(d => d.Kutipan > 0);
    return activeRevenueMonths.length > 0 
      ? Math.round(totalRevenue / activeRevenueMonths.length) 
      : 0;
  }, [totalRevenue, chartData]);

  const bestRevenueMonth = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((prev, curr) => (curr.Kutipan > prev.Kutipan ? curr : prev), chartData[0]);
  }, [chartData]);

  // Month-over-Month Growth (Student Registrations)
  const studentGrowthMom = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].PendaftaranBaru;
    const prev = chartData[chartData.length - 2].PendaftaranBaru;
    return last - prev;
  }, [chartData]);

  const latestMonthData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Custom Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/60 text-xs min-w-[240px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm font-heading">
              <Calendar className="w-4 h-4 text-blue-400" />
              {data.fullName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              +{data.PendaftaranBaru} Pelajar Baru
            </span>
          </div>

          {/* Student Growth Metrics */}
          <div className="space-y-1 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
              Pertumbuhan Pelajar
            </div>
            <div className="flex justify-between items-center text-slate-200">
              <span className="text-slate-400">Pendaftaran Baru:</span>
              <span className="font-bold font-mono text-emerald-400">+{data.PendaftaranBaru} orang</span>
            </div>
            <div className="flex justify-between items-center text-slate-200">
              <span className="text-slate-400">Jumlah Pelajar Kumulatif:</span>
              <span className="font-bold font-mono text-amber-400">{data.JumlahPelajar} orang</span>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="space-y-1 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 font-mono text-[11px]">
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-sans">
              Kutipan Yuran Bulanan
            </div>
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-slate-400 font-sans">Kutipan Diterima:</span>
              <span className="font-bold">RM {data.Kutipan.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {data.Sasaran > 0 && (
              <>
                <div className="flex justify-between items-center text-rose-400">
                  <span className="text-slate-400 font-sans">Tertunggak:</span>
                  <span className="font-bold">RM {data.Tertunggak.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 border-t border-slate-700/60 pt-1">
                  <span className="text-slate-400 font-sans">Sasaran Yuran:</span>
                  <span className="font-bold">RM {data.Sasaran.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between font-sans">
            <span>Kadar Lunas Yuran:</span>
            <span className="text-slate-200 font-bold font-mono">
              {data.Sasaran > 0 ? `${data.KadarKutipan}% (${data.paidStudentsCount}/${data.totalInvoices} lunas)` : 'Tiada Invois'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/80 shadow-xl overflow-hidden transition-all">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-white/60 bg-white/40 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Badge */}
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-indigo-600/10 text-indigo-700 rounded-xl border border-indigo-200/60">
                <BarChart3 className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight font-heading">
                    Analisis Pertumbuhan Pelajar & Trend Pendapatan
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Recharts Insights
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trend pertumbuhan pendaftaran pelajar baru, jumlah headcount aktif, serta aliran tunai pendapatan yuran bulanan.
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons (Chart Mode & Timeframe) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Timeframe Filter */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-medium text-slate-600 border border-slate-200/60">
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === '3m'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                3 Bulan
              </button>
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === '6m'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                6 Bulan
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'all'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Semua Bulan
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-medium text-slate-600 border border-slate-200/60">
              <button
                onClick={() => setChartMode('growth-revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'growth-revenue'
                    ? 'bg-indigo-700 text-white font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Papar Dual-Paksi: Pelajar & Pendapatan"
              >
                <span>Insights Dual-Paksi</span>
              </button>

              <button
                onClick={() => setChartMode('registration')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'registration'
                    ? 'bg-indigo-700 text-white font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Papar Trend Pendaftaran Pelajar Baru"
              >
                <span>Pertumbuhan Pelajar</span>
              </button>

              <button
                onClick={() => setChartMode('flow')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'flow'
                    ? 'bg-indigo-700 text-white font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Papar Trend Pendapatan & Gelombang Aliran Tunai"
              >
                <span>Aliran Pendapatan</span>
              </button>

              <button
                onClick={() => setChartMode('comparison')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'comparison'
                    ? 'bg-indigo-700 text-white font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Papar Perbandingan Kutipan vs Sasaran"
              >
                <span>Kutipan vs Sasaran</span>
              </button>
            </div>

          </div>

        </div>

        {/* 4 Core Business Insight KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          
          {/* Card 1: Jumlah Pendaftaran Pelajar Baru */}
          <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <span>Pendaftaran Baru</span>
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 mt-1">
              +{totalNewRegistrations} <span className="text-xs font-normal text-slate-500">pelajar</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between items-center">
              <span>Trend kumulatif: {students.length} berdaftar</span>
              {onNavigateToStudents && (
                <button 
                  onClick={onNavigateToStudents}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Urus &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Jumlah Pendapatan Terkumpul */}
          <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <span>Jumlah Kutipan Yuran</span>
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
              RM {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Sasaran tempoh: RM {totalTarget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>

          {/* Card 3: Purata Pendapatan Sebulan */}
          <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <span>Purata Pendapatan</span>
              <Target className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
              RM {avgMonthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              <span className="text-xs text-slate-400 font-normal"> /bln</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Purata kutipan sebulan
            </div>
          </div>

          {/* Card 4: Bulan Pendapatan Tertinggi */}
          <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <span>Bulan Puncak</span>
              <Award className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
              {bestRevenueMonth ? bestRevenueMonth.fullName : '-'}
            </div>
            <div className="text-[10px] font-mono font-semibold text-emerald-700 mt-0.5">
              {bestRevenueMonth ? `RM ${bestRevenueMonth.Kutipan.toLocaleString('en-US', { minimumFractionDigits: 0 })} dikutip` : '-'}
            </div>
          </div>

        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="p-5 sm:p-6">
        {chartData.length > 0 ? (
          <div>
            
            {/* Chart Legend & Indicators */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                {chartMode === 'growth-revenue' && (
                  <>
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-xs" />
                      Kutipan Pendapatan (RM) [Paksi Kiri]
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-xs" />
                      Pendaftaran Pelajar Baru [Paksi Kanan]
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                      Jumlah Headcount Pelajar Kumulatif [Paksi Kanan]
                    </span>
                  </>
                )}

                {chartMode === 'registration' && (
                  <>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-xs" />
                      Pendaftaran Baru Sebulan
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                      Jumlah Pelajar Kumulatif Aktif
                    </span>
                  </>
                )}

                {chartMode === 'flow' && (
                  <>
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-xs" />
                      Aliran Pendapatan Sebenar (RM)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                      Purata Bulanan (RM {avgMonthlyRevenue})
                    </span>
                  </>
                )}

                {chartMode === 'comparison' && (
                  <>
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-xs" />
                      Kutipan Diterima (RM)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                      <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block shadow-xs" />
                      Tertunggak (RM)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-0.5 bg-slate-400 inline-block border-t border-dashed" />
                      Sasaran Invois
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {onNavigateToStudents && (
                  <button
                    onClick={onNavigateToStudents}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>Pengurusan Pelajar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onNavigateToFees && (
                  <button
                    onClick={onNavigateToFees}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    <span>Hub Yuran</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                
                {chartMode === 'growth-revenue' ? (
                  <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    
                    {/* Left Y-Axis for Revenue (RM) */}
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => `RM${val}`}
                    />

                    {/* Right Y-Axis for Student Count */}
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#059669' }} 
                      axisLine={false} 
                      tickLine={false}
                      allowDecimals={false}
                      tickFormatter={(val) => `${val} org`}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Bar for Revenue Collected (Left Axis) */}
                    <Bar 
                      yAxisId="left" 
                      dataKey="Kutipan" 
                      name="Kutipan Pendapatan (RM)" 
                      fill="#2563EB" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={28} 
                    />

                    {/* Bar for New Student Registrations (Right Axis) */}
                    <Bar 
                      yAxisId="right" 
                      dataKey="PendaftaranBaru" 
                      name="Pendaftaran Pelajar Baru" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={18} 
                    />

                    {/* Line for Cumulative Active Students (Right Axis) */}
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="JumlahPelajar" 
                      name="Jumlah Pelajar Kumulatif" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#F59E0B', stroke: '#B45309', strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                ) : chartMode === 'registration' ? (
                  <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={false} 
                      tickLine={false}
                      allowDecimals={false}
                      tickFormatter={(val) => `${val} org`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="PendaftaranBaru" 
                      name="Pendaftaran Baru" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={32} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="JumlahPelajar" 
                      name="Jumlah Pelajar Kumulatif" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#F59E0B' }}
                    />
                  </ComposedChart>
                ) : chartMode === 'flow' ? (
                  <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFlowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => `RM${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {avgMonthlyRevenue > 0 && (
                      <ReferenceLine 
                        y={avgMonthlyRevenue} 
                        stroke="#F59E0B" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ 
                          value: `Purata RM${avgMonthlyRevenue}`, 
                          position: 'top', 
                          fill: '#B45309', 
                          fontSize: 10,
                          fontWeight: 600
                        }} 
                      />
                    )}

                    <Area 
                      type="monotone" 
                      dataKey="Kutipan" 
                      stroke="#2563EB" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#revenueFlowGradient)"
                      activeDot={{ r: 6, stroke: '#1E40AF', strokeWidth: 2, fill: '#FFFFFF' }}
                      name="Kutipan Diterima"
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => `RM${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="Kutipan" 
                      fill="#2563EB" 
                      radius={[4, 4, 0, 0]} 
                      name="Kutipan Diterima (RM)" 
                      maxBarSize={28} 
                    />
                    <Bar 
                      dataKey="Tertunggak" 
                      fill="#F43F5E" 
                      radius={[4, 4, 0, 0]} 
                      name="Tertunggak (RM)" 
                      maxBarSize={28} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Sasaran" 
                      stroke="#0F172A" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 3, fill: '#0F172A' }}
                      name="Sasaran Yuran" 
                    />
                  </ComposedChart>
                )}

              </ResponsiveContainer>
            </div>

            {/* Month-by-Month Business Growth & Revenue Breakdown Strip */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5 font-heading">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  Ringkasan Pertumbuhan Pelajar & Kutipan Yuran Bulanan
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {chartData.length} bulan dipaparkan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {chartData.map((item) => {
                  return (
                    <div 
                      key={item.monthKey} 
                      className="p-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-200/70 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{item.fullName.split(' ')[0]}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.3 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          +{item.PendaftaranBaru} Baru
                        </span>
                      </div>
                      
                      <div className="font-mono font-bold text-blue-900 text-xs sm:text-sm">
                        RM {item.Kutipan.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>

                      <div className="text-[10px] text-slate-500 flex justify-between items-center pt-0.5 border-t border-slate-200/50">
                        <span>Jumlah Pelajar:</span>
                        <span className="font-mono font-semibold text-slate-700">{item.JumlahPelajar} org</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Tiada Data Rekod Ditemui</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Carta pertumbuhan pelajar dan aliran pendapatan akan dipaparkan secara automatik sebaik pendaftaran dan rekod bayaran dimasukkan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
