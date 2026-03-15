// utils/sanitizeSchedule.js
// Browser-compatible ES Module (uses SheetJS / xlsx library)
// Import SheetJS at the top of any file that uses this, or via CDN:
//   import * as XLSX from 'xlsx';
// This module only exports the sanitize function — XLSX is passed in as a param.

/**
 * Parses an Excel/CSV File object, sanitizes the time values, 
 * and returns a new sanitized File (Blob) ready to upload to the backend.
 *
 * WHY THIS IS NEEDED:
 *   Faculty Excel files store afternoon times (e.g., 4:00 PM) as bare hours
 *   like "04:00:00" without an AM/PM marker. The backend would treat that as
 *   4:00 AM. This function detects those cases and corrects them to 16:00:00.
 *
 * RULES APPLIED:
 *   Rule A — Hours 1–6: Assumed PM  →  +12  (e.g., 04:00 → 16:00)
 *   Rule B — End < Start (same day): Crossed noon  →  end +12
 *   Subject Code N/A: Replaced with Activity Type value
 *
 * @param {File}   file        - The raw File selected by the user (.xlsx/.xls/.csv)
 * @param {object} XLSX        - The SheetJS library instance (import * as XLSX from 'xlsx')
 * @returns {Promise<File>}    - A new File with sanitized data, same extension as input
 */
export async function sanitizeScheduleFile(file, XLSX) {
  // --- 1. Read the file as a Uint8Array (required by SheetJS type:'array') ---
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellText: false, cellDates: false });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Could not read the file. Make sure it is a valid .xlsx or .csv file.');
  const worksheet = workbook.Sheets[sheetName];

  // --- 2. Convert sheet to JSON rows ---
  // Use header:1 first to find which row has the actual column headers
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Find the header row (the row that contains 'Day' and 'Start Time')
  let headerRowIndex = 0;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i].map(c => String(c).trim());
    if (row.includes('Day') && row.includes('Start Time')) {
      headerRowIndex = i;
      break;
    }
  }

  // Re-parse using the detected header row
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: '',
    raw: true,   // keep raw values (numbers/strings as-is)
  });

  // --- 3. Sanitize each row ---
  const sanitized = jsonRows.map(row => {
    const out = { ...row };

    // Rule: N/A Subject Code → use Activity Type
    const code = String(out['Subject Code'] ?? '').trim().toUpperCase();
    if (!code || code === 'N/A') {
      out['Subject Code'] = out['Activity Type'] || 'N/A';
    }

    // Helper: convert a raw cell value to "HH:mm:ss" string
    // Excel may give times as decimal fractions (0.5 = noon) or as "HH:MM:SS" strings
    const toTimeString = (val) => {
      if (val === '' || val == null) return null;

      // If it's already a string like "07:00:00"
      if (typeof val === 'string' && val.includes(':')) return val.trim();

      // If it's an Excel serial decimal (e.g., 0.291667 = 7:00 AM)
      if (typeof val === 'number') {
        const totalSec = Math.round(val * 86400);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }

      return String(val).trim();
    };

    // Helper: fix AM/PM ambiguity
    const fixTime = (timeStr, prevTotalMinutes = 0) => {
      if (!timeStr) return { fixed: timeStr, totalMinutes: prevTotalMinutes };

      const parts = timeStr.split(':');
      if (parts.length < 2) return { fixed: timeStr, totalMinutes: prevTotalMinutes };

      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parts[2] ? parseInt(parts[2], 10) : 0;

      // Rule A: hours 1–6 are almost certainly PM in a work/school schedule
      if (h >= 1 && h <= 6) h += 12;

      let total = h * 60 + m;

      // Rule B: if end time is still before start time and h < 12, push to PM
      if (total <= prevTotalMinutes && h < 12) {
        h += 12;
        total = h * 60 + m;
      }

      const fixed = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      return { fixed, totalMinutes: total };
    };

    const startRaw = toTimeString(out['Start Time']);
    const endRaw   = toTimeString(out['End Time']);

    if (startRaw) {
      const { fixed: fixedStart, totalMinutes: startMinutes } = fixTime(startRaw, 0);
      out['Start Time'] = fixedStart;

      if (endRaw) {
        const { fixed: fixedEnd } = fixTime(endRaw, startMinutes);
        out['End Time'] = fixedEnd;
      }
    }

    return out;
  });

  // --- 4. Write sanitized rows back to a new workbook ---
  const newWb = XLSX.utils.book_new();
  const newWs = XLSX.utils.json_to_sheet(sanitized);
  XLSX.utils.book_append_sheet(newWb, newWs, 'Sheet1');

  // Determine output format from original file extension
  const ext = file.name.split('.').pop().toLowerCase();
  const bookType = ext === 'csv' ? 'csv' : 'xlsx';
  const mimeType = ext === 'csv'
    ? 'text/csv'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const wbOut = XLSX.write(newWb, { bookType, type: 'array' });
  const blob = new Blob([wbOut], { type: mimeType });

  // Return as a File so it can be passed directly to uploadScheduleFile()
  return new File([blob], file.name, { type: mimeType });
}