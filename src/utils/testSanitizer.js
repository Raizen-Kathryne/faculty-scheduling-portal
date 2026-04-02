// utils/testSanitizer.js
// Utility to test sanitizeScheduleFile in isolation

import { sanitizeScheduleFile } from './sanitizeSchedule';
import * as XLSX from 'xlsx';

/**
 * Test function to verify sanitization works without uploading
 * Call this from browser console or from a test component
 */
export async function testSanitizer(file) {
  console.log('\n' + '='.repeat(60));
  console.log('SANITIZER TEST START');
  console.log('='.repeat(60));

  try {
    // ✅ Validate input
    if (!file) {
      throw new Error('No file provided. Pass a File object to testSanitizer(file)');
    }

    if (!(file instanceof File)) {
      throw new Error(`Expected File object, got ${typeof file}`);
    }

    console.log('INPUT FILE:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // ✅ Call sanitizer
    console.log('\nCalling sanitizeScheduleFile...');
    const sanitized = await sanitizeScheduleFile(file, XLSX);

    // ✅ Validate output
    console.log('\nOUTPUT FILE:', {
      name: sanitized.name,
      size: sanitized.size,
      type: sanitized.type,
      isFile: sanitized instanceof File,
      isBlob: sanitized instanceof Blob,
      lastModified: new Date(sanitized.lastModified).toISOString()
    });

    // ✅ Try to read back the sanitized file
    console.log('\nVERIFYING SANITIZED CONTENT...');
    const arrayBuffer = await sanitized.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`READ BACK ${data.length} ROWS FROM SANITIZED FILE`);
    
    if (data.length > 0) {
      console.log('FIRST ROW SAMPLE:', data[0]);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SANITIZER TEST PASSED');
    console.log('='.repeat(60));
    console.log('\nThe sanitizer is working correctly!');
    console.log('Output is a valid File object that can be uploaded.\n');

    return {
      success: true,
      sanitizedFile: sanitized,
      rowCount: data.length,
      sampleRow: data[0] || null
    };

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ SANITIZER TEST FAILED');
    console.error('='.repeat(60));
    console.error('ERROR:', error.message);
    console.error('STACK:', error.stack);
    console.error('='.repeat(60) + '\n');

    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Advanced test: Check what the sanitizer outputs for different time formats
 */
export async function testSanitizerTimeHandling(file) {
  console.log('\n' + '='.repeat(60));
  console.log('TIME HANDLING TEST');
  console.log('='.repeat(60));

  try {
    const sanitized = await sanitizeScheduleFile(file, XLSX);
    const arrayBuffer = await sanitized.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('TIME CONVERSIONS IN FILE:');
    console.log('(Checking how times were sanitized)\n');

    data.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`);
      console.log(`  Day: ${row.Day}`);
      console.log(`  Start Time: ${row['Start Time']}`);
      console.log(`  End Time: ${row['End Time']}`);
      console.log('');
    });

    console.log('='.repeat(60) + '\n');
    return true;

  } catch (error) {
    console.error('TIME HANDLING TEST FAILED:', error.message);
    return false;
  }
}

/**
 * Integration test: Simulate the full upload flow
 */
export async function testFullUploadFlow(file, uploadScheduleFileFunc, semesterId) {
  console.log('\n' + '='.repeat(60));
  console.log('FULL UPLOAD FLOW TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Sanitize
    console.log('\nStep 1: Sanitizing file...');
    const sanitized = await sanitizeScheduleFile(file, XLSX);
    console.log('✅ Sanitization successful');
    console.log(`   Output: ${sanitized.name} (${sanitized.size} bytes)`);

    // Step 2: Upload
    console.log('\nStep 2: Uploading sanitized file...');
    const result = await uploadScheduleFileFunc(sanitized, semesterId);
    console.log('✅ Upload successful');
    console.log('   Response:', result);

    console.log('\n' + '='.repeat(60));
    console.log('✅ FULL UPLOAD FLOW TEST PASSED');
    console.log('='.repeat(60) + '\n');

    return { success: true, result };

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ FULL UPLOAD FLOW TEST FAILED');
    console.error('='.repeat(60));
    console.error('ERROR:', error.message);
    if (error.validationErrors) {
      console.error('VALIDATION ERRORS:', error.validationErrors);
    }
    console.error('='.repeat(60) + '\n');

    return { success: false, error: error.message };
  }
}