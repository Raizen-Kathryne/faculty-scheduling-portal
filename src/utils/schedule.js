// utils/schedule.js
import { getToken, getFacultyData } from './auth';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_KEY = 'web_ibl9paqzNTF6at_gsIDX0krNbtaTloOTUVQbyuw2aHE'; 

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Authorization': `Bearer ${token}`
  };
};

// --- API FUNCTIONS ---

export const getSemesters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Failed to fetch semesters');
    }
    return await response.json();
  } catch (error) {
    console.error('Get semesters error:', error);
    throw error;
  }
};

export const getMySchedule = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/declarations/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Failed to fetch schedule');
    }
    return await response.json();
  } catch (error) {
    console.error('Get schedule error:', error);
    throw error;
  }
};

export const createDeclaration = async (formData) => {
  try {
    const faculty = getFacultyData();
    if (!faculty || !faculty.id) {
      throw new Error('User not authenticated. Please log in again.');
    }

    const payload = {
      room: formData.room,
      semester_id: parseInt(formData.semesterId),
      subject_code: formData.subject,
      class_section: formData.section,
      day: formData.day,
      start_time: formData.startTime,
      end_time: formData.endTime,
    };

    const response = await fetch(`${API_BASE_URL}/declarations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        throw new Error('Your session has expired. Please log in again.');
      }
      
      if (response.status === 409) {
        throw new Error(data.error || data.message);
      }

      if (response.status === 404) {
        throw new Error(data.error || data.message || `Room "${formData.room}" not found.`);
      }
      
      if (response.status === 403 || response.status === 400) {
        throw new Error(data.error || data.message || 'Cannot add schedule. Check your data.');
      }
      
      throw new Error(data.error || data.message || 'Failed to add schedule');
    }

    return data;

  } catch (error) {
    throw error;
  }
};

export const updateDeclaration = async (id, formData) => {
  try {
    const payload = {
      room: formData.room,
      subject_code: formData.subject,
      class_section: formData.section,
      day: formData.day,
      start_time: formData.startTime,
      end_time: formData.endTime,
    };

    const response = await fetch(`${API_BASE_URL}/declarations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error(data.error || data.message);
      }
      throw new Error(data.error || data.message || 'Failed to update schedule');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteDeclaration = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/declarations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(data.error || data.message || 'Failed to delete schedule');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const downloadTemplate = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/template`, {
      method: 'GET',
      headers: getHeaders(), 
    });

    if (response.status === 401) {
       throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) throw new Error('Failed to download template');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download template error:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Proper FormData handling with detailed logging
 */
export const uploadScheduleFile = async (file, semesterId) => {
  try {
    const token = getToken();
    
    // ✅ Validate token
    if (!token) {
      throw new Error('You are not logged in. Please log in and try again.');
    }
    
    // ✅ Validate file
    if (!file) {
      throw new Error('No file provided.');
    }

    // ✅ Ensure file is a File or Blob
    if (!(file instanceof File || file instanceof Blob)) {
      throw new Error(`Invalid file type. Expected File or Blob, got ${typeof file}`);
    }
    
    // ✅ Validate semester ID
    if (!semesterId) {
      throw new Error('No semester selected.');
    }

    // ✅ Ensure semester ID is a string for form data
    const semesterIdStr = String(semesterId).trim();
    
    if (!semesterIdStr) {
      throw new Error('Invalid semester ID.');
    }

    // ✅ Build FormData
    const formData = new FormData();
    
    // ✅ Handle Blob without filename
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, 'schedule.csv');
      console.log('Appended Blob as file: schedule.csv');
    } else {
      formData.append('file', file);
      console.log('Appended File:', file.name);
    }
    
    formData.append('semester_id', semesterIdStr);

    // ✅ Log request details for debugging
    console.log('[UPLOAD] Request Details:', {
      fileName: file.name || 'Blob',
      fileSize: file.size,
      fileType: file.type,
      semesterId: semesterIdStr,
      apiUrl: API_BASE_URL,
      timestamp: new Date().toISOString()
    });

    // ✅ Make request
    const response = await fetch(`${API_BASE_URL}/upload/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        // ✅ CRITICAL: Do NOT set Content-Type header
        // Browser will automatically set it to multipart/form-data with boundary
      },
      body: formData
    });

    // ✅ Log response status
    console.log('[UPLOAD] Response Status:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // ✅ Check response BEFORE reading body
    if (!response.ok && response.status !== 206) {
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[UPLOAD] Failed to parse error response:', parseError);
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      console.error('[UPLOAD] Server Error:', data);

      // ✅ Handle 401 specifically
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        throw new Error('Your session has expired. Please log in again.');
      }
      
      // ✅ Create detailed error
      const error = new Error(
        data.message || data.error || `Upload failed with status ${response.status}`
      );
      
      if (data.errors && Array.isArray(data.errors)) {
        error.validationErrors = data.errors;
      }
      
      throw error;
    }

    // ✅ Only read JSON if response is OK
    const data = await response.json();
    console.log('[UPLOAD] Success:', data);
    
    return data; 

  } catch (error) {
    console.error('[UPLOAD] Error:', {
      message: error.message,
      stack: error.stack,
      validationErrors: error.validationErrors || null
    });
    throw error;
  }
};

export const formatTimeForDisplay = (timeString) => {
  if (!timeString) return '';
  return timeString.substring(0, 5); 
};

export const getAllRoomsNoFilter = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/all`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch rooms');
    }
    return await response.json();
  } catch (error) {
    console.error('Get rooms error:', error);
    throw error;
  }
};