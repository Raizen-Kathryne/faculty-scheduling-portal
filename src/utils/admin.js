// utils/admin.js
import { getToken } from './auth';
const API_BASE_URL = '/api';

// ⚠️ IMPORTANT: Ensure this matches your .env file
const ADMIN_API_KEY = 'dev_iiFd8wGAKuaCXSzrtuOS9yKwzlsJDzPtludw-scosLY'; 

const getAdminHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': ADMIN_API_KEY,  // Always include API Key
  };

  // Add JWT token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};


// --- ADMIN SEMESTER OPERATIONS ---

export const getAllSemesters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch semesters');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get All Semesters Error:', error);
    throw error;
  }
};

export const createSemester = async (semesterData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(semesterData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to create semester');
    return data;
  } catch (error) {
    console.error('Create Semester Error:', error);
    throw error;
  }
};

// NEW: Update Semester (Edit)
export const updateSemester = async (id, semesterData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(semesterData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to update semester');
    return data;
  } catch (error) {
    console.error('Update Semester Error:', error);
    throw error;
  }
};

// NEW: Delete Semester
export const deleteSemester = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete semester');
    return data;
  } catch (error) {
    console.error('Delete Semester Error:', error);
    throw error;
  }
};

export const activateSemester = async (semesterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters/${semesterId}/activate`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to activate semester');
    return data;
  } catch (error) {
    console.error('Admin Activate Error:', error);
    throw error;
  }
};

export const deactivateSemester = async (semesterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/semesters/${semesterId}/deactivate`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to deactivate semester');
    return data;
  } catch (error) {
    console.error('Admin Deactivate Error:', error);
    throw error;
  }
};

export const getAllFacultyAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/faculty`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch faculty list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get Faculty Error:', error);
    throw error;
  }
};

export const createFacultyAccount = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/create-faculty`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || resData.message || 'Failed to create account');
    return resData;
  } catch (error) {
    console.error('Create Faculty Error:', error);
    throw error;
  }
};

export const resetFacultyPassword = async (facultyId, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ faculty_id: facultyId, new_password: newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to reset password');
    return data;
  } catch (error) {
    console.error('Reset Password Error:', error);
    throw error;
  }
};

export const deleteFacultyAccount = async (facultyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/faculty/${facultyId}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete faculty');
    return data;
  } catch (error) {
    console.error('Delete Faculty Error:', error);
    throw error;
  }
};
export const getAllAdmins = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/accounts`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch admin list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get Admins Error:', error);
    throw error;
  }
};

export const createAdminAccount = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/create-admin`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || resData.message || 'Failed to create admin');
    return resData;
  } catch (error) {
    console.error('Create Admin Error:', error);
    throw error;
  }
};

export const resetAdminPassword = async (adminId, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reset-admin-password`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ admin_id: adminId, new_password: newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to reset password');
    return data;
  } catch (error) {
    console.error('Reset Admin Password Error:', error);
    throw error;
  }
};

export const deleteAdminAccount = async (adminId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete admin');
    return data;
  } catch (error) {
    console.error('Delete Admin Error:', error);
    throw error;
  }
};