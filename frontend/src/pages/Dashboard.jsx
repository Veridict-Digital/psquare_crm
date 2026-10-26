import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ReactApexChart from 'react-apexcharts';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Phone,
  Package,
  Wallet,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Minus,
  LayoutDashboard,
  IndianRupee,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
  PhoneCall,
  ArrowRightLeft,
  ClipboardList,
  BadgePercent,
  BarChart3,
} from 'lucide-react';
import './Dashboard.css';

const BRAND = '#14264A';
const ACCENT = '#3478F6';
const ACCENT_TEAL = '#08AFA8';

const CHART_PALETTE = [
  '#3478F6',
  '#08AFA8',
  '#9855F7',
  '#20C997',
  '#FF4778',
  '#FFA640',
  '#625BEE',
  '#64A5FF',
];

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const inrShort = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return inr(v);
};

const STATUS_COLORS = {
  ordered: '#7186A8',
  Preparing: '#FFA640',
  Placed: '#3478F6',
  Dispatched: '#625BEE',
  Delivered: '#20C997',
  Cancelled: '#FF4778',
  Paid: '#20C997',
  Partial: '#FFA640',
  Credit: '#E54864',
  'No Status': '#7186A8',
  Advance: '#08AFA8',
  'Advance Payment Received': '#08AFA8',
  COD: '#FFA640',
  Pending: '#FFA640',
  'In Progress': '#3478F6',
  Completed: '#20C997',
  'Follow-up': '#625BEE',
  Customer: '#14264A',
  Lead: '#3478F6',
  New: '#7186A8',
  Contacted: '#3478F6',
  Qualified: '#625BEE',
  Converted: '#20C997',
  Lost: '#E54864',
};

const ChangeBadge = ({ value }) => {
  if (value === null || value === undefined) {
    return (
      <span className="crm-dash__change crm-dash__change--flat">
        <Minus className="w-3.5 h-3.5" /> vs prior
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`crm-dash__change ${up ? 'crm-dash__change--up' : 'crm-dash__change--down'}`}>
      <Icon className="w-3.5 h-3.5" />
      {up ? '+' : ''}
      {value}% vs prior
    </span>
  );
};

const Panel = ({ title, action, children, className = '', dark = false }) => (
  <div className={`crm-dash__panel ${dark ? 'crm-dash__panel--dark' : ''} ${className}`}>
    <div className="crm-dash__panel-head">
      <div className="flex items-center gap-2.5">
        <span className="crm-dash__panel-accent" />
        <h3 className="crm-dash__panel-title">{title}</h3>
      </div>
      {action}
    </div>
    <div className="crm-dash__panel-body">{children}</div>
  </div>
);

const SPARK_COLORS = {
  blue: '#3478F6',
  green: '#20C997',
  purple: '#9855F7',
  indigo: '#625BEE',
  teal: '#08AFA8',
  cyan: '#08AFA8',
  pink: '#FF4778',
  orange: '#FFA640',
  gold: '#F59E0B',
};

const IconChip = ({ icon: Icon, tone = 'blue', size = 'md' }) => {
  const iconPx = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-[18px] h-[18px]' : 'w-[19px] h-[19px]';
  return (
    <div className={`crm-icon-tile crm-icon-tile--${size} crm-icon-tile--${tone}`}>
      <Icon className={iconPx} strokeWidth={2.2} />
    </div>
  );
};

const MiniSpark = ({ data = [], color = '#3478F6', height = 42, formatValue }) => {
  const seriesData = data.length ? data : [0, 0];
  return (
    <ReactApexChart
      type="area"
      height={height}
      width="100%"
      series={[{ name: 'Trend', data: seriesData }]}
      options={{
        chart: {
          sparkline: { enabled: true },
          toolbar: { show: false },
          animations: { enabled: true, speed: 400 },
          background: 'transparent',
        },
        stroke: { curve: 'smooth', width: 2 },
        colors: [color],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.35,
            opacityTo: 0.02,
            stops: [0, 90, 100],
          },
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          y: { formatter: (v) => (formatValue ? formatValue(v) : v) },
        },
        grid: { show: false, padding: { left: 0, right: 0, top: 2, bottom: 0 } },
        yaxis: { min: 0, show: false },
        xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
      }}
    />
  );
};

