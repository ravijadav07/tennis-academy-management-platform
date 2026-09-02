import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSearch, CheckCircle, XCircle, AlertTriangle, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { reconciliationEntries, reconciliationStats } from '../../../data/admin/reconciliationData';
import { triggerWorkflow } from '../../../utils/api';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const columns = [
  {
    accessorKey: 'studentName',
    header: 'Student',
    cell: ({ getValue }) => <span className="font-medium text-ink">{getValue()}</span>,
  },
  {
    accessorKey: 'business_entity',
    header: 'Business Entity',
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize">
        {getValue() === 'the-club' ? 'The Club' : "TOTS Tennis"}
      </span>
    ),
  },
  {
    accessorKey: 'excelAmount',
    header: 'Excel Amount',
    cell: ({ getValue }) => <span className="font-medium text-ink">{formatCurrency(getValue())}</span>,
  },
  {
    accessorKey: 'systemAmount',
    header: 'System Amount',
    cell: ({ getValue }) => <span className="font-medium text-ink">{formatCurrency(getValue())}</span>,
  },
  {
    accessorKey: 'difference',
    header: 'Difference',
    cell: ({ getValue }) => {
      const diff = getValue();
      return (
        <span className={diff === 0 ? 'text-ok font-medium' : 'text-err font-medium'}>
          {diff === 0 ? '--' : formatCurrency(diff)}
        </span>
      );
    },
  },
  {
    accessorKey: 'gateway',
    header: 'Gateway',
    cell: ({ getValue }) => {
      const g = getValue();
      const label = g === 'cc_avenue' ? 'CCAvenue' : g === 'stripe' ? 'Stripe' : 'Excel Reported';
      return <StatusPill status={label} />;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusPill status={getValue()} />,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-ink-muted text-xs">{formatDate(getValue())}</span>,
  },
];

const mockPreviewRows = [
  { student: 'Arjun Mehta', batch: 'Advanced Tournament', amount: 4500, gateway: 'CCAvenue', status: 'matched' },
  { student: 'Simran Kaur', batch: 'Intermediate Group', amount: 4000, gateway: 'Stripe', status: 'mismatch' },
  { student: 'Pari Singh', batch: 'Beginner Batch A', amount: 3000, gateway: 'Excel Reported', status: 'new' },
];

export default function Reconciliation() {
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  const filteredEntries = reconciliationEntries;

  const parseAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined || value === '') return 0;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const pick = (row, keys) => {
    const rowKeys = Object.keys(row);
    for (const k of rowKeys) {
      if (keys.includes(k.trim().toLowerCase())) return row[k];
    }
    for (const k of rowKeys) {
      const kl = k.trim().toLowerCase();
      if (keys.some(key => kl.includes(key))) return row[k];
    }
    return undefined;
  };

  const normalizeRow = (row) => ({
    student: pick(row, ['student', 'name', 'student name', 'player']) || '',
    batch: pick(row, ['batch', 'group', 'program', 'plan', 'batch name']) || '',
    amount: parseAmount(pick(row, ['amount', 'fee', 'fees', 'paid', 'payment', 'price', 'total'])),
    gateway: pick(row, ['gateway', 'channel', 'payment method', 'mode']) || 'Excel Reported',
    status: 'pending',
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const sheet = wb.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
        const rows = json.map(normalizeRow).filter(r => r.student);
        setPreviewData(rows);
        toast.success(`Parsed ${rows.length} rows from ${file.name}`);
      } catch (err) {
        toast.error('Failed to parse file: ' + err.message);
        setPreviewData(null);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      handleFileChange({ target: { files: dt.files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMockUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setPreviewData(mockPreviewRows);
    }, 1500);
  };

  const handleProcessReconciliation = async () => {
    if (!previewData) return;
    const p = toast.loading('Processing reconciliation...');
    try {
      await triggerWorkflow('reconciliation.upload', {
        rows: previewData.map((row) => ({
          student: row.student,
          batch: row.batch,
          amount: row.amount,
          gateway: row.gateway,
        })),
        entity: selectedEntity,
      });
      toast.success('Reconciliation processed successfully', { id: p });
      setUploadModal(false);
      setPreviewData(null);
    } catch (err) {
      toast.error('Reconciliation failed: ' + err.message, { id: p });
    }
  };

  const renderCard = (item) => {
    const diff = item.difference;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-ink">{item.studentName}</h4>
          <StatusPill status={item.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="text-ink-muted">Excel: {formatCurrency(item.excelAmount)}</span>
          <span className="text-ink-muted">System: {formatCurrency(item.systemAmount)}</span>
          <span className={diff === 0 ? 'text-ok font-medium' : 'text-err font-medium'}>
            {diff === 0 ? 'Matched' : `Diff: ${formatCurrency(diff)}`}
          </span>
          <span className="text-ink-muted text-right">{formatDate(item.date)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={Upload} onClick={() => { setUploadModal(true); setPreviewData(null); }}>Upload Excel</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileSearch} label="Total Entries" value={reconciliationStats.totalEntries} />
        <StatCard icon={CheckCircle} label="Matched" value={reconciliationStats.matched} color="ok" />
        <StatCard icon={XCircle} label="Mismatched" value={reconciliationStats.mismatched} color="err" />
        <StatCard icon={FileText} label="New" value={reconciliationStats.new} color="brand" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={AlertTriangle} label="Total Difference" value={formatCurrency(reconciliationStats.totalDifference)} color={reconciliationStats.totalDifference > 0 ? 'err' : 'ok'} />
      </div>

      <AdaptiveTable
        data={filteredEntries}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search reconciliation..."
        emptyMessage="No entries found"
      />

      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Excel" size="lg">
        <div className="space-y-4">
          {!previewData ? (
            <>
              <div
                className="border-2 border-dashed border-line rounded-2xl p-12 text-center hover:border-brand/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <FileSpreadsheet className="w-10 h-10 text-ink-faint mx-auto mb-3" />
                <p className="text-sm font-medium text-ink">Upload .xlsx file</p>
                <p className="text-xs text-ink-muted mt-1">Drag & drop or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex justify-center">
                <Button variant="secondary" icon={Download} onClick={handleMockUpload} disabled={uploading}>
                  {uploading ? 'Processing...' : 'Mock Upload'}
                </Button>
              </div>
              {uploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted py-4">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  Parsing spreadsheet...
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Parsed Rows ({previewData.length})</p>
                <Button variant="ghost" onClick={() => setPreviewData(null)}>Reset</Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas-soft text-ink-muted font-medium">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Gateway</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-ink">{row.student}</td>
                        <td className="px-4 py-3 text-ink-muted text-xs">{row.batch}</td>
                        <td className="px-4 py-3 font-medium text-ink">{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-3 text-ink-muted text-xs">{row.gateway}</td>
                        <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setPreviewData(null)}>Reset</Button>
                <Button icon={Upload} onClick={handleProcessReconciliation}>Process Reconciliation</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
