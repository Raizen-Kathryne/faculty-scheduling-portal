import React, { useState, useEffect } from 'react';
import { 
  LogOut, Plus, Layers, Archive, FolderOpen, Pencil, Trash2, X, 
  Loader2, AlertCircle, Users, Search, Key, UserPlus, Shield, ShieldAlert, Menu
} from 'lucide-react';
import { 
  getAllSemesters, createSemester, updateSemester, deleteSemester, 
  getAllFacultyAdmin, createFacultyAccount, resetFacultyPassword, deleteFacultyAccount,
  getAllAdmins, createAdminAccount, resetAdminPassword, deleteAdminAccount
} from '../utils/admin';
import { getFacultyData } from '../utils/auth';
import AdminSemesterControl from '../components/AdminSemesterControl';

// --- REUSABLE RESPONSIVE MODAL ---
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/50"><X size={20}/></button>
        </div>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function AdminScreen({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('semesters'); 

  // --- SEMESTER STATE ---
  const [semesters, setSemesters] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [semViewMode, setSemViewMode] = useState('current');
  const [semFormData, setSemFormData] = useState({ semester_name: '', semester_code: '', academic_year: '', start_date: '', end_date: '' });
  const [semEditingId, setSemEditingId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  // --- FACULTY STATE ---
  const [facultyList, setFacultyList] = useState([]);
  const [showFacModal, setShowFacModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [facSearch, setFacSearch] = useState('');
  const [facFormData, setFacFormData] = useState({ faculty_name: '', email: '', department: '', username: '', password: '' });
  const [resetData, setResetData] = useState({ id: null, type: 'faculty', name: '', new_password: '' });
  const [facDeletingId, setFacDeletingId] = useState(null);

  // --- ADMIN MANAGEMENT STATE ---
  const [adminList, setAdminList] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', username: '', password: '' });
  const [adminDeletingId, setAdminDeletingId] = useState(null);

  // --- SHARED STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEPARTMENTS = ['COE', 'COED', 'CCS', 'CHAS', 'CBAA', 'CAS'];
  // Initial Load
  useEffect(() => {
    const user = getFacultyData(); 
    setCurrentUser(user);
    loadData(activeTab);
  }, [activeTab]);

  const loadData = (tab) => {
    if (tab === 'semesters') loadSemesters();
    if (tab === 'faculty') loadFaculty();
    if (tab === 'admins') loadAdmins();
  };

  // ==================== LOGIC HANDLERS (Same as before) ====================
  const loadSemesters = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSemesters();
      setSemesters(data.sort((a, b) => b.semester_id - a.semester_id));
    } catch (error) { alert(error.message); } 
    finally { setIsLoading(false); }
  };

  const validateSemForm = () => {
    const errors = {};
    if (!semFormData.semester_name || semFormData.semester_name.trim().length < 3) errors.semester_name = 'Name too short';
    if (!semFormData.semester_code) errors.semester_code = 'Code required';
    if (!semFormData.start_date) errors.start_date = 'Required';
    if (!semFormData.end_date) errors.end_date = 'Required';
    return errors;
  };

  const handleSemCreate = async () => {
    const errors = validateSemForm();
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
    if (!window.confirm("Create this semester?")) return;
    setIsSubmitting(true);
    try {
      await createSemester(semFormData);
      await loadSemesters(); 
      setShowCreateModal(false);
    } catch (e) { alert(e.message); loadSemesters(); } 
    finally { setIsSubmitting(false); }
  };

  const handleSemEdit = async () => {
    const errors = validateSemForm();
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
    if (!window.confirm("Save changes?")) return;
    setIsSubmitting(true);
    try {
      await updateSemester(semEditingId, semFormData);
      await loadSemesters();
      setShowEditModal(false);
    } catch (e) { alert(e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleSemDelete = async (id, isPlanned) => {
    if(!window.confirm(isPlanned ? "Cancel this planned semester?" : "Delete this archive?")) return;
    setDeletingId(id);
    try {
      await deleteSemester(id);
      setSemesters(prev => prev.filter(s => s.semester_id !== id));
    } catch(e) { alert(e.message); } 
    finally { setDeletingId(null); }
  };

  const filteredSemesters = semesters.filter(sem => 
    semViewMode === 'current' ? (sem.is_active || !sem.is_locked) : (!sem.is_active && sem.is_locked)
  );

  const loadFaculty = async () => {
    setIsLoading(true);
    try {
      const data = await getAllFacultyAdmin();
      setFacultyList(data);
    } catch (e) { alert(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createFacultyAccount(facFormData);
      alert("Faculty Account Created!");
      setShowFacModal(false);
      setFacFormData({ faculty_name: '', email: '', department: '', username: '', password: '' });
      loadFaculty();
    } catch (e) { alert(e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteFaculty = async (id, name) => {
    if(!window.confirm(`Remove "${name}"? This deletes their schedule and account.`)) return;
    setFacDeletingId(id);
    try {
      await deleteFacultyAccount(id);
      setFacultyList(prev => prev.filter(f => f.faculty_id !== id));
    } catch (e) { alert(e.message); } 
    finally { setFacDeletingId(null); }
  };

  const filteredFaculty = facultyList.filter(f => 
    f.faculty_name.toLowerCase().includes(facSearch.toLowerCase()) || 
    (f.username && f.username.toLowerCase().includes(facSearch.toLowerCase()))
  );

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAdmins();
      setAdminList(data);
    } catch (e) { alert(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAdminAccount(adminFormData);
      alert("New Admin Created!");
      setShowAdminModal(false);
      setAdminFormData({ name: '', email: '', username: '', password: '' });
      loadAdmins();
    } catch (e) { alert(e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (adminList.length <= 1) { alert("Action Blocked: You cannot delete the last admin account."); return; }
    if (currentUser && currentUser.id === id) { alert("Action Blocked: You cannot delete your own account while logged in."); return; }
    if(!window.confirm(`Delete Admin "${name}"?\n\nThis action cannot be undone.`)) return;
    
    setAdminDeletingId(id);
    try {
      await deleteAdminAccount(id);
      setAdminList(prev => prev.filter(a => a.admin_id !== id));
    } catch (e) { alert(e.message); } 
    finally { setAdminDeletingId(null); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if(!window.confirm(`Reset password for ${resetData.name}?`)) return;
    setIsSubmitting(true);
    try {
      if (resetData.type === 'faculty') await resetFacultyPassword(resetData.id, resetData.new_password);
      else await resetAdminPassword(resetData.id, resetData.new_password);
      alert("Password Reset Successfully.");
      setShowResetModal(false);
      setResetData({ id: null, type: 'faculty', name: '', new_password: '' });
    } catch (e) { alert(e.message); } 
    finally { setIsSubmitting(false); }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      
      {/* --- RESPONSIVE NAVBAR --- */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-lg">
        <div className="px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg text-sm sm:text-base">A</div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight">Admin<span className="hidden sm:inline"> Console</span></h1>
              <p className="text-[10px] sm:text-xs text-slate-400 sm:hidden">System Manager</p>
            </div>
          </div>
          
          <button onClick={onLogout} className="text-slate-400 hover:text-white px-2 py-2 rounded-lg text-xs sm:text-sm font-medium flex gap-2 items-center bg-slate-700/50 hover:bg-slate-700 transition-colors">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Scrollable Tabs for Mobile */}
        <div className="px-4 sm:px-8 pb-3 sm:pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('semesters')} className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'semesters' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>
              <Layers size={14}/>Semesters
            </button>
            <button onClick={() => setActiveTab('faculty')} className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'faculty' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>
              <Users size={14}/>Faculty
            </button>
            <button onClick={() => setActiveTab('admins')} className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'admins' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>
              <Shield size={14}/>Admins
            </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        
        {/* ==================== SEMESTERS TAB ==================== */}
        {activeTab === 'semesters' && (
          <div className="animate-in fade-in space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Layers className="text-indigo-400" /> Semesters</h2>
                <p className="text-sm text-slate-400 mt-1">Manage academic terms.</p>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700 w-full sm:w-auto">
                  <button onClick={() => setSemViewMode('current')} className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${semViewMode === 'current' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><FolderOpen size={16} /> Current</button>
                  <button onClick={() => setSemViewMode('archived')} className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${semViewMode === 'archived' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Archive size={16} /> Archive</button>
                </div>
                <button onClick={() => { setSemFormData({semester_name:'', semester_code:'', academic_year:'', start_date:'', end_date:''}); setValidationErrors({}); setSemEditingId(null); setShowCreateModal(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform w-full sm:w-auto"><Plus size={20} /> Create</button>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? <div className="text-center py-20 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2"/> Loading...</div> : 
                filteredSemesters.length === 0 ? <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed text-slate-500">No semesters found.</div> :
                filteredSemesters.map(sem => (
                  <div key={sem.semester_id} className={`p-4 sm:p-6 rounded-2xl border transition-all ${sem.is_active ? 'bg-slate-800 border-indigo-500/50 shadow-indigo-500/10 shadow-xl' : 'bg-slate-800/50 border-slate-700'}`}>
                    
                    {/* Top Row: Controls & Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div className="w-full sm:w-auto">
                        <AdminSemesterControl semester={sem} onRefresh={loadSemesters} />
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        {!sem.is_active && !sem.is_locked && (
                          <button onClick={() => { setSemFormData(sem); setSemEditingId(sem.semester_id); setShowEditModal(true); }} className="flex-1 sm:flex-none justify-center flex items-center gap-2 p-2 px-3 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
                            <Pencil size={16}/> <span className="sm:hidden">Edit</span>
                          </button>
                        )}
                        {!sem.is_active && (
                          <button onClick={() => handleSemDelete(sem.semester_id, !sem.is_locked)} disabled={deletingId === sem.semester_id} className="flex-1 sm:flex-none justify-center flex items-center gap-2 p-2 px-3 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
                            {deletingId === sem.semester_id ? <Loader2 size={16} className="animate-spin"/> : <><Trash2 size={16}/> <span className="sm:hidden">Delete</span></>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50 text-slate-300">
                      <div><span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Code</span><span className="text-sm">{sem.semester_code}</span></div>
                      <div><span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Year</span><span className="text-sm">{sem.academic_year}</span></div>
                      <div className="col-span-2"><span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Duration</span><span className="text-sm">{sem.start_date} — {sem.end_date}</span></div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ==================== FACULTY TAB ==================== */}
        {activeTab === 'faculty' && (
          <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Users className="text-indigo-400" /> Faculty</h2>
                <p className="text-sm text-slate-400 mt-1">Manage accounts & access.</p>
              </div>
              <button onClick={() => setShowFacModal(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"><UserPlus size={20} /> <span className="sm:hidden">New</span><span className="hidden sm:inline">Create Faculty</span></button>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    placeholder="Search faculty..." value={facSearch} onChange={e => setFacSearch(e.target.value)} />
                </div>
              </div>
              
              {/* Responsive Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300 min-w-[600px]">
                  <thead className="bg-slate-900/50 text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 sm:px-6 py-4">Profile</th>
                      <th className="px-4 sm:px-6 py-4">Username</th>
                      <th className="px-4 sm:px-6 py-4">Dept</th>
                      <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredFaculty.map(fac => (
                      <tr key={fac.faculty_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-bold text-white text-sm">{fac.faculty_name}</div>
                          <div className="text-xs text-slate-500">{fac.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4"><span className="bg-slate-700 border border-slate-600 px-2 py-1 rounded text-xs font-mono text-indigo-300">{fac.username}</span></td>
                        <td className="px-4 sm:px-6 py-4"><span className="bg-slate-700/50 px-2 py-1 rounded text-xs whitespace-nowrap">{fac.department}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setResetData({id: fac.faculty_id, type:'faculty', name: fac.faculty_name, new_password: ''}); setShowResetModal(true); }} className="text-slate-400 hover:text-indigo-400 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors"><Key size={16}/></button>
                            <button onClick={() => handleDeleteFaculty(fac.faculty_id, fac.faculty_name)} disabled={facDeletingId === fac.faculty_id} className="text-slate-400 hover:text-red-400 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors">{facDeletingId === fac.faculty_id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ADMINS TAB ==================== */}
        {activeTab === 'admins' && (
          <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Shield className="text-indigo-400" /> Admins</h2>
                <p className="text-sm text-slate-400 mt-1">Manage system administrators.</p>
              </div>
              <button onClick={() => setShowAdminModal(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"><UserPlus size={20} /> <span className="sm:hidden">New</span><span className="hidden sm:inline">Create Admin</span></button>
            </div>

            {adminList.length <= 1 && (
              <div className="bg-amber-900/20 border border-amber-700/50 p-4 rounded-xl flex items-start sm:items-center gap-3 text-amber-200">
                <ShieldAlert size={24} className="shrink-0 mt-1 sm:mt-0" />
                <p className="text-xs sm:text-sm"><strong>Safety Mode:</strong> You are the only admin. Account deletion is disabled.</p>
              </div>
            )}

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300 min-w-[600px]">
                  <thead className="bg-slate-900/50 text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 sm:px-6 py-4">Details</th>
                      <th className="px-4 sm:px-6 py-4">Username</th>
                      <th className="px-4 sm:px-6 py-4">Last Login</th>
                      <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {isLoading ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading...</td></tr> :
                      adminList.map(admin => {
                        const isSelf = currentUser && currentUser.id === admin.admin_id;
                        return (
                        <tr key={admin.admin_id} className={`transition-colors ${isSelf ? 'bg-indigo-900/20' : 'hover:bg-slate-700/30'}`}>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {admin.admin_name}
                              {isSelf && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">You</span>}
                            </div>
                            <div className="text-xs text-slate-500">{admin.email}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4"><span className="font-mono text-indigo-300 text-sm">{admin.username}</span></td>
                          <td className="px-4 sm:px-6 py-4 text-xs text-slate-400">{admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}</td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setResetData({id: admin.admin_id, type:'admin', name: admin.admin_name, new_password: ''}); setShowResetModal(true); }} className="text-slate-400 hover:text-indigo-400 bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors"><Key size={16}/></button>
                              <button onClick={() => handleDeleteAdmin(admin.admin_id, admin.admin_name)} disabled={isSelf || adminList.length <= 1 || adminDeletingId === admin.admin_id} className={`p-2 rounded transition-colors ${isSelf || adminList.length <= 1 ? 'text-slate-600 bg-slate-800/50 cursor-not-allowed' : 'text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700'}`}>
                                {adminDeletingId === admin.admin_id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS (Updated Styles) --- */}

      <Modal show={showCreateModal || showEditModal} onClose={() => { setShowCreateModal(false); setShowEditModal(false); }} title={showEditModal ? "Edit Semester" : "New Semester"}>
          <div className="p-6 space-y-4">
            {Object.keys(validationErrors).length > 0 && <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded text-sm">Please fix highlighted errors.</div>}
            <div><label className="text-xs font-bold text-slate-400 uppercase">Name</label><input className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. First Semester 2024" value={semFormData.semester_name} onChange={e => setSemFormData({...semFormData, semester_name: e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-400 uppercase">Code</label><input className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. 1-2024" value={semFormData.semester_code} onChange={e => setSemFormData({...semFormData, semester_code: e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase">Year</label><input className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. 2024-2025" value={semFormData.academic_year} onChange={e => setSemFormData({...semFormData, academic_year: e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-400 uppercase">Start</label><input type="date" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={semFormData.start_date} onChange={e => setSemFormData({...semFormData, start_date: e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase">End</label><input type="date" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={semFormData.end_date} onChange={e => setSemFormData({...semFormData, end_date: e.target.value})}/></div>
            </div>
            <button onClick={showEditModal ? handleSemEdit : handleSemCreate} disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-lg mt-2 shadow-lg">{isSubmitting ? "Processing..." : "Save Semester"}</button>
          </div>
      </Modal>

      <Modal show={showFacModal} onClose={() => setShowFacModal(false)} title="Create Faculty Account">
          <form onSubmit={handleCreateFaculty} className="p-6 space-y-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><input required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={facFormData.faculty_name} onChange={e => setFacFormData({...facFormData, faculty_name: e.target.value})}/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-400 uppercase">Email</label><input required type="email" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={facFormData.email} onChange={e => setFacFormData({...facFormData, email: e.target.value})}/></div>
              <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
              <select 
                required 
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none appearance-none" 
                value={facFormData.department} 
                onChange={e => setFacFormData({...facFormData, department: e.target.value})}
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
              <div><label className="text-xs font-bold text-slate-400 uppercase">Username</label><input required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={facFormData.username} onChange={e => setFacFormData({...facFormData, username: e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase">Password</label><input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={facFormData.password} onChange={e => setFacFormData({...facFormData, password: e.target.value})}/></div>
            </div>
            <button disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-lg mt-2 shadow-lg">Create Faculty</button>
          </form>
      </Modal>

      <Modal show={showAdminModal} onClose={() => setShowAdminModal(false)} title="Create Admin Account">
        <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
          <div className="bg-indigo-900/30 p-3 rounded border border-indigo-700/50 text-indigo-200 text-xs sm:text-sm">
            Admins have full access to manage semesters, faculty, and other admins.
          </div>
          <div><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><input required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-400 uppercase">Email</label><input required type="email" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={adminFormData.email} onChange={e => setAdminFormData({...adminFormData, email: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Username</label><input required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={adminFormData.username} onChange={e => setAdminFormData({...adminFormData, username: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Password</label><input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} /></div>
          </div>
          <button disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-lg mt-2 flex justify-center items-center gap-2 shadow-lg">
            {isSubmitting ? <Loader2 className="animate-spin"/> : "Create Admin"}
          </button>
        </form>
      </Modal>

      <Modal show={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password">
        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
          <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700/50 text-yellow-200 text-xs sm:text-sm flex gap-3">
            <AlertCircle size={20} className="shrink-0"/>
            <div>
              Resetting password for <b>{resetData.name}</b>.
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
            <input required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-3 text-white focus:border-indigo-500 outline-none" placeholder="Enter new secure password" value={resetData.new_password} onChange={e => setResetData({...resetData, new_password: e.target.value})} />
          </div>
          <button disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-lg mt-2 flex justify-center items-center gap-2 shadow-lg">
            {isSubmitting ? <Loader2 className="animate-spin"/> : "Confirm Reset"}
          </button>
        </form>
      </Modal>

    </div>
  );
}