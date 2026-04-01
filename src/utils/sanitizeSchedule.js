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
 *   Rule A – Hours 1–6: Assumed PM  →  +12  (e.g., 04:00 → 16:00)
 *   Rule B – End < Start (same day): Crossed noon  →  end +12
 *   Subject Code N/A: Replaced with Activity Type value
 *
 * @param {File}   file        - The raw File selected by the user (.xlsx/.xls/.csv)
 * @param {object} XLSX        - The SheetJS library instance (import * as XLSX from 'xlsx')
 * @returns {Promise<File>}    - A new File with sanitized data, same extension as input
 * @throws {Error}             - If file is invalid or cannot be parsed
 */
export async function sanitizeScheduleFile(file, XLSX) {
  try {
    // ✅ Validate inputs
    if (!file) {
      throw new Error('No file provided to sanitizeScheduleFile');
    }

    if (!(file instanceof File || file instanceof Blob)) {
      throw new Error(`Invalid file type: expected File or Blob, got ${typeof file}`);
    }

    if (!XLSX) {
      throw new Error('XLSX library not provided to sanitizeScheduleFile');
    }

    console.log('[SANITIZE] Starting file processing', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    // --- 1. Read the file as a Uint8Array (required by SheetJS type:'array') ---
    let arrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File is empty');
    }

    // --- 2. Parse the workbook ---
    let workbook;
    try {
      workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
        type: 'array', 
        cellText: false, 
        cellDates: false 
      });
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('File has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`Could not read sheet "${sheetName}"`);
    }

    // --- 3. Convert sheet to JSON rows ---
    // Use header:1 first to find which row has the actual column headers
    let rawRows;
    try {
      rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    } catch (error) {
      throw new Error(`Failed to convert sheet to rows: ${error.message}`);
    }

    if (!rawRows || rawRows.length === 0) {
      throw new Error('File has no data rows');
    }

    console.log('[SANITIZE] Raw rows count:', rawRows.length);

    // Find the header row (the row that contains 'Day' and 'Start Time')
    let headerRowIndex = 0;
    let headerFound = false;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i].map(c => String(c).trim());
      if (row.includes('Day') && row.includes('Start Time')) {
        headerRowIndex = i;
        headerFound = true;
        console.log('[SANITIZE] Found header row at index:', i);
        break;
      }
    }

    if (!headerFound) {
      console.warn('[SANITIZE] Did not find header row with "Day" and "Start Time"');
      // Continue anyway - let backend handle validation
    }

    // Re-parse using the detected header row
    let jsonRows;
    try {
      jsonRows = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: '',
        raw: true,   // keep raw values (numbers/strings as-is)
      });
    } catch (error) {
      throw new Error(`Failed to parse rows as JSON: ${error.message}`);
    }

    if (!jsonRows || jsonRows.length === 0) {
      throw new Error('No data rows found after header');
    }

    console.log('[SANITIZE] Data rows count:', jsonRows.length);

    // --- 4. Sanitize each row ---
    let sanitized;
    try {
      sanitized = jsonRows.map((row, idx) => {
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
    } catch (error) {
      throw new Error(`Failed to sanitize rows: ${error.message}`);
    }

    console.log('[SANITIZE] Sanitized rows:', sanitized.length);

    // --- 5. Write sanitized rows back to a new workbook ---
    let newWb;
    let newWs;
    
    try {
      newWb = XLSX.utils.book_new();
      newWs = XLSX.utils.json_to_sheet(sanitized);
      XLSX.utils.book_append_sheet(newWb, newWs, 'Sheet1');
    } catch (error) {
      throw new Error(`Failed to create new workbook: ${error.message}`);
    }

    // Determine output format from original file extension
    const ext = file.name.split('.').pop().toLowerCase();
    const bookType = ext === 'csv' ? 'csv' : 'xlsx';
    const mimeType = ext === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // --- 6. Write to binary array ---
    let wbOut;
    try {
      wbOut = XLSX.write(newWb, { bookType, type: 'array' });
    } catch (error) {
      throw new Error(`Failed to write workbook: ${error.message}`);
    }

    if (!wbOut || wbOut.length === 0) {
      throw new Error('Workbook output is empty');
    }

    // --- 7. Convert to File ---
    const blob = new Blob([wbOut], { type: mimeType });
    const sanitizedFile = new File([blob], file.name, { type: mimeType });

    // ✅ Validate the output
    if (!(sanitizedFile instanceof File)) {
      throw new Error('Failed to create File object');
    }

    if (!sanitizedFile.name || sanitizedFile.size === 0) {
      throw new Error('Sanitized file is invalid (no name or empty)');
    }

    console.log('[SANITIZE] Success', {
      originalName: file.name,
      originalSize: file.size,
      sanitizedName: sanitizedFile.name,
      sanitizedSize: sanitizedFile.size,
      sanitizedType: sanitizedFile.type,
      isFile: sanitizedFile instanceof File
    });

    return sanitizedFile;

  } catch (error) {
    console.error('[SANITIZE] Fatal error:', {
      message: error.message,
      stack: error.stack,
      fileName: file?.name,
      fileSize: file?.size
    });
    throw error;
  }
}