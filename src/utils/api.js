// api.js - Main API Handler with Authentication
import { getToken } from './auth';

// Configuration 
const API_BASE_URL = 'https://tend-incentives-savings-floors.trycloudflare.com/api';
// In production, use environment variable: import.meta.env.VITE_API_KEY
const API_KEY = 'web_ibl9paqzNTF6at_gsIDX0krNbtaTloOTUVQbyuw2aHE'; 

/**
 * Get authorization headers with JWT token
 * @returns {Object} - Headers object
 */
const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Get headers with API key (for non-authenticated endpoints)
 * @returns {Object} - Headers object
 */
const getApiKeyHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };
};

/**
 * Get faculty profile (authenticated)
 * @returns {Promise<Object>} - Faculty profile data
 */
export const getMyProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return await response.json();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get faculty schedule (authenticated)
 * @returns {Promise<Array>} - Array of schedule declarations
 */
export const getMySchedule = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/declarations/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch schedule');
    }

    return await response.json();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Creates a new schedule declaration via the API
 * Endpoint: POST /api/declarations
 * @param {Object} scheduleData - The schedule data from the form
 * @returns {Promise<Object>} - The JSON response from the API
 */
export const createDeclaration = async (scheduleData) => {
  try {
    // Transform UI data to match API requirements
    const payload = {
      faculty_id: 1, // This should come from authenticated user data
      room_id: 1,    // TODO: Fetch room ID based on room name
      term: "Spring 2025", // Default term
      day: scheduleData.day,
      start_time: formatTimeForApi(scheduleData.startTime),
      end_time: formatTimeForApi(scheduleData.endTime),
      status: "Posted"
    };

    const response = await fetch(`${API_BASE_URL}/declarations`, {
      method: 'POST',
      headers: getApiKeyHeaders(), // Uses API key for this endpoint
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create declaration');
    }

    return await response.json();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get all rooms
 * @returns {Promise<Array>} - Array of rooms
 */
export const getAllRooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'GET',
      headers: getApiKeyHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rooms');
    }

    return await response.json();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get all faculty members
 * @returns {Promise<Array>} - Array of faculty
 */
export const getAllFaculty = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty`, {
      method: 'GET',
      headers: getApiKeyHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch faculty');
    }

    return await response.json();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Helper to ensure time is in HH:MM:SS format
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - Time in HH:MM:SS format
 */
const formatTimeForApi = (timeString) => {
  // If time is just "09:00", append ":00"
  if (timeString.length === 5) {
    return `${timeString}:00`;
  }
  return timeString;
};