const KpiTile = ({ label, value, change, icon: Icon, tone = 'blue', sparkline, formatSpark }) => (
  <div className="crm-dash__metric crm-dash__metric--lift crm-dash__kpi-spark">
    <div className="crm-dash__kpi-spark-top">
      {Icon && <IconChip icon={Icon} tone={tone} size="lg" />}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="crm-dash__label truncate">{label}</p>
        <p className="crm-dash__value text-xl leading-tight truncate mt-0.5">{value}</p>
      </div>
    </div>
    <div className="crm-dash__kpi-spark-bottom">
      <ChangeBadge value={change} />
      <div className="crm-dash__kpi-spark-chart">
        <MiniSpark
          data={sparkline}
          color={SPARK_COLORS[tone] || SPARK_COLORS.blue}
          formatValue={formatSpark}
        />
      </div>
    </div>
  </div>
);

const RevenueHeroKpi = ({ value, change, sparkline = [] }) => (
  <div className="crm-dash__revenue-hero h-full">
    <div className="crm-dash__revenue-hero-main">
      <IconChip icon={IndianRupee} tone="gold" size="lg" />
      <div className="min-w-0 pt-0.5">
        <p className="crm-dash__label truncate">Total Revenue</p>
        <p className="crm-dash__value text-2xl leading-tight truncate mt-1">{value}</p>
        <ChangeBadge value={change} />
      </div>
    </div>
    <div className="crm-dash__revenue-hero-chart">
      <MiniSpark data={sparkline} color="#D97706" height={72} formatValue={inr} />
    </div>
  </div>
);

const Empty = ({ label = 'No data in period', light = false }) => (
  <div
    className={`h-full min-h-[180px] flex items-center justify-center text-sm ${
      light ? 'text-slate-400/80' : 'text-[color:var(--dash-text-muted)]'
    }`}
  >
    {label}
  </div>
);

const AuroraBackdrop = () => (
  <div className="crm-dash__aurora" aria-hidden="true">
    <div className="crm-dash__aurora-glow" />
    <svg className="crm-dash__aurora-svg" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" fill="none">
      <path
        d="M-40 340 C180 220 320 420 560 300 C780 190 960 360 1180 250 C1320 180 1420 220 1520 180"
        stroke="rgba(52,120,246,0.14)"
        strokeWidth="48"
        strokeLinecap="round"
      />
      <path
        d="M-60 280 C200 160 380 360 620 240 C860 130 1040 310 1280 200 C1400 150 1500 170 1560 140"
        stroke="rgba(152,85,247,0.1)"
        strokeWidth="56"
        strokeLinecap="round"
      />
      <path
        d="M-20 400 C240 300 420 460 680 340 C920 240 1100 400 1380 300"
        stroke="rgba(8,175,168,0.1)"
        strokeWidth="40"
        strokeLinecap="round"
      />
      <path
        d="M80 120 C280 60 480 180 720 90 C980 0 1180 130 1460 50"
        stroke="rgba(100,165,255,0.12)"
        strokeWidth="32"
        strokeLinecap="round"
      />
    </svg>
    <div className="crm-dash__aurora-fade" />
  </div>
);

const baseChart = {
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: true, speed: 500, animateGradually: { enabled: true } },
    background: 'transparent',
    dropShadow: { enabled: false },
    parentHeightOffset: 0,
    redrawOnParentResize: true,
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#E2ECF8',
    strokeDashArray: 4,
    padding: { left: 8, right: 8, top: 4, bottom: 0 },
  },
  legend: {
    fontSize: '12px',
    fontWeight: 500,
    markers: { width: 10, height: 10, radius: 10 },
    itemMargin: { horizontal: 10, vertical: 2 },
    labels: { colors: '#7186A8' },
  },
  tooltip: {
    theme: 'light',
    style: { fontSize: '12px' },
  },
};

