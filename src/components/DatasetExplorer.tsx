import React, { useState, useMemo } from 'react';
import { Certificate, Employee, Training, DatasetSummary } from '../types';
import { 
  Database, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  X,
  Code
} from 'lucide-react';

interface DatasetExplorerProps {
  summary: DatasetSummary;
}

type DatasetType = 'certificates' | 'employees' | 'trainings';

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ summary }) => {
  const [activeDataset, setActiveDataset] = useState<DatasetType>('certificates');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Departments list
  const departments = useMemo(() => {
    return Object.keys(summary.department_distribution);
  }, [summary.department_distribution]);

  // Providers list
  const providers = useMemo(() => {
    return Object.keys(summary.provider_distribution);
  }, [summary.provider_distribution]);

  // Certificates filtering
  const filteredCertificates = useMemo(() => {
    return (summary.sample_certificates || []).filter(c => {
      const matchDept = selectedDept === 'all' || c.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
      const matchProv = selectedProvider === 'all' || c.provider === selectedProvider;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        c.id.toLowerCase().includes(q) ||
        c.employee_name.toLowerCase().includes(q) ||
        c.training_title.toLowerCase().includes(q) ||
        c.skill_acquired.toLowerCase().includes(q);
      return matchDept && matchStatus && matchProv && matchQuery;
    });
  }, [summary.sample_certificates, selectedDept, selectedStatus, selectedProvider, searchQuery]);

  // Employees filtering
  const filteredEmployees = useMemo(() => {
    return (summary.all_employees_summary || []).filter(e => {
      const matchDept = selectedDept === 'all' || e.department === selectedDept;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        (e.skills && e.skills.some(s => s.toLowerCase().includes(q)));
      return matchDept && matchQuery;
    });
  }, [summary.all_employees_summary, selectedDept, searchQuery]);

  // Trainings filtering
  const filteredTrainings = useMemo(() => {
    return (summary.all_trainings_summary || []).filter(t => {
      const matchProv = selectedProvider === 'all' || t.provider === selectedProvider;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.provider.toLowerCase().includes(q) ||
        (t.skill_acquired && t.skill_acquired.toLowerCase().includes(q));
      return matchProv && matchQuery;
    });
  }, [summary.all_trainings_summary, selectedProvider, searchQuery]);

  // Current dataset rows
  const currentRows = useMemo(() => {
    if (activeDataset === 'certificates') return filteredCertificates;
    if (activeDataset === 'employees') return filteredEmployees;
    return filteredTrainings;
  }, [activeDataset, filteredCertificates, filteredEmployees, filteredTrainings]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(currentRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentRows.slice(start, start + pageSize);
  }, [currentRows, currentPage, pageSize]);

  // Export current filtered rows to CSV
  const handleExportCSV = () => {
    if (!currentRows.length) return;
    const keys = Object.keys(currentRows[0]).filter(k => k !== 'skills');
    const header = keys.join(',');
    const rows = currentRows.map(r => {
      const rec = r as Record<string, any>;
      return keys.map(k => {
        const val = rec[k];
        if (Array.isArray(val)) return `"${val.join(';')}"`;
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val ?? '';
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeDataset}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold text-blue-400">
                Data Engineering & Storage
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Tabular Registry Inspector
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Workforce Raw Dataset Explorer
            </h2>
            <p className="text-xs text-slate-300">
              Direct access to the underlying 11,809 certifications, 1,906 employee skills vectors, and 899 training courses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Filtered CSV ({currentRows.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Selection Tabs & Search Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Dataset Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveDataset('certificates'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                activeDataset === 'certificates'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Certificates ({summary.total_certificates.toLocaleString()})
            </button>
            <button
              onClick={() => { setActiveDataset('employees'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                activeDataset === 'employees'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Employees ({summary.total_employees.toLocaleString()})
            </button>
            <button
              onClick={() => { setActiveDataset('trainings'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                activeDataset === 'trainings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Training Catalog ({summary.total_trainings.toLocaleString()})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={`Search in ${activeDataset}...`}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          {activeDataset !== 'trainings' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {activeDataset === 'certificates' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="issued">issued (Passed)</option>
                <option value="failed">failed (Failed)</option>
                <option value="in_progress">in_progress</option>
                <option value="pending">pending</option>
              </select>
            </div>
          )}

          {activeDataset !== 'employees' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Rows per Page</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {activeDataset === 'certificates' && (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left bg-slate-950/60">
                  <th className="py-2.5 px-3">Cert ID</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Training Course</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Exam</th>
                  <th className="py-2.5 px-3 text-right">Quiz</th>
                  <th className="py-2.5 px-3 text-right">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedRows.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedRecord(c)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-blue-400 font-medium">{c.id}</td>
                    <td className="py-2.5 px-3 text-white font-sans">{c.employee_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.department}</td>
                    <td className="py-2.5 px-3 text-slate-200">{c.training_title}</td>
                    <td className="py-2.5 px-3 text-purple-300">{c.provider}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'issued'
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                          : c.status === 'failed'
                          ? 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
                          : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{c.exam_score}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{c.quiz_score}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-cyan-300">
                      {c.score > 0 ? c.score : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'employees' && (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left bg-slate-950/60">
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Skill Count</th>
                  <th className="py-2.5 px-3">Skills Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedRows.map((e: any) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedRecord(e)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-blue-400 font-medium">{e.id}</td>
                    <td className="py-2.5 px-3 text-white font-sans font-medium">{e.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{e.department}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-cyan-400">{e.skill_count}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {e.skills?.slice(0, 4).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
                            {s}
                          </span>
                        ))}
                        {e.skills?.length > 4 && (
                          <span className="text-[10px] text-slate-500">+{e.skills.length - 4} more</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'trainings' && (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left bg-slate-950/60">
                  <th className="py-2.5 px-3">Course ID</th>
                  <th className="py-2.5 px-3">Certification Course Title</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Core Skill Acquired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedRows.map((t: any) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedRecord(t)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-blue-400 font-medium">{t.id}</td>
                    <td className="py-2.5 px-3 text-white font-sans font-medium">{t.title}</td>
                    <td className="py-2.5 px-3 text-purple-300">{t.provider}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[11px]">
                        {t.skill || t.skill_acquired}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing <span className="text-white font-bold">{Math.min(currentRows.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
            <span className="text-white font-bold">{Math.min(currentRows.length, currentPage * pageSize)}</span> of{' '}
            <span className="text-white font-bold">{currentRows.length.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row Inspection Modal / Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Record Inspector: {selectedRecord.id || selectedRecord.employee_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono text-cyan-300">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
