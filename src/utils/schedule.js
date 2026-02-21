// utils/schedule.js
import { getToken, getFacultyData } from './auth';
// http://localhost:5000
const API_BASE_URL = 'https://tend-incentives-savings-floors.trycloudflare.com/api';
// Use the key from your .env file
const API_KEY = 'web_ibl9paqzNTF6at_gsIDX0krNbtaTloOTUVQbyuw2aHE'; 

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,             // System Auth - ALWAYS include this
    'Authorization': `Bearer ${token}` // User Auth
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
      class_section: formData.section, // <--- NEW FIELD
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
      
      // Handle Conflict (409) specifically
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

// NEW: Update Declaration (Supports editing existing schedules)
export const updateDeclaration = async (id, formData) => {
  try {
    const payload = {
      room: formData.room,
      subject_code: formData.subject,
      class_section: formData.section, // <--- NEW FIELD
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
    // --- FIX: Use getHeaders() to send JWT instead of API Key ---
    const response = await fetch(`${API_BASE_URL}/upload/template`, {
      method: 'GET',
      headers: getHeaders(), 
    });
    // -----------------------------------------------------------

    if (response.status === 401) {
       throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) throw new Error('Failed to download template');

    // Handle Blob for file download
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

export const uploadScheduleFile = async (file, semesterId) => {
  try {
    const token = getToken();
    
    // CRITICAL: Check if token exists before making request
    if (!token) {
      throw new Error('You are not logged in. Please log in and try again.');
    }
    
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('semester_id', semesterId);

    const response = await fetch(`${API_BASE_URL}/upload/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        // CRITICAL: DO NOT SET 'Content-Type' for FormData
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok && response.status !== 206) {
       // Handle 401 Unauthorized specifically
       if (response.status === 401) {
         localStorage.removeItem('token');
         localStorage.removeItem('userRole');
         localStorage.removeItem('userId');
         throw new Error('Your session has expired. Please log in again.');
       }
       
       const error = new Error(data.message || data.error || 'Upload failed');
       if (data.errors && Array.isArray(data.errors)) {
         error.validationErrors = data.errors;
       }
       throw error;
    }

    return data; 
  } catch (error) {
    console.error('Upload error:', error);
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