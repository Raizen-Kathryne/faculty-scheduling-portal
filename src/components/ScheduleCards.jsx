// components/ScheduleCards.jsx
// Drop-in replacement for the schedule card grid in FacultyScreen.
// Props:
//   schedule      – the full visibleSchedule array from FacultyScreen
//   isLoading     – boolean
//   onEdit        – (item) => void
//   onDelete      – (id)  => void
import React, { useState, useMemo } from 'react';
import {
  Clock, MapPin, Lock, AlertTriangle, Pencil, Trash2, BookOpen
} from 'lucide-react';

export default function ScheduleCards({ schedule, isLoading, onEdit, onDelete }) {
  // ── Derive unique semester names from the schedule ──────────────────────────
  const semesterNames = useMemo(() => {
    const seen = new Set();
    const list = [];
    schedule.forEach(item => {
      if (item.term && !seen.has(item.term)) {
        seen.add(item.term);
        list.push(item.term);
      }
    });
    return list; // preserves insertion order (order from API)
  }, [schedule]);

  // ── Active tab: null means "All" ─────────────────────────────────────────
  const [activeSem, setActiveSem] = useState(null);

  // ── When semesters change, reset to "All" only if current tab vanishes ───
  React.useEffect(() => {
    if (activeSem !== null && !semesterNames.includes(activeSem)) {
      setActiveSem(null);
    }
  }, [semesterNames, activeSem]);

  // ── Filtered cards ────────────────────────────────────────────────────────
  const filtered = activeSem === null
    ? schedule
    : schedule.filter(item => item.term === activeSem);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cardBorderClass = (item) => {
    const subjectIsNA = !item.subject || item.subject === 'N/A';
    const sectionIsNA = !item.section || item.section === 'N/A';
    if (subjectIsNA && sectionIsNA) return 'border-amber-300 bg-amber-50';
    if (subjectIsNA) return 'border-emerald-200 bg-white';
    return 'border-gray-200 bg-white';
  };

  return (
    <div>
      {/* ── Semester Tabs ─────────────────────────────────────────────────── */}
      {semesterNames.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* "All" pill */}
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
            const count = schedule.filter(i => i.term === sem).length;
            const isActive = activeSem === sem;
            return (
              <button
                key={sem}
                onClick={() => setActiveSem(sem)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  isActive
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
            );
          })}
        </div>
      )}

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-lg font-semibold mb-2">
              {activeSem ? `No classes in "${activeSem}"` : 'No schedules found'}
            </p>
            <p className="text-sm">
              {activeSem
                ? 'Try switching to another semester tab or add a class.'
                : 'Click "Add" or "Import" to create your first entry.'}
            </p>
          </div>
        )}

        {filtered.map(item => {
          const subjectIsNA = !item.subject || item.subject === 'N/A';
          const sectionIsNA = !item.section || item.section === 'N/A';
          const isGarbage = subjectIsNA && sectionIsNA;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group relative ${cardBorderClass(item)}`}
            >
              {/* Header row */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase">
                    {item.day}
                  </span>
                  {subjectIsNA && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200">
                      <AlertTriangle size={10} />
                      {isGarbage ? 'Needs Review' : 'Incomplete'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!item.is_locked && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded hover:bg-emerald-50"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {item.is_locked
                    ? <div className="text-gray-300"><Lock size={16} /></div>
                    : (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )
                  }
                </div>
              </div>

              {/* Subject + Section */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className={`font-bold text-lg ${subjectIsNA ? 'text-amber-600 italic' : 'text-gray-800'}`}>
                  {item.subject || 'N/A'}
                </h3>
                <span className={`text-sm font-semibold px-1.5 py-0.5 rounded ${
                  sectionIsNA
                    ? 'text-amber-600 bg-amber-100 border border-amber-200'
                    : 'text-emerald-600 bg-emerald-50'
                }`}>
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
    </div>
  );
}