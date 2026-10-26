import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Trash2,
  RotateCcw,
  ShieldAlert,
  RefreshCw,
  Filter,
  History,
  Eye,
  X,
  Layers,
  FileText,
  User,
  Clock,
  Settings2,
  Tag,
  ArrowLeftRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MODEL_LABELS = {
  customer: 'Customer',
  order: 'Order',
  product: 'Product',
  calllog: 'Call Log',
  phone: 'Phone',
};

const ACTION_STYLES = {
  delete: 'bg-rose-100 text-rose-700',
  soft_delete: 'bg-rose-100 text-rose-700',
  create: 'bg-emerald-100 text-emerald-700',
  restore: 'bg-amber-100 text-amber-800',
  update: 'bg-sky-100 text-sky-700',
  access: 'bg-slate-100 text-slate-600',
};

const ACTION_LABELS = {
  soft_delete: 'Soft Delete',
  restore: 'Restore',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  access: 'Access',
};

function formatValue(value) {
  if (value === null || value === undefined || value === 'None' || value === 'null') return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const RecycleBin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modelFilter, setModelFilter] = useState('');
  const [tab, setTab] = useState('bin'); // bin | audit
  const [selectedAudit, setSelectedAudit] = useState(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['recycle-bin', modelFilter],
    queryFn: () => {
      const params = {};
      if (modelFilter) params.model = modelFilter;
      return axios.get('api/recycle-bin/', { params }).then((r) => r.data);
    },
    enabled: user?.role === 'Admin',
  });

  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => axios.get('api/audit-logs/').then((r) => r.data),
    enabled: user?.role === 'Admin' && tab === 'audit',
  });

  const restoreMutation = useMutation({
    mutationFn: (payload) => axios.post('api/recycle-bin/restore/', payload),
    onSuccess: () => {
      toast.success('Restored successfully');
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Restore failed');
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (payload) => axios.post('api/recycle-bin/purge/', payload),
    onSuccess: () => {
      toast.success('Permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Purge failed');
    },
  });

  const results = data?.results || [];
  const auditResults = auditData?.results || [];

  const countsByModel = useMemo(() => {
    const counts = {};
    (data?.results || []).forEach((item) => {
      counts[item.model] = (counts[item.model] || 0) + 1;
    });
    return counts;
  }, [data?.results]);

  if (user?.role !== 'Admin') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="text-slate-500 mt-2">The recycle bin and audit log are restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-slate-700" />
            Recycle Bin & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Soft-deleted records can be restored. Permanent purge cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (tab === 'bin' ? refetch() : refetchAudit())}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('bin')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
            tab === 'bin' ? 'bg-blue-500 text-white shadow-soft' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          Recycle Bin ({results.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg inline-flex items-center gap-1.5 ${
            tab === 'audit' ? 'bg-blue-500 text-white shadow-soft' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Log
        </button>
      </div>

      {tab === 'bin' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="">All types</option>
              {Object.entries(MODEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                  {countsByModel[key] ? ` (${countsByModel[key]})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="soft-table-wrap">
            {isLoading ? (
              <div className="p-10 text-center text-slate-400">Loading…</div>
            ) : results.length === 0 ? (
              <div className="p-10 text-center text-slate-400">Recycle bin is empty</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="soft-thead text-left">
                    <tr>
                      <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><Layers strokeWidth={2.2} />Type</span></th>
                      <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><FileText strokeWidth={2.2} />Record</span></th>
                      <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><User strokeWidth={2.2} />Deleted by</span></th>
                      <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><Clock strokeWidth={2.2} />Deleted at</span></th>
                      <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white text-right"><span className="soft-th-inner"><Settings2 strokeWidth={2.2} />Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={`${item.model}-${item.id}`} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {MODEL_LABELS[item.model] || item.model}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate" title={item.label}>
                          {item.label}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.deleted_by || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {item.deleted_at ? new Date(item.deleted_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate({ model: item.model, id: item.id })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 mr-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            disabled={purgeMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Permanently delete "${item.label}"? This cannot be undone.`
                                )
                              ) {
                                purgeMutation.mutate({ model: item.model, id: item.id });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="soft-table-wrap">
          {auditLoading ? (
            <div className="p-10 text-center text-slate-400">Loading audit log…</div>
          ) : auditResults.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No audit entries yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="soft-thead text-left">
                  <tr>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><Clock strokeWidth={2.2} />When</span></th>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><User strokeWidth={2.2} />Who</span></th>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><History strokeWidth={2.2} />Action</span></th>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><Layers strokeWidth={2.2} />Model</span></th>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><FileText strokeWidth={2.2} />Object</span></th>
                    <th className="soft-th px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white text-right"><span className="soft-th-inner"><Eye strokeWidth={2.2} />Detail</span></th>
                  </tr>
                </thead>
                <tbody>
                  {auditResults.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => setSelectedAudit(entry)}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {entry.actor || '—'}
                        {entry.actor_username && entry.actor !== entry.actor_username && (
                          <span className="block text-xs font-normal text-slate-400">@{entry.actor_username}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            ACTION_STYLES[entry.action] || ACTION_STYLES.update
                          }`}
                        >
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{entry.model || '—'}</td>
                      <td className="px-4 py-2.5 truncate max-w-sm" title={entry.object_repr}>
                        {entry.object_repr || entry.object_pk}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAudit(entry);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedAudit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          onClick={() => setSelectedAudit(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Audit detail</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedAudit.timestamp
                    ? new Date(selectedAudit.timestamp).toLocaleString('en-IN')
                    : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Who</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {selectedAudit.actor || 'Unknown'}
                  </div>
                  {selectedAudit.actor_username && (
                    <div className="text-xs text-slate-500">@{selectedAudit.actor_username}</div>
                  )}
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Action</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        ACTION_STYLES[selectedAudit.action] || ACTION_STYLES.update
                      }`}
                    >
                      {ACTION_LABELS[selectedAudit.action] || selectedAudit.action}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Model</div>
                  <div className="mt-1 font-medium text-slate-800">{selectedAudit.model || '—'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Object</div>
                  <div className="mt-1 font-medium text-slate-800 break-words">
                    {selectedAudit.object_repr || selectedAudit.object_pk || '—'}
                  </div>
                  {selectedAudit.object_pk && (
                    <div className="text-xs text-slate-500 mt-0.5">ID: {selectedAudit.object_pk}</div>
                  )}
                </div>
                {selectedAudit.remote_addr && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 sm:col-span-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">IP</div>
                    <div className="mt-1 font-medium text-slate-800">{selectedAudit.remote_addr}</div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Field changes</h3>
                {(selectedAudit.change_rows || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No field-level changes recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="soft-thead text-left">
                        <tr>
                          <th className="soft-th px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><Tag strokeWidth={2.2} />Field</span></th>
                          <th className="soft-th px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><ArrowLeftRight strokeWidth={2.2} />From</span></th>
                          <th className="soft-th px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="soft-th-inner"><ArrowLeftRight strokeWidth={2.2} />To</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAudit.change_rows.map((row) => (
                          <tr key={row.field} className="border-t border-slate-100 align-top">
                            <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                              {row.field}
                            </td>
                            <td className="px-3 py-2 text-slate-500 break-all max-w-[12rem]">
                              {formatValue(row.from)}
                            </td>
                            <td className="px-3 py-2 text-slate-900 break-all max-w-[12rem]">
                              {formatValue(row.to)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
