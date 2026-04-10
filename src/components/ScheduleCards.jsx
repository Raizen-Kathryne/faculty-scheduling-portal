// components/ScheduleCards.jsx
// Props:
//   schedule        – the full visibleSchedule array from FacultyScreen
//   isLoading       – boolean
//   onEdit          – (item) => void
//   onDelete        – (id)  => void
//   onDeleteSem     – async (semName, ids[]) => void
import React, { useState, useMemo } from 'react';
import {
  Clock, MapPin, Lock, AlertTriangle, Pencil, Trash2,
  BookOpen, AlertCircle, Loader2
} from 'lucide-react';

export default function ScheduleCards({ schedule, isLoading, onEdit, onDelete, onDeleteSem }) {
  // ── Derive unique semester names ──────────────────────────────────────────
  const semesterNames = useMemo(() => {
    const seen = new Set();
    const list = [];
    schedule.forEach(item => {
      if (item.term && !seen.has(item.term)) { seen.add(item.term); list.push(item.term); }
    });
    return list;
  }, [schedule]);

  const [activeSem, setActiveSem]     = useState(null);
  const [confirmSem, setConfirmSem]   = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  React.useEffect(() => {
    if (activeSem !== null && !semesterNames.includes(activeSem)) setActiveSem(null);
  }, [semesterNames, activeSem]);

  const filtered = activeSem === null ? schedule : schedule.filter(i => i.term === activeSem);

  const cardBorderClass = (item) => {
    const sNA = !item.subject || item.subject === 'N/A';
    const secNA = !item.section || item.section === 'N/A';
    if (sNA && secNA) return 'border-amber-300 bg-amber-50';
    if (sNA) return 'border-emerald-200 bg-white';
    return 'border-gray-200 bg-white';
  };

  const semItemsForConfirm = confirmSem ? schedule.filter(i => i.term === confirmSem) : [];
  const lockedCount        = semItemsForConfirm.filter(i => i.is_locked).length;
  const deletableCount     = semItemsForConfirm.length - lockedCount;

  const handleConfirmDelete = async () => {
    if (!confirmSem || !onDeleteSem) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const ids = semItemsForConfirm.filter(i => !i.is_locked).map(i => i.id);
      await onDeleteSem(confirmSem, ids);
      if (activeSem === confirmSem) setActiveSem(null);
      setConfirmSem(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* ── Full-screen blocking overlay while deleting ───────────────────── */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4">
            {/* Spinner ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-base">Deleting schedules…</p>
              <p className="text-xs text-gray-500 mt-1">Please wait, do not close this page</p>
            </div>
            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-red-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Semester Tabs ─────────────────────────────────────────────────── */}
      {semesterNames.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveSem(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
              activeSem === null
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            All
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeSem === null ? 'bg-white/20' : 'bg-gray-100'}`}>
              {schedule.length}
            </span>
          </button>

          {semesterNames.map(sem => {
            const count     = schedule.filter(i => i.term === sem).length;
            const isActive  = activeSem === sem;
            const canDelete = schedule.some(i => i.term === sem && !i.is_locked);

            return (
              <div key={sem} className="shrink-0 flex items-center">
                <button
                  onClick={() => setActiveSem(sem)}
                  className={`flex items-center gap-1.5 py-2 text-sm font-bold border transition-all
                    ${canDelete ? 'pl-3 pr-2 rounded-l-full border-y border-l' : 'px-4 rounded-full border'}
                    ${isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                >
                  <BookOpen size={13} />
                  {sem}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {count}
                  </span>
                </button>

                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteError(null); setConfirmSem(sem); }}
                    title={`Delete schedules in "${sem}"`}
                    className={`flex items-center justify-center px-2 py-2 rounded-r-full border-y border-r transition-all ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-200 border-emerald-600 hover:bg-red-500 hover:text-white hover:border-red-500'
                        : 'bg-white text-gray-300 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-lg font-semibold mb-2">
              {activeSem ? `No classes in "${activeSem}"` : 'No schedules found'}
            </p>
            <p className="text-sm">
              {activeSem ? 'Try switching to another semester tab or add a class.' : 'Click "Add" or "Import" to create your first entry.'}
            </p>
          </div>
        )}

        {filtered.map(item => {
          const subjectIsNA = !item.subject || item.subject === 'N/A';
          const sectionIsNA = !item.section || item.section === 'N/A';
          const isGarbage   = subjectIsNA && sectionIsNA;

          return (
            <div key={item.id} className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group relative ${cardBorderClass(item)}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase">{item.day}</span>
                  {subjectIsNA && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200">
                      <AlertTriangle size={10} />
                      {isGarbage ? 'Needs Review' : 'Incomplete'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!item.is_locked && (
                    <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded hover:bg-emerald-50" title="Edit">
                      <Pencil size={14} />
                    </button>
                  )}
                  {item.is_locked
                    ? <div className="text-gray-300"><Lock size={16} /></div>
                    : <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                  }
                </div>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className={`font-bold text-lg ${subjectIsNA ? 'text-amber-600 italic' : 'text-gray-800'}`}>{item.subject || 'N/A'}</h3>
                <span className={`text-sm font-semibold px-1.5 py-0.5 rounded ${sectionIsNA ? 'text-amber-600 bg-amber-100 border border-amber-200' : 'text-emerald-600 bg-emerald-50'}`}>
                  {item.section || 'N/A'}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-3">{item.term}</p>

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={15} className="text-emerald-500" />
                  <span>{item.startTime} - {item.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} className="text-emerald-500" />
                  <span className="truncate">{item.room}</span>
                </div>
              </div>

              {subjectIsNA && !item.is_locked && (
                <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
                  <Pencil size={9} /> Hover card and click pencil to fix
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Delete Semester Confirm Modal ─────────────────────────────────── */}
      {confirmSem && !isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Delete Semester Schedule</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600">You are about to delete all schedules in:</p>
                <p className="font-bold text-gray-900 text-base mt-1 flex items-center gap-2">
                  <BookOpen size={15} className="text-emerald-600" /> {confirmSem}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold">🗑 {deletableCount} will be deleted</span>
                  {lockedCount > 0 && (
                    <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-bold">🔒 {lockedCount} locked — skipped</span>
                  )}
                </div>
              </div>

              {deletableCount === 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">All schedules in this semester are locked and cannot be deleted.</p>
                </div>
              )}

              {deleteError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmSem(null); setDeleteError(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletableCount === 0}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={15} /> Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}