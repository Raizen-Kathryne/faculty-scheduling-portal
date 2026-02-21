// utils/auth.js

// SOLUTION 1: Try named import (for jwt-decode v4+)
import { jwtDecode } from 'jwt-decode';

// If Solution 1 doesn't work, replace line 4 with:
// import jwtDecode from 'jwt-decode';

const API_BASE_URL = 'https://tend-incentives-savings-floors.trycloudflare.com/api';
// Use the key from your .env file or hardcode for dev
const API_KEY = 'web_ibl9paqzNTF6at_gsIDX0krNbtaTloOTUVQbyuw2aHE'; 

// --- Token Management ---

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token, role, id) => {
  if (token) localStorage.setItem('token', token);
  if (role) localStorage.setItem('userRole', role);
  
  // Store ID generically
  if (id) localStorage.setItem('userId', id); 
  
  // BACKWARD COMPATIBILITY: 
  // If it's a faculty member, keep 'facultyId' for existing faculty code
  if (role === 'faculty') {
      localStorage.setItem('facultyId', id);
  }
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('facultyId');
  localStorage.removeItem('userId');
};

// --- AUTHENTICATION ENDPOINTS ---

// 1. FACULTY LOGIN
export const loginFaculty = async (usernameOrEmail, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
        // No API Key needed for login according to docs
      },
      body: JSON.stringify({ 
        username: usernameOrEmail,  // Backend accepts username field
        password 
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Login failed');

    // Save token and user data from response
    // Response structure: { access_token, faculty: { faculty_id, username } }
    const userId = data.faculty?.faculty_id;
    const token = data.access_token;
    
    setToken(token, 'faculty', userId);
    return data;
  } catch (error) {
    throw error;
  }
};

// 2. ADMIN LOGIN (NEW)
export const loginAdmin = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY  // Add API Key for authentication
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Admin login failed');

    // Save token and admin data
    const adminId = data.user?.id || data.user?.admin_id || data.admin?.admin_id;
    setToken(data.token, 'admin', adminId);
    return data;
  } catch (error) {
    throw error;
  }
};

// 3. VERIFY TOKEN
export const verifyToken = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Verification failed');
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

// 4. CHANGE PASSWORD
export const changePassword = async (oldPassword, newPassword) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Failed to update password');
    return data;
  } catch (error) {
    throw error;
  }
};

// --- DATA RETRIEVAL ---

export const getFacultyData = () => {
  const token = getToken();
  const role = localStorage.getItem('userRole');
  
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      removeToken();
      return null;
    }

    // Unified User Object
    return {
      token,
      role, 
      id: decoded.admin_id || decoded.faculty_id,
      name: decoded.admin_name || decoded.faculty_name || 'User',
      email: decoded.email,
      department: decoded.department || (role === 'admin' ? 'Administration' : ''),
      ...decoded
    };
  } catch (error) {
    console.error("Token decode error:", error);
    removeToken();
    return null;
  }
};

// --- SESSION MONITORING ---

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < (Date.now() / 1000);
  } catch (e) { return true; }
};

export const getTokenTimeLeft = () => {
  const token = getToken();
  if (!token) return 0;
  try {
    const decoded = jwtDecode(token);
    const timeLeft = decoded.exp - (Date.now() / 1000);
    return timeLeft > 0 ? timeLeft : 0;
  } catch (e) { return 0; }
};

let tokenExpiryTimer = null;
let onTokenExpiryWarning = null;

export const setTokenExpiryWarningCallback = (cb) => { onTokenExpiryWarning = cb; };

export const startTokenMonitoring = () => {
  if (tokenExpiryTimer) clearInterval(tokenExpiryTimer);
  tokenExpiryTimer = setInterval(checkTokenStatus, 60 * 1000);
  checkTokenStatus();
  return () => { if (tokenExpiryTimer) clearInterval(tokenExpiryTimer); };
};

const checkTokenStatus = () => {
  const timeLeft = getTokenTimeLeft();
  const minutesLeft = Math.floor(timeLeft / 60);

  if (timeLeft <= 0 && getToken()) {
    removeToken();
    window.location.href = '/login';
    return;
  }
  
  if (minutesLeft <= 5 && minutesLeft > 0 && onTokenExpiryWarning) {
    onTokenExpiryWarning(minutesLeft);
  }
};