// utils/professors.js
// No auth required — public schedule viewer accessible by anyone.

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// 1. GET ALL PROFESSORS
//    Endpoint: GET /api/admin/faculty/all
// ---------------------------------------------------------------------------
export const getAllProfessors = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/faculty/all`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Failed to fetch professors');
    }
    return await response.json();
  } catch (error) {
    console.error('Get all professors error:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 2. GET SCHEDULE FOR A SINGLE PROFESSOR
//    Endpoint: GET /api/admin/faculty/:facultyId/schedule
// ---------------------------------------------------------------------------
export const getProfessorSchedule = async (facultyId, semesterId = null) => {
  try {
    let url = `${API_BASE_URL}/admin/faculty/${facultyId}/schedule`;
    if (semesterId) url += `?semester_id=${semesterId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) throw new Error('Professor not found.');
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || 'Failed to fetch schedule');
    }

    return await response.json();
  } catch (error) {
    console.error(`Get schedule for faculty ${facultyId} error:`, error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
export const formatTimeForDisplay = (timeString) => {
  if (!timeString) return '';
  return timeString.substring(0, 5);
};

export const groupScheduleByDay = (schedules) => {
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grouped = {};
  DAY_ORDER.forEach((day) => { grouped[day] = []; });
  schedules.forEach((entry) => {
    if (grouped[entry.day_of_week] !== undefined) grouped[entry.day_of_week].push(entry);
  });
  Object.keys(grouped).forEach((day) => {
    grouped[day].sort((a, b) => a.time_start.localeCompare(b.time_start));
  });
  return grouped;
};

export const filterByDepartment = (professors, department) => {
  if (!department) return professors;
  return professors.filter((p) => p.department?.toLowerCase() === department.toLowerCase());
};