const donutOptions = (labels, colors, valueFormatter) => ({
  ...baseChart,
  labels,
  colors: colors?.length ? colors : CHART_PALETTE,
  stroke: { width: 2, colors: ['#fff'] },
  dataLabels: { enabled: false },
  legend: { show: false },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          name: { show: true, fontSize: '12px', color: '#7186A8', offsetY: -4 },
          value: {
            show: true,
            fontSize: '18px',
            fontWeight: 700,
            color: BRAND,
            offsetY: 4,
            formatter: (v) => (valueFormatter ? valueFormatter(Number(v)) : v),
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '12px',
            fontWeight: 600,
            color: '#7186A8',
            formatter: (w) => {
              const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              return valueFormatter ? valueFormatter(sum) : sum;
            },
          },
        },
      },
    },
  },
  tooltip: {
    ...baseChart.tooltip,
    y: {
      formatter: (v) => (valueFormatter ? valueFormatter(v) : v),
    },
  },
});

const DonutWithLegend = ({ series, labels, colors, height = 260, valueFormatter, legendSide = 'right' }) => {
  if (!series?.length) return <Empty />;
  const palette = colors?.length ? colors : CHART_PALETTE;
  const legend = (
    <div className="shrink-0 flex flex-col justify-center gap-2 min-w-[110px] max-w-[150px]">
      {labels.map((label, i) => (
        <div key={`${label}-${i}`} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: palette[i % palette.length] }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[color:var(--dash-text-muted)] truncate leading-tight">{label}</p>
            <p className="text-sm font-bold text-[color:var(--dash-text)] leading-tight">
              {valueFormatter ? valueFormatter(series[i]) : series[i]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`flex items-center gap-2 overflow-hidden ${legendSide === 'left' ? 'flex-row-reverse' : ''}`}>
      <div className="flex-1 min-w-0 overflow-hidden">
        <ReactApexChart
          type="donut"
          height={height}
          series={series}
          options={donutOptions(labels, colors, valueFormatter)}
        />
      </div>
      {legend}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [range, setRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const useCustom = Boolean(dateFrom && dateTo);

  const displayName = useMemo(() => {
    const first = (user?.first_name || '').trim();
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    const uname = (user?.username || '').trim();
    return uname ? uname.charAt(0).toUpperCase() + uname.slice(1) : 'there';
  }, [user]);

  const subMessage = useMemo(() => {
    const h = new Date().getHours();
    const hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const lines = [
      `${hello}, ${displayName} — here's what's happening with your business today.`,
      `${hello}, ${displayName} — track performance, orders and growth in real time.`,
      `${hello}, ${displayName} — your revenue, pipeline and team pulse at a glance.`,
    ];
    const day = Math.floor(Date.now() / 86_400_000);
    return lines[(day + displayName.length) % lines.length];
  }, [displayName]);

  const { data, isLoading, isFetching, refetch, isError, error } = useQuery({
    queryKey: ['dashboard', range, dateFrom, dateTo],
    queryFn: () => {
      const params = useCustom
        ? { date_from: dateFrom, date_to: dateTo }
        : { range };
      return axios.get('api/dashboard/', { params }).then((res) => res.data);
    },
    staleTime: 60_000,
  });

  const k = data?.kpis || {};
  const ch = data?.kpi_changes || {};
  const period = data?.period;

  const orderStatusSeries = useMemo(() => {
    const rows = data?.order_status || [];
    return {
      labels: rows.map((r) => r.status),
      series: rows.map((r) => r.count),
      colors: rows.map((r, i) => STATUS_COLORS[r.status] || CHART_PALETTE[i % CHART_PALETTE.length]),
    };
  }, [data?.order_status]);

  const paymentSeries = useMemo(() => {
    const rows = data?.payment_status || [];
    return {
      labels: rows.map((r) => r.status),
      series: rows.map((r) => r.amount),
      colors: rows.map((r, i) => STATUS_COLORS[r.status] || CHART_PALETTE[i % CHART_PALETTE.length]),
    };
  }, [data?.payment_status]);

  const contactSeries = useMemo(() => {
    const rows = data?.contact_types || [];
    return {
      labels: rows.map((r) => r.type),
      series: rows.map((r) => r.count),
      colors: rows.map((r, i) => STATUS_COLORS[r.type] || CHART_PALETTE[i % CHART_PALETTE.length]),
    };
  }, [data?.contact_types]);

  const callStatusSeries = useMemo(() => {
    const rows = data?.call_status || [];
    return {
      labels: rows.map((r) => r.status),
      series: rows.map((r) => r.count),
      colors: rows.map((r, i) => STATUS_COLORS[r.status] || CHART_PALETTE[i % CHART_PALETTE.length]),
    };
  }, [data?.call_status]);

  const leadSeries = useMemo(() => {
    const rows = data?.lead_pipeline || [];
    return {
      labels: rows.map((r) => r.status),
      series: rows.map((r) => r.count),
      colors: rows.map((r, i) => STATUS_COLORS[r.status] || CHART_PALETTE[i % CHART_PALETTE.length]),
    };
  }, [data?.lead_pipeline]);

  const monthly = data?.monthly_trends || [];
  const daily = data?.daily_trends || [];
  const statusTrend = data?.order_status_trends || {};
  const statusKeys = useMemo(() => {
    const keys = new Set();
    Object.values(statusTrend).forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== 'label') keys.add(key);
      });
    });
    return Array.from(keys);
  }, [statusTrend]);

  const ranges = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '180d', label: '6M' },
    { key: '365d', label: '1Y' },
    { key: 'all', label: 'All' },
  ];

  if (isLoading) {
    return (
      <div className="crm-dash flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#3478F6] border-t-transparent" />
          <p className="text-sm font-medium text-[color:var(--dash-text-muted)]">Loading intelligence…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="crm-dash p-6 text-sm text-[color:var(--dash-negative)]">
        Failed to load dashboard: {error?.message || 'Unknown error'}
        <button type="button" onClick={() => refetch()} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="crm-dash">
      <AuroraBackdrop />

      <div className="crm-dash__content">
        {/* Header */}
        <div className="crm-dash__header">
          <div className="min-w-0 flex items-center gap-3">
            <div className="crm-dash__brand-icon">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="crm-dash__title">
                Psquare Business Intelligence
              </h1>
              <p className="crm-dash__subtitle truncate">
                {subMessage}
                {isFetching && <span className="ml-1.5 text-[color:var(--dash-blue)]">Refreshing…</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="crm-dash__range">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRange(r.key);
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className={`crm-dash__range-btn ${!useCustom && range === r.key ? 'is-active' : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="crm-dash__control"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="crm-dash__control"
            />
            <button type="button" onClick={() => refetch()} className="crm-dash__icon-btn" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-hidden">
        {/* Row 1 — revenue hero + remaining financial KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-12 gap-3">
          <div className="col-span-2 md:col-span-4 xl:col-span-4">
            <RevenueHeroKpi
              value={inrShort(k.revenue)}
              change={ch.revenue}
              sparkline={monthly.map((m) => m.revenue)}
            />
          </div>
          <div className="xl:col-span-2">
            <KpiTile
              label="Collected"
              value={inrShort(k.collected)}
              change={ch.collected}
              icon={Wallet}
              tone="green"
              sparkline={monthly.map((m) => m.collected)}
              formatSpark={inr}
            />
          </div>
          <div className="xl:col-span-2">
            <KpiTile
              label="Outstanding"
              value={inrShort(k.outstanding)}
              icon={AlertTriangle}
              tone="purple"
              sparkline={monthly.map((m) => Math.max(0, (m.revenue || 0) - (m.collected || 0)))}
              formatSpark={inr}
            />
          </div>
          <div className="xl:col-span-2">
            <KpiTile
              label="Orders"
              value={(k.orders || 0).toLocaleString()}
              change={ch.orders}
              icon={ShoppingCart}
              tone="indigo"
              sparkline={daily.map((d) => d.orders || 0)}
            />
          </div>
          <div className="xl:col-span-2">
            <KpiTile
              label="Avg Order"
              value={inrShort(k.aov)}
              icon={TrendingUp}
              tone="teal"
              sparkline={daily.map((d) =>
                d.orders ? Math.round((d.revenue || 0) / d.orders) : 0
              )}
              formatSpark={inr}
            />
          </div>
        </div>

        {/* Row 2 — snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Delivered', value: k.delivered_orders, icon: CheckCircle2, tone: 'blue' },
            { label: 'In pipeline', value: k.pipeline_orders, icon: Clock3, tone: 'purple' },
            { label: 'Cancelled', value: k.cancelled_orders, icon: XCircle, tone: 'pink' },
            { label: 'Gross profit', value: inrShort(k.gross_profit), icon: IndianRupee, tone: 'green' },
            { label: 'Products', value: k.products, icon: Package, tone: 'blue' },
            { label: 'Users', value: k.users, icon: Users, tone: 'purple' },
            { label: 'Calls done', value: k.calls_completed, icon: PhoneCall, tone: 'teal' },
            { label: 'Calls→Order', value: k.calls_converted, icon: ArrowRightLeft, tone: 'orange' },
          ].map((m) => (
            <div key={m.label} className="crm-dash__metric px-4 py-3.5 flex items-center gap-3">
              <IconChip icon={m.icon} tone={m.tone} size="md" />
              <div className="min-w-0">
                <p className="crm-dash__label truncate">{m.label}</p>
                <p className="crm-dash__value text-lg mt-0.5 truncate">{m.value ?? 0}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3 — today + customer/call summary (+ Gross Margin) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Orders today', value: k.orders_today, icon: ShoppingCart, to: '/orders', tone: 'blue' },
            { label: 'Calls today', value: k.calls_today, icon: Phone, to: '/calllogs', tone: 'teal' },
            { label: 'Appointments today', value: k.appointments_today, icon: Calendar, to: '/customers', tone: 'purple' },
            { label: 'Gross Margin', value: `${k.gross_margin ?? 0}%`, icon: BadgePercent, tone: 'pink', static: true },
            { label: 'Customers', value: k.customers_total, icon: Users, to: '/customers', tone: 'indigo' },
            { label: 'New Customers', value: k.customers_new, icon: BarChart3, to: '/customers', change: ch.customers_new, tone: 'green' },
            { label: 'Leads', value: k.leads_contacts, icon: ClipboardList, to: '/leads', tone: 'blue' },
            { label: 'Calls', value: k.calls, icon: Phone, to: '/calllogs', change: ch.calls, tone: 'teal' },
          ].map((item) => {
            const body = (
              <>
                <IconChip icon={item.icon} tone={item.tone} size="sm" />
                <div className="min-w-0">
                  <p className="text-[11px] text-[color:var(--dash-text-muted)] truncate">{item.label}</p>
                  <p className="crm-dash__value text-lg leading-tight">{item.value ?? 0}</p>
                  {item.change !== undefined && <ChangeBadge value={item.change} />}
                </div>
              </>
            );
            if (item.static) {
              return (
                <div key={item.label} className="crm-dash__metric px-3.5 py-3 flex items-center gap-3">
                  {body}
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className="crm-dash__metric crm-dash__metric--lift px-3.5 py-3 flex items-center gap-3"
              >
                {body}
              </Link>
            );
          })}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Panel title="Revenue & Collections" className="lg:col-span-5" dark>
            {monthly.length ? (
              <ReactApexChart
                type="area"
                height={260}
                series={[
                  { name: 'Revenue', data: monthly.map((m) => m.revenue) },
                  { name: 'Collected', data: monthly.map((m) => m.collected) },
                ]}
                options={{
                  ...baseChart,
                  colors: ['#64A5FF', '#50D8D0'],
                  stroke: { curve: 'smooth', width: 3 },
                  fill: {
                    type: 'gradient',
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.5,
                      opacityTo: 0.05,
                      stops: [0, 90, 100],
                    },
                  },
                  markers: { size: 4, strokeWidth: 2, strokeColors: '#14264A', hover: { size: 6 } },
                  grid: { ...baseChart.grid, borderColor: 'rgba(226,236,248,0.12)' },
                  legend: { ...baseChart.legend, labels: { colors: '#A8B8D4' } },
                  xaxis: {
                    categories: monthly.map((m) => m.label),
                    labels: { style: { fontSize: '11px', colors: '#A8B8D4' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: {
                    labels: {
                      style: { fontSize: '11px', colors: '#A8B8D4' },
                      formatter: (v) => inrShort(v),
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    enabledOnSeries: [0],
                    formatter: (v) => inrShort(v),
                    style: { fontSize: '10px', fontWeight: 600, colors: ['#E8F0FF'] },
                    background: { enabled: false },
                    offsetY: -6,
                  },
                  tooltip: {
                    theme: 'dark',
                    style: { fontSize: '12px' },
                    y: { formatter: (v) => inr(v) },
                  },
                }}
              />
            ) : (
              <Empty light />
            )}
          </Panel>

          <Panel title="Daily Orders (30d max)" className="lg:col-span-4">
            {daily.some((d) => d.orders || d.revenue) ? (
              <ReactApexChart
                type="bar"
                height={260}
                series={[{ name: 'Orders', data: daily.map((d) => d.orders) }]}
                options={{
                  ...baseChart,
                  colors: [ACCENT],
                  plotOptions: {
                    bar: {
                      columnWidth: '58%',
                      borderRadius: 6,
                      borderRadiusApplication: 'end',
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (v) => (v ? v : ''),
                    style: { fontSize: '9px', fontWeight: 600, colors: [BRAND] },
                    offsetY: -4,
                  },
                  xaxis: {
                    categories: daily.map((d) => d.label),
                    labels: {
                      style: { fontSize: '10px', colors: '#7186A8' },
                      rotate: -45,
                      hideOverlappingLabels: true,
                    },
                    tickAmount: 8,
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#7186A8' } } },
                }}
              />
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Order Status Mix" className="lg:col-span-3">
            <DonutWithLegend
              series={orderStatusSeries.series}
              labels={orderStatusSeries.labels}
              colors={orderStatusSeries.colors}
              height={250}
            />
          </Panel>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Panel title="Order Funnel Over Time" className="lg:col-span-5">
            {Object.keys(statusTrend).length && statusKeys.length ? (
              <ReactApexChart
                type="bar"
                height={270}
                series={statusKeys.map((status) => ({
                  name: status,
                  data: Object.keys(statusTrend)
                    .sort()
                    .map((m) => statusTrend[m][status] || 0),
                }))}
                options={{
                  ...baseChart,
                  chart: { ...baseChart.chart, stacked: true },
                  colors: statusKeys.map(
                    (s, i) => STATUS_COLORS[s] || CHART_PALETTE[i % CHART_PALETTE.length]
                  ),
                  plotOptions: {
                    bar: { columnWidth: '62%', borderRadius: 4, borderRadiusApplication: 'end' },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (v) => (v ? v : ''),
                    style: { fontSize: '9px', fontWeight: 600, colors: ['#fff'] },
                  },
                  xaxis: {
                    categories: Object.keys(statusTrend)
                      .sort()
                      .map((m) => statusTrend[m].label || m),
                    labels: { style: { fontSize: '11px', colors: '#7186A8' } },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#7186A8' } } },
                  legend: { ...baseChart.legend, position: 'top' },
                }}
              />
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Payment Mix (₹)" className="lg:col-span-3">
            <DonutWithLegend
              series={paymentSeries.series}
              labels={paymentSeries.labels}
              colors={paymentSeries.colors}
              height={250}
              valueFormatter={inrShort}
            />
          </Panel>

          <Panel title="Contacts: Customer vs Lead" className="lg:col-span-2">
            <DonutWithLegend
              series={contactSeries.series}
              labels={contactSeries.labels}
              colors={contactSeries.colors}
              height={250}
            />
          </Panel>

          <Panel title="Call Status" className="lg:col-span-2">
            <DonutWithLegend
              series={callStatusSeries.series}
              labels={callStatusSeries.labels}
              colors={callStatusSeries.colors}
              height={250}
            />
          </Panel>
        </div>

        {/* Tables / rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Panel
            title="Top Products"
            action={
              <Link to="/products" className="crm-dash__link">
                View all
              </Link>
            }
          >
            {(data?.top_products || []).length ? (
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="text-[color:var(--dash-text-muted)]">
                    <tr>
                      <th className="text-left font-semibold py-2">Product</th>
                      <th className="text-right font-semibold">Qty</th>
                      <th className="text-right font-semibold">Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((p, idx) => (
                      <tr key={p.id} className="border-t border-[color:var(--dash-border)] hover:bg-[#F8FBFF]">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="crm-dash__rank">{idx + 1}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[color:var(--dash-text)] truncate max-w-[140px]">
                                {p.title}
                              </p>
                              <p className="text-[color:var(--dash-text-muted)] text-[11px]">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right tabular-nums font-medium">{p.qty}</td>
                        <td className="text-right tabular-nums font-bold text-[color:var(--dash-text)]">
                          {inrShort(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Top Agents">
            {(data?.top_agents || []).length ? (
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="text-[color:var(--dash-text-muted)]">
                    <tr>
                      <th className="text-left font-semibold py-2">Agent</th>
                      <th className="text-right font-semibold">Ord</th>
                      <th className="text-right font-semibold">Calls</th>
                      <th className="text-right font-semibold">Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_agents.map((a, idx) => (
                      <tr key={a.id} className="border-t border-[color:var(--dash-border)] hover:bg-[#F8FBFF]">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="crm-dash__rank crm-dash__rank--round">{idx + 1}</span>
                            <span className="font-semibold truncate max-w-[100px] text-[color:var(--dash-text)]">
                              {a.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{a.orders}</td>
                        <td className="text-right tabular-nums">{a.calls}</td>
                        <td className="text-right tabular-nums font-bold text-[color:var(--dash-text)]">
                          {inrShort(a.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Top States">
            {(data?.top_states || []).length ? (
              <ReactApexChart
                type="bar"
                height={270}
                series={[
                  {
                    name: 'Revenue',
                    data: data.top_states.map((s) => s.revenue),
                  },
                ]}
                options={{
                  ...baseChart,
                  colors: [ACCENT],
                  plotOptions: {
                    bar: { horizontal: true, barHeight: '68%', borderRadius: 6 },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (v) => inrShort(v),
                    style: { fontSize: '10px', fontWeight: 700, colors: ['#fff'] },
                    offsetX: 0,
                  },
                  xaxis: {
                    categories: data.top_states.map((s) => s.state),
                    labels: {
                      style: { fontSize: '11px', colors: '#7186A8' },
                      formatter: (v) => inrShort(v),
                    },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#7186A8' } } },
                  tooltip: { ...baseChart.tooltip, y: { formatter: (v) => inr(v) } },
                }}
              />
            ) : (
              <Empty label="No geo data" />
            )}
          </Panel>

          <Panel
            title="Low Stock (≤10)"
            action={
              <Link to="/products" className="crm-dash__link" style={{ color: 'var(--dash-negative)' }}>
                Manage
              </Link>
            }
          >
            {(data?.low_stock || []).length ? (
              <div className="overflow-hidden space-y-2">
                {data.low_stock.map((p) => (
                  <div key={p.id} className="crm-dash__stock">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-[color:var(--dash-text)]">{p.title}</p>
                      <p className="text-[11px] text-[color:var(--dash-text-muted)]">{p.sku}</p>
                    </div>
                    <span className="crm-dash__stock-qty">{p.stock_qty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty label="No low-stock items" />
            )}
          </Panel>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Panel
            title="Recent Orders"
            className="lg:col-span-5"
            action={
              <Link to="/orders" className="crm-dash__link">
                All orders
              </Link>
            }
          >
            {(data?.recent_orders || []).length ? (
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="text-[color:var(--dash-text-muted)]">
                    <tr>
                      <th className="text-left font-semibold py-2">Order</th>
                      <th className="text-left font-semibold">Customer</th>
                      <th className="text-right font-semibold">Amount</th>
                      <th className="text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((o) => (
                      <tr key={o.id} className="border-t border-[color:var(--dash-border)] hover:bg-[#F8FBFF]">
                        <td className="py-2.5">
                          <Link
                            to={`/orders/${o.id}`}
                            className="font-bold text-[color:var(--dash-text)] hover:text-[color:var(--dash-blue)]"
                          >
                            {o.order_id}
                          </Link>
                          <p className="text-[color:var(--dash-text-muted)] text-[11px]">{o.order_date || '—'}</p>
                        </td>
                        <td className="truncate max-w-[140px] font-medium text-[color:var(--dash-text)]">
                          {o.customer_name || '—'}
                        </td>
                        <td className="text-right tabular-nums font-bold text-[color:var(--dash-text)]">
                          {inrShort(o.total_amount)}
                        </td>
                        <td className="text-right">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: `${STATUS_COLORS[o.status] || '#7186A8'}18`,
                              color: STATUS_COLORS[o.status] || '#7186A8',
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Lead Pipeline" className="lg:col-span-3">
            {leadSeries.series.some((n) => n > 0) ? (
              <ReactApexChart
                type="bar"
                height={280}
                series={[{ name: 'Leads', data: leadSeries.series }]}
                options={{
                  ...baseChart,
                  colors: leadSeries.colors,
                  plotOptions: {
                    bar: {
                      distributed: true,
                      borderRadius: 8,
                      columnWidth: '55%',
                      borderRadiusApplication: 'end',
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
                  },
                  xaxis: {
                    categories: leadSeries.labels,
                    labels: { style: { fontSize: '11px', colors: '#7186A8' } },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#7186A8' } } },
                  legend: { show: false },
                }}
              />
            ) : (
              <Empty label="No lead records" />
            )}
          </Panel>

          <Panel title="Call Outcomes" className="lg:col-span-4">
            {(data?.call_outcomes || []).length ? (
              <ReactApexChart
                type="bar"
                height={280}
                series={[
                  {
                    name: 'Calls',
                    data: data.call_outcomes.map((o) => o.count),
                  },
                ]}
                options={{
                  ...baseChart,
                  colors: [ACCENT_TEAL],
                  plotOptions: {
                    bar: { horizontal: true, barHeight: '62%', borderRadius: 8 },
                  },
                  dataLabels: {
                    enabled: true,
                    style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
                  },
                  xaxis: {
                    categories: data.call_outcomes.map((o) => o.name),
                    labels: { style: { fontSize: '11px', colors: '#7186A8' } },
                  },
                  yaxis: {
                    labels: { style: { fontSize: '11px', colors: '#7186A8' }, maxWidth: 140 },
                  },
                }}
              />
            ) : (
              <Empty label="No tagged outcomes" />
            )}
          </Panel>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
