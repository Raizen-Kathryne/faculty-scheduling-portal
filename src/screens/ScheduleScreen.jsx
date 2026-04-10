// screens/ScheduleScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  Search, ChevronLeft, Filter, Users, School, X,
  Loader2, AlertCircle, LayoutGrid, MapPin, Clock,
  RefreshCw, Building2, BookOpen, User
} from 'lucide-react';
import {
  getAllProfessors,
  getProfessorSchedule,
  formatTimeForDisplay,
  groupScheduleByDay,
  filterByDepartment,
} from '../utils/professors';

// ---------------------------------------------------------------------------
// HELPER: Hash-based colour per subject (mirrors FacultyScreen)
// ---------------------------------------------------------------------------
const getSubjectColor = (subject = '') => {
  const colors = [
    'bg-pink-600', 'bg-purple-600', 'bg-indigo-600', 'bg-blue-600',
    'bg-teal-600', 'bg-emerald-600', 'bg-orange-600', 'bg-red-600',
  ];
  let hash = 0;
  for (let i = 0; i < subject.length; i++)
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ---------------------------------------------------------------------------
// HELPER: Grid positioning (identical to FacultyScreen)
// ---------------------------------------------------------------------------
const getGridPosition = (day, time) => {
  const normalizedDay = day.trim().toLowerCase();
  const days = ['time', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const abbr = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' };
  const fullDay = abbr[normalizedDay] || normalizedDay;
  const colIndex = days.indexOf(fullDay);
  if (colIndex === -1) return null;
  const [h, m] = time.split(':').map(Number);
  const rowIndex = Math.floor(((h - 6) * 60 + m) / 30) + 2;
  return { colIndex: colIndex + 1, rowIndex };
};

const getDurationSpan = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(1, Math.ceil(((eh * 60 + em) - (sh * 60 + sm)) / 30));
};

// ---------------------------------------------------------------------------
// DEPARTMENTS list
// ---------------------------------------------------------------------------
const DEPARTMENTS = ['All', 'COE', 'CHAS', 'CCS', 'CBAA', 'COED', 'CAS'];

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Professor Card
// ---------------------------------------------------------------------------
function ProfessorCard({ professor, onClick }) {
  const initials = professor.faculty_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarColors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < professor.faculty_name.length; i++)
    hash = professor.faculty_name.charCodeAt(i) + ((hash << 5) - hash);
  const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

  return (
    <button
      onClick={() => onClick(professor)}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200 p-5 flex flex-col items-center text-center gap-3 w-full hover:-translate-y-0.5"
    >
      {/* Avatar */}
      <div className={`w-16 h-16 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
        {initials}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 w-full">
        <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {professor.faculty_name}
        </p>
        <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
          <Building2 size={11} />
          {professor.department || 'No Department'}
        </p>
      </div>

      {/* View badge */}
      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full group-hover:bg-emerald-100 transition-colors">
        View Schedule →
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Weekly Schedule Modal (READ-ONLY)
// ---------------------------------------------------------------------------
function WeeklyScheduleModal({ professor, onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProfessorSchedule(professor.faculty_id);

        const formatted = data.map((item) => ({
          id: item.declaration_id,
          subject: item.subject_code || 'N/A',
          section: item.class_section || '',
          day: item.day_of_week,
          startTime: formatTimeForDisplay(item.time_start),
          endTime: formatTimeForDisplay(item.time_end),
          room: `${item.building_name} ${item.room_name}`,
          status: item.declaration_status,
          semester: item.semester_name,
          is_active: item.is_active,
          is_locked: item.is_locked,
        }));

        setSchedules(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [professor.faculty_id]);

  // Initials + colour
  const initials = professor.faculty_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < professor.faculty_name.length; i++)
    hash = professor.faculty_name.charCodeAt(i) + ((hash << 5) - hash);
  const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

  // Only show schedules from active/unlocked semesters (mirrors FacultyScreen logic)
  const visible = schedules.filter((s) => s.is_active === 1 || s.is_locked === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight">
                {professor.faculty_name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Building2 size={11} />
                {professor.department || 'No Department'}
                <span className="mx-1 text-gray-300">•</span>
                <LayoutGrid size={11} />
                Weekly Schedule
              </p>
            </div>
          </div>

          {/* Read-only badge */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              View Only
            </span>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={22} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-2 sm:p-6 bg-gray-50">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Loading schedule…</p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 flex items-start gap-3 max-w-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Failed to load schedule</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen size={36} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No schedules found</p>
              <p className="text-xs text-center max-w-xs">
                This professor has no declared schedules for the active semester.
              </p>
            </div>
          )}

          {/* Weekly Grid */}
          {!isLoading && !error && visible.length > 0 && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-auto">
              <div className="relative grid grid-cols-[50px_repeat(7,minmax(70px,1fr))] sm:grid-cols-[80px_repeat(7,1fr)] bg-gray-200 gap-px border border-gray-200 min-w-[600px]">

                {/* Header row */}
                <div className="bg-gray-100 p-2 sm:p-3 text-center text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 left-0 z-20">
                  Time
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <div key={d} className="bg-emerald-50/50 p-2 sm:p-3 text-center text-[10px] sm:text-sm font-bold text-gray-700 sticky top-0 z-10">
                    <span className="sm:hidden">{d}</span>
                    <span className="hidden sm:inline">
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]}
                    </span>
                  </div>
                ))}

                {/* Time slots (6:00 → 22:30 — 33 half-hour rows) */}
                {Array.from({ length: 33 }).map((_, i) => {
                  const hour = Math.floor(i / 2) + 6;
                  const min = (i % 2) * 30;
                  return (
                    <React.Fragment key={i}>
                      <div className="bg-white p-1 sm:p-2 text-right text-[9px] sm:text-xs text-gray-400 font-mono border-r border-gray-100 h-10 sm:h-12 flex items-center justify-end sticky left-0 z-10">
                        {min === 0 && (
                          <span>
                            {hour.toString().padStart(2, '0')}:{min.toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      {Array.from({ length: 7 }).map((_, d) => (
                        <div key={d} className="bg-white h-10 sm:h-12 border-b border-dashed border-gray-100" />
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Schedule blocks (absolutely positioned, READ-ONLY — no delete/edit) */}
                {visible.map((item) => {
                  const pos = getGridPosition(item.day, item.startTime);
                  if (!pos) return null;
                  const span = getDurationSpan(item.startTime, item.endTime);
                  const colorClass = getSubjectColor(item.subject);

                  return (
                    <div
                      key={item.id}
                      className={`absolute mx-0.5 sm:mx-1 rounded-md sm:rounded-lg shadow-md border-l-2 sm:border-l-4 text-white overflow-hidden z-30 flex flex-col justify-center p-1 sm:p-2 ${colorClass}`}
                      style={{
                        gridColumnStart: pos.colIndex,
                        gridColumnEnd: 'span 1',
                        gridRowStart: pos.rowIndex,
                        gridRowEnd: `span ${span}`,
                        width: 'calc(100% - 4px)',
                        minHeight: '100%',
                      }}
                      title={`${item.subject} · ${item.section}\n${item.startTime}–${item.endTime}\n${item.room}`}
                    >
                      <div className="font-bold text-[9px] sm:text-xs md:text-sm leading-tight truncate">
                        {item.subject}
                      </div>
                      <div className="text-[8px] sm:text-[10px] md:text-xs opacity-90 mt-0.5 sm:mt-1 truncate">
                        {item.startTime} – {item.endTime}
                      </div>
                      {item.section && (
                        <div className="text-[8px] sm:text-[10px] opacity-80 truncate">
                          {item.section}
                        </div>
                      )}
                      <div className="text-[8px] sm:text-[10px] md:text-xs font-mono bg-black/20 rounded px-1 sm:px-1.5 py-0.5 mt-auto w-fit truncate">
                        {item.room.split(' ').pop()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer — summary stats */}
        {!isLoading && !error && visible.length > 0 && (
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-emerald-500" />
              <strong className="text-gray-700">{visible.length}</strong> class{visible.length !== 1 ? 'es' : ''} declared
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-500" />
              <strong className="text-gray-700">
                {[...new Set(visible.map((s) => s.room))].length}
              </strong> room{[...new Set(visible.map((s) => s.room))].length !== 1 ? 's' : ''} used
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-500" />
              {visible[0]?.semester}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT: ScheduleScreen
// ---------------------------------------------------------------------------
export default function ScheduleScreen({ onBack }) {
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const [selectedProfessor, setSelectedProfessor] = useState(null); // opens weekly modal

  // --- Load professors on mount ---
  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await getAllProfessors();
      setProfessors(data || []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    loadProfessors();
  };

  // --- Filtering ---
  const filtered = professors
    .filter((p) => {
      const matchDept =
        selectedDept === 'All' ||
        (p.department || '').toUpperCase() === selectedDept;
      const matchSearch =
        searchTerm.trim() === '' ||
        p.faculty_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    })
    .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">

      {/* ── Main Card ── */}
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl w-full max-w-6xl overflow-hidden flex flex-col min-h-[700px] animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-emerald-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              title="Go Back"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <School size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Faculty Schedules</h1>
                <p className="text-emerald-100 text-sm">
                  {isLoading ? 'Loading…' : `${professors.length} professor${professors.length !== 1 ? 's' : ''} • click any card to view schedule`}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 md:p-8 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search professor name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-gray-50 hover:bg-white text-gray-700"
            />
          </div>

          {/* Department */}
          <div className="relative w-full md:w-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <Filter size={18} />
              <label htmlFor="dept-select" className="hidden sm:block">Department:</label>
            </div>
            <select
              id="dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-gray-50 hover:bg-white text-gray-700 cursor-pointer appearance-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1 bg-gray-50/50 flex flex-col">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="w-3/4 h-3 bg-gray-200 rounded-full" />
                  <div className="w-1/2 h-2 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && loadError && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-start gap-3 max-w-md">
                <AlertCircle size={22} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Could not load professors</p>
                  <p className="text-sm mt-1">{loadError}</p>
                </div>
              </div>
              <button
                onClick={loadProfessors}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {/* Empty state after filter */}
          {!isLoading && !loadError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400 gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Users size={48} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600">
                {professors.length === 0 ? 'No Professors Found' : 'No Matching Results'}
              </h3>
              <p className="text-sm text-center max-w-sm">
                {professors.length === 0
                  ? 'No faculty records are available in the system yet.'
                  : 'Try adjusting your search term or department filter.'}
              </p>
            </div>
          )}

          {/* Professor grid */}
          {!isLoading && !loadError && filtered.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mb-4 font-medium">
                Showing <strong className="text-gray-600">{filtered.length}</strong> of {professors.length} professors
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((prof) => (
                  <ProfessorCard
                    key={prof.faculty_id}
                    professor={prof}
                    onClick={setSelectedProfessor}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Schedule Modal */}
      {selectedProfessor && (
        <WeeklyScheduleModal
          professor={selectedProfessor}
          onClose={() => setSelectedProfessor(null)}
        />
      )}
    </div>
  );
}