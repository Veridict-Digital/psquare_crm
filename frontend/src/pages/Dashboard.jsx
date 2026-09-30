import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import ReactApexChart from 'react-apexcharts';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Phone,
  Package,
  DollarSign,
  Wallet,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Minus,
  LayoutDashboard,
} from 'lucide-react';

const BRAND = '#0f172a';
const BRAND_SOFT = '#1e293b';
const ACCENT = '#2563eb';

const CHART_PALETTE = [
  '#0f172a',
  '#1e3a8a',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#1d4ed8',
  '#172554',
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
  ordered: '#64748b',
  Preparing: '#f59e0b',
  Placed: '#2563eb',
  Dispatched: '#1d4ed8',
  Delivered: '#0f766e',
  Cancelled: '#e11d48',
  Paid: '#0f766e',
  Partial: '#f59e0b',
  Credit: '#e11d48',
  Advance: '#0284c7',
  'Advance Payment Received': '#0369a1',
  COD: '#ea580c',
  Pending: '#f59e0b',
  'In Progress': '#2563eb',
  Completed: '#0f766e',
  'Follow-up': '#1d4ed8',
  Customer: '#0f172a',
  Lead: '#2563eb',
  New: '#64748b',
  Contacted: '#2563eb',
  Qualified: '#1d4ed8',
  Converted: '#0f766e',
  Lost: '#e11d48',
};

const ChangeBadge = ({ value }) => {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
        <Minus className="w-3.5 h-3.5" /> vs prior
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {up ? '+' : ''}
      {value}% vs prior
    </span>
  );
};

const Panel = ({ title, action, children, className = '' }) => (
  <div
    className={`bg-white/95 backdrop-blur border border-slate-200/80 rounded-2xl flex flex-col min-h-0 shadow-[0_8px_30px_rgb(15,23,42,0.06)] hover:shadow-[0_12px_36px_rgb(15,23,42,0.1)] transition-shadow duration-300 ${className}`}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-slate-900 to-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-4 flex-1 min-h-0">{children}</div>
  </div>
);

const KpiTile = ({ label, value, change, icon: Icon }) => (
  <div className="group relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl px-4 py-4 flex items-start gap-3.5 min-w-0 shadow-[0_8px_24px_rgb(15,23,42,0.05)] hover:shadow-[0_14px_32px_rgb(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-500 opacity-90" />
    <div className="p-3 rounded-2xl bg-slate-900 text-white shrink-0 shadow-lg shadow-slate-900/25 group-hover:scale-105 transition-transform duration-300">
      <Icon className="w-5 h-5" strokeWidth={2.2} />
    </div>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium truncate">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 leading-tight truncate mt-1">{value}</p>
      <ChangeBadge value={change} />
    </div>
  </div>
);

const Empty = ({ label = 'No data in period' }) => (
  <div className="h-full min-h-[180px] flex items-center justify-center text-sm text-slate-400">
    {label}
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
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
    padding: { left: 8, right: 8, top: 4, bottom: 0 },
  },
  legend: {
    fontSize: '12px',
    fontWeight: 500,
    markers: { width: 10, height: 10, radius: 10 },
    itemMargin: { horizontal: 10, vertical: 2 },
    labels: { colors: '#475569' },
  },
  tooltip: {
    theme: 'dark',
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
          name: { show: true, fontSize: '12px', color: '#64748b', offsetY: -4 },
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
            color: '#64748b',
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
            <p className="text-[11px] text-slate-500 truncate leading-tight">{label}</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {valueFormatter ? valueFormatter(series[i]) : series[i]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`flex items-center gap-2 ${legendSide === 'left' ? 'flex-row-reverse' : ''}`}>
      <div className="flex-1 min-w-0">
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
  const [range, setRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const useCustom = Boolean(dateFrom && dateTo);

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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e2e8f0_0%,_#f1f5f9_45%,_#eef2ff_100%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-900 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading intelligence…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-rose-600">
        Failed to load dashboard: {error?.message || 'Unknown error'}
        <button type="button" onClick={() => refetch()} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f1f5f9_40%,_#e2e8f0_100%)] text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white px-4 py-3.5 flex flex-wrap items-center gap-3 justify-between shadow-xl shadow-slate-900/20">
        <div className="min-w-0 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur">
            <LayoutDashboard className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">CRM 360° Intelligence</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {period?.from} → {period?.to}
              <span className="mx-1.5 text-slate-600">·</span>
              {period?.days}d window · live database
              {isFetching && <span className="ml-1.5 text-blue-300">Refreshing…</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setRange(r.key);
                  setDateFrom('');
                  setDateTo('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  !useCustom && range === r.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Snapshot strip — top */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Delivered', value: k.delivered_orders },
            { label: 'In pipeline', value: k.pipeline_orders },
            { label: 'Cancelled', value: k.cancelled_orders },
            { label: 'Gross profit', value: inrShort(k.gross_profit) },
            { label: 'Products', value: k.products },
            { label: 'Users', value: k.users },
            { label: 'Calls done', value: k.calls_completed },
            { label: 'Calls→Order', value: k.calls_converted },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-gradient-to-br from-slate-950 to-slate-800 text-slate-100 rounded-2xl px-4 py-3.5 text-center shadow-lg shadow-slate-900/15 border border-white/5"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                {m.label}
              </p>
              <p className="text-lg font-bold mt-1.5 text-white">{m.value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Today strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Orders today', value: k.orders_today, icon: ShoppingCart, to: '/orders' },
            { label: 'Calls today', value: k.calls_today, icon: Phone, to: '/calllogs' },
            { label: 'Appointments today', value: k.appointments_today, icon: Calendar, to: '/customers' },
            { label: 'Follow-ups (7d)', value: k.followups_due, icon: AlertTriangle, to: '/orders' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white/90 border border-slate-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300"
            >
              <div className="p-2.5 rounded-2xl bg-slate-900 text-white shrink-0 shadow-md shadow-slate-900/20">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{item.label}</p>
                <p className="text-xl font-bold leading-tight text-slate-900">{item.value ?? 0}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiTile label="Revenue" value={inrShort(k.revenue)} change={ch.revenue} icon={DollarSign} />
          <KpiTile label="Collected" value={inrShort(k.collected)} change={ch.collected} icon={Wallet} />
          <KpiTile label="Outstanding" value={inrShort(k.outstanding)} icon={AlertTriangle} />
          <KpiTile label="Orders" value={(k.orders || 0).toLocaleString()} change={ch.orders} icon={ShoppingCart} />
          <KpiTile label="Avg Order" value={inrShort(k.aov)} icon={TrendingUp} />
          <KpiTile label="Gross Margin" value={`${k.gross_margin ?? 0}%`} icon={Package} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Customers', value: k.customers_total },
            { label: 'New', value: k.customers_new, change: ch.customers_new },
            { label: 'Active', value: k.customers_active },
            { label: 'VIP (≥50k)', value: k.customers_vip },
            { label: 'Leads', value: k.leads_contacts },
            { label: 'Calls', value: k.calls, change: ch.calls },
            { label: 'Call Conv.', value: `${k.call_conversion_rate ?? 0}%` },
            { label: 'Collection', value: `${k.collection_rate ?? 0}%` },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-white/90 border border-slate-200/80 rounded-2xl px-3 py-3 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{m.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{m.value ?? 0}</p>
              {m.change !== undefined && <ChangeBadge value={m.change} />}
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Panel title="Revenue & Collections" className="lg:col-span-5">
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
                  colors: [BRAND, ACCENT],
                  stroke: { curve: 'smooth', width: 3 },
                  fill: {
                    type: 'gradient',
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.45,
                      opacityTo: 0.05,
                      stops: [0, 90, 100],
                    },
                  },
                  markers: { size: 4, strokeWidth: 2, hover: { size: 6 } },
                  xaxis: {
                    categories: monthly.map((m) => m.label),
                    labels: { style: { fontSize: '11px', colors: '#64748b' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: {
                    labels: {
                      style: { fontSize: '11px', colors: '#64748b' },
                      formatter: (v) => inrShort(v),
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    enabledOnSeries: [0],
                    formatter: (v) => inrShort(v),
                    style: { fontSize: '10px', fontWeight: 600, colors: [BRAND] },
                    background: { enabled: false },
                    offsetY: -6,
                  },
                  tooltip: {
                    ...baseChart.tooltip,
                    y: { formatter: (v) => inr(v) },
                  },
                }}
              />
            ) : (
              <Empty />
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
                      style: { fontSize: '10px', colors: '#64748b' },
                      rotate: -45,
                      hideOverlappingLabels: true,
                    },
                    tickAmount: 8,
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
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
                    labels: { style: { fontSize: '11px', colors: '#64748b' } },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
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
              <Link to="/products" className="text-xs font-medium text-blue-700 hover:underline">
                View all
              </Link>
            }
          >
            {(data?.top_products || []).length ? (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="text-slate-500 sticky top-0 bg-white">
                    <tr>
                      <th className="text-left font-semibold py-2">Product</th>
                      <th className="text-right font-semibold">Qty</th>
                      <th className="text-right font-semibold">Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((p, idx) => (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                                {p.title}
                              </p>
                              <p className="text-slate-400 text-[11px]">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right tabular-nums font-medium">{p.qty}</td>
                        <td className="text-right tabular-nums font-bold text-slate-900">
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
              <div className="overflow-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="text-slate-500 sticky top-0 bg-white">
                    <tr>
                      <th className="text-left font-semibold py-2">Agent</th>
                      <th className="text-right font-semibold">Ord</th>
                      <th className="text-right font-semibold">Calls</th>
                      <th className="text-right font-semibold">Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_agents.map((a, idx) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold truncate max-w-[100px]">{a.name}</span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{a.orders}</td>
                        <td className="text-right tabular-nums">{a.calls}</td>
                        <td className="text-right tabular-nums font-bold text-slate-900">
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
                  colors: [BRAND],
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
                      style: { fontSize: '11px', colors: '#64748b' },
                      formatter: (v) => inrShort(v),
                    },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
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
              <Link to="/products" className="text-xs font-medium text-rose-600 hover:underline">
                Manage
              </Link>
            }
          >
            {(data?.low_stock || []).length ? (
              <div className="overflow-auto max-h-72 space-y-2">
                {data.low_stock.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-white border border-rose-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-slate-800">{p.title}</p>
                      <p className="text-[11px] text-slate-400">{p.sku}</p>
                    </div>
                    <span className="min-w-[2rem] text-center text-sm font-bold text-white bg-slate-900 rounded-xl px-2 py-1 tabular-nums">
                      {p.stock_qty}
                    </span>
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
              <Link to="/orders" className="text-xs font-medium text-blue-700 hover:underline">
                All orders
              </Link>
            }
          >
            {(data?.recent_orders || []).length ? (
              <div className="overflow-auto max-h-80">
                <table className="w-full text-xs">
                  <thead className="text-slate-500 sticky top-0 bg-white">
                    <tr>
                      <th className="text-left font-semibold py-2">Order</th>
                      <th className="text-left font-semibold">Customer</th>
                      <th className="text-right font-semibold">Amount</th>
                      <th className="text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="py-2.5">
                          <Link
                            to={`/orders/${o.id}`}
                            className="font-bold text-slate-900 hover:text-blue-700"
                          >
                            {o.order_id}
                          </Link>
                          <p className="text-slate-400 text-[11px]">{o.order_date || '—'}</p>
                        </td>
                        <td className="truncate max-w-[140px] font-medium">{o.customer_name || '—'}</td>
                        <td className="text-right tabular-nums font-bold">
                          {inrShort(o.total_amount)}
                        </td>
                        <td className="text-right">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: `${STATUS_COLORS[o.status] || '#94a3b8'}18`,
                              color: STATUS_COLORS[o.status] || '#475569',
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
                    labels: { style: { fontSize: '11px', colors: '#64748b' } },
                  },
                  yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
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
                  colors: [BRAND_SOFT],
                  plotOptions: {
                    bar: { horizontal: true, barHeight: '62%', borderRadius: 8 },
                  },
                  dataLabels: {
                    enabled: true,
                    style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
                  },
                  xaxis: {
                    categories: data.call_outcomes.map((o) => o.name),
                    labels: { style: { fontSize: '11px', colors: '#64748b' } },
                  },
                  yaxis: {
                    labels: { style: { fontSize: '11px', colors: '#64748b' }, maxWidth: 140 },
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
  );
};

export default Dashboard;
