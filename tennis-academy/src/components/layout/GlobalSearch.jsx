// src/components/layout/GlobalSearch.jsx — Enhancement E9
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useDb } from '../../context/DbContext';
import { formatTime12h } from '../../utils/formatters';

export default function GlobalSearch() {
  const { db, tick } = useDb();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const state = db.readAll();
    const q = query.toLowerCase();
    const students = state.students.filter((s) => s.name.toLowerCase().includes(q)).map((s) => ({ type: 'Student', id: s.id, name: s.name, path: '/admin/students', detail: s.guardianName }));
    const batches = state.batches.filter((b) => (b.program || b.name || '').toLowerCase().includes(q)).map((b) => ({ type: 'Batch', id: b.id, name: b.program, path: `/admin/batches/${b.id}`, detail: `${b.dayPattern} ${formatTime12h(b.startTime)}` }));
    const coaches = state.coaches.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ type: 'Coach', id: c.id, name: c.name, path: '/admin/coaches', detail: c.designation }));
    return [...students, ...batches, ...coaches].slice(0, 8);
  }, [query, db, tick]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-64 hidden md:block" ref={ref}>
      <div className="flex items-center gap-2 h-[38px] px-3 rounded-lg bg-canvas-soft border border-line">
        <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Search students, coaches..." className="flex-1 bg-transparent border-none outline-none text-[13px] text-ink placeholder:text-ink-faint" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-line shadow-dropdown overflow-hidden z-[100]">
          {results.map((r) => (
            <button key={`${r.type}-${r.id}`} onClick={() => { setOpen(false); setQuery(''); navigate(r.path); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-canvas-soft transition-colors flex items-center gap-2">
              <span className="text-[10px] font-semibold text-brand-600 uppercase w-16 flex-shrink-0">{r.type}</span>
              <span className="font-medium text-ink">{r.name}</span>
              <span className="text-ink-faint ml-auto">{r.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}