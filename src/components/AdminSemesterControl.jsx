// src/components/AdminSemesterControl.jsx
import React, { useState } from 'react';
import { Shield, Play, Square, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { activateSemester, deactivateSemester } from '../utils/admin';

// ⚠️ MUST have 'export default' here for the import to work
export default function AdminSemesterControl({ semester, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!semester) return null;

  const handleActivate = async () => {
    if (!window.confirm(`Are you sure you want to START ${semester.semester_name}? \n\nThis will:\n1. Lock the semester\n2. Post all pending schedules`)) return;
    
    setIsLoading(true);
    try {
      const result = await activateSemester(semester.semester_id);
      setMessage({ type: 'success', text: result.message });
      onRefresh(); 
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`End ${semester.semester_name}? This will archive it.`)) return;

    setIsLoading(true);
    try {
      await deactivateSemester(semester.semester_id);
      setMessage({ type: 'success', text: 'Semester deactivated.' });
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 text-slate-200 rounded-xl p-4 shadow-lg border border-slate-700 mb-6">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
        <Shield size={18} className="text-yellow-500" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Admin Controls</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg text-white">{semester.semester_name}</p>
          <div className="flex gap-2 text-xs mt-1">
            <span className={`px-2 py-0.5 rounded ${semester.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              {semester.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className={`px-2 py-0.5 rounded ${semester.is_locked ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {semester.is_locked ? 'LOCKED' : 'UNLOCKED'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {!semester.is_active && !semester.is_locked && (
            <button 
              onClick={handleActivate} 
              disabled={isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor" />}
              Start Semester
            </button>
          )}

          {semester.is_active && (
            <button 
              onClick={handleDeactivate}
              disabled={isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Square size={16} fill="currentColor" />}
              End Semester
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mt-3 text-xs p-2 rounded border flex items-center gap-2 ${message.type === 'error' ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-green-900/50 border-green-800 text-green-200'}`}>
          {message.type === 'error' ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>}
          {message.text}
        </div>
      )}
    </div>
  );
}