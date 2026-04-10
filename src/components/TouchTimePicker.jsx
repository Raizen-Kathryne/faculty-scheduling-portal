// components/TouchTimePicker.jsx
import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

export default function TouchTimePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [selHour, setSelHour] = useState(null);
  const [selMin, setSelMin] = useState(null);
  const [ampm, setAmpm] = useState('AM');

  const to24h = (h, ap) => ap === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
  const toDisplay = (h, m, ap) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;

  const openPicker = () => {
    if (value) {
      const [hh, mm] = value.split(':').map(Number);
      const ap = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      setSelHour(h12); setSelMin(mm); setAmpm(ap);
    } else {
      setSelHour(null); setSelMin(null); setAmpm('AM');
    }
    setOpen(true);
  };

  const confirm = () => {
    if (selHour === null || selMin === null) return;
    const h24 = to24h(selHour, ampm);
    onChange(`${String(h24).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`);
    setOpen(false);
  };

  const displayLabel = value
    ? (() => {
        const [hh, mm] = value.split(':').map(Number);
        const ap = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        return toDisplay(h12, mm, ap);
      })()
    : null;

  return (
    <>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <button
          type="button"
          onClick={openPicker}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white flex items-center justify-between text-left min-h-[48px]"
        >
          <span className={displayLabel ? 'text-gray-800 font-medium text-base' : 'text-gray-400 text-sm'}>
            {displayLabel || 'Select time'}
          </span>
          <Clock size={16} className="text-gray-400" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Select {label}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Time Preview + AM/PM */}
            <div className="bg-gray-50 py-5 text-center">
              <div className="text-4xl font-bold text-gray-800 tracking-widest mb-3">
                {selHour !== null ? String(selHour).padStart(2, '0') : '--'}
                :
                {selMin !== null ? String(selMin).padStart(2, '0') : '--'}
                <span className="text-2xl ml-2 text-gray-500">{ampm}</span>
              </div>
              <div className="inline-flex border border-gray-200 rounded-xl overflow-hidden">
                {['AM', 'PM'].map(ap => (
                  <button
                    key={ap}
                    onClick={() => setAmpm(ap)}
                    className={`px-6 py-2 text-sm font-bold transition-colors ${ampm === ap ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'}`}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>

            {/* Hour Grid */}
            <div className="px-5 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hour</p>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <button
                    key={h}
                    onClick={() => setSelHour(h)}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors ${selHour === h ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Grid */}
            <div className="px-5 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Minute</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 15, 30, 45].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelMin(m)}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors ${selMin === m ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {m === 0 ? '00' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={selHour === null || selMin === null}
                className="flex-2 flex-grow-[2] py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Set time
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}