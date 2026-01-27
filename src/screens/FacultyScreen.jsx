// screens/FacultyScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Plus, Trash2, Clock, MapPin, X, Loader2, AlertCircle, 
  RefreshCw, LayoutGrid, Lock, Bell, Upload, FileDown, CheckCircle,
  FileSpreadsheet, CloudUpload, AlertTriangle
} from 'lucide-react';
import { 
  createDeclaration, getMySchedule, formatTimeForDisplay, 
  deleteDeclaration, getSemesters, downloadTemplate, uploadScheduleFile,
  getAllRoomsNoFilter // <--- ADD THIS LINE
} from '../utils/schedule';
import { getFacultyData, startTokenMonitoring, setTokenExpiryWarningCallback } from '../utils/auth';

export default function FacultyScreen({ onLogout }) {
  const [schedule, setSchedule] = useState([]);
  const [semesters, setSemesters] = useState([]); 
  const [facultyData, setFacultyData] = useState(null);
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  
  // --- NEW: Upload Modal States ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSemesterId, setUploadSemesterId] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // For drag visual feedback
  const fileInputRef = useRef(null);
  // --------------------------------

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [tokenWarning, setTokenWarning] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Function to fetch and open room modal
  const handleOpenRoomModal = async () => {
    setShowRoomModal(true);
    setIsLoadingRooms(true);
    try {
      const data = await getAllRoomsNoFilter();
      setRooms(data);
    } catch (err) {
      alert("Could not load rooms: " + err.message);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Function to select room
  const selectRoom = (roomName) => {
    setNewClass(prev => ({ ...prev, room: roomName }));
    setShowRoomModal(false);
  };

  // Filtered rooms based on search
  const filteredRooms = rooms.filter(r => 
    `${r.building_name} ${r.room_name}`.toLowerCase().includes(roomSearch.toLowerCase())
  );

  // Form State
  const [newClass, setNewClass] = useState({
    subject: '', section: '', day: 'Monday', startTime: '', endTime: '', room: '', semesterId: '' 
  });

  // Initial Load & Token Monitoring
  useEffect(() => {
    const data = getFacultyData();
    if (data) setFacultyData(data);
    loadData();
    
    const cleanup = startTokenMonitoring();
    setTokenExpiryWarningCallback((minutesRemaining) => {
      if (minutesRemaining <= 5) {
        setTokenWarning(`Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Please save your work.`);
      }
    });
    
    return cleanup;
  }, []);

  useEffect(() => {
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const schedData = await getMySchedule();
      
      const formatted = schedData.map(item => ({
        id: item.declaration_id,
        subject: item.subject_code || 'N/A',
        section: item.class_section || '', 
        term: item.semester_name, 
        day: item.day_of_week,
        startTime: formatTimeForDisplay(item.time_start),
        endTime: formatTimeForDisplay(item.time_end),
        room: `${item.building_name} ${item.room_name}`, 
        status: item.declaration_status,
        is_active: item.is_active,
        is_locked: item.is_locked
      }));
      
      setSchedule(formatted);
      const semData = await getSemesters();
      setSemesters(semData);
    } catch (error) {
      setLoadError("Could not load data. " + error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    loadData();
    refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), 2000);
  };
  
  const analyzeErrors = (errors) => {
    if (!errors || !Array.isArray(errors)) return { missingColumns: [], specificErrors: [] };
    
    const missingSet = new Set();
    const specificErrors = [];

    errors.forEach(err => {
      // Check for "Missing required field: fieldname" pattern
      if (typeof err === 'string' && err.includes('Missing required field')) {
        const parts = err.split(':');
        const fieldName = parts[parts.length - 1].trim();
        missingSet.add(fieldName);
      } else {
        specificErrors.push(err);
      }
    });

    return {
      missingColumns: Array.from(missingSet),
      specificErrors: specificErrors
    };
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.match(/\.(csv|xlsx|xls)$/)) {
        setUploadFile(droppedFile);
      } else {
        alert("Invalid file type. Please upload a CSV or Excel file.");
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch (err) {
      alert("Failed to download template: " + err.message);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadSemesterId) return;
    
    setUploadStatus('uploading');
    setUploadResult(null);
    
    try {
      const result = await uploadScheduleFile(uploadFile, uploadSemesterId);
      setUploadResult(result);
      setUploadStatus('success');
      await loadData(); 
    } catch (error) {
      console.error("Caught upload error:", error);
      setUploadStatus('error');
      
      setUploadResult({
        error: "Upload Failed",
        message: error.message || "The file structure is incorrect.",
        errors: error.validationErrors && error.validationErrors.length > 0 ? error.validationErrors : null
      });
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadStatus(null);
    setUploadResult(null);
    setIsDragging(false);
  };

  const openAddModal = () => {
    setNewClass({ subject: '', section: '', day: 'Monday', startTime: '', endTime: '', room: '', semesterId: '' });
    setSubmitError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (!newClass.room || !newClass.startTime || !newClass.endTime || !newClass.subject || !newClass.section || !newClass.semesterId) {
        throw new Error("Please fill in all required fields.");
      }
      if (newClass.startTime >= newClass.endTime) {
        throw new Error("Start time must be before End time.");
      }
      const formatTimeForApi = (t) => t.length === 5 ? `${t}:00` : t;
      const submissionData = { ...newClass, startTime: formatTimeForApi(newClass.startTime), endTime: formatTimeForApi(newClass.endTime) };
      await createDeclaration(submissionData);
      await loadData(); 
      setShowAddModal(false);
    } catch (error) {
      setSubmitError(error.message); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Remove this schedule?")) return;
    try {
      await deleteDeclaration(id);
      setSchedule(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err.message); 
    }
  };
  
  const getSubjectColor = (subject) => {
    const colors = ['bg-pink-600', 'bg-purple-600', 'bg-indigo-600', 'bg-blue-600', 'bg-teal-600', 'bg-emerald-600', 'bg-orange-600', 'bg-red-600'];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getGridPosition = (day, time) => {
    const normalizedDay = day.trim().toLowerCase();
    const days = ['time', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbreviations = { 'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday', 'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday' };
    const fullDay = dayAbbreviations[normalizedDay] || normalizedDay;
    const colIndex = days.indexOf(fullDay);
    if (colIndex === -1) return null;
    const timeParts = time.split(':');
    if (timeParts.length < 2) return null;
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    const rowIndex = Math.floor(((h - 6) * 60 + m) / 30) + 2;
    return { colIndex: colIndex + 1, rowIndex };
  };

  const getDurationSpan = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.ceil(((eh * 60 + em) - (sh * 60 + sm)) / 30);
  };

  const visibleSchedule = schedule.filter(item => item.is_active === 1 || item.is_locked === 0);
  const { missingColumns, specificErrors } = uploadResult && uploadResult.errors 
    ? analyzeErrors(uploadResult.errors) 
    : { missingColumns: [], specificErrors: [] };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
            {facultyData?.faculty_name?.charAt(0) || 'F'}
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-gray-800">
              {facultyData?.faculty_name || 'Faculty'}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {facultyData?.department || 'Department'}
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="text-red-600 hover:bg-red-50 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Schedule</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              {visibleSchedule.length} classes scheduled
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={isLoading || isRefreshing} 
              className="p-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              <span className="ml-2 text-xs sm:hidden">Refresh</span>
            </button>
            
            <button 
              onClick={() => setShowUploadModal(true)} 
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs sm:text-sm"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
            
            <button 
              onClick={() => setShowWeeklyModal(true)} 
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-sm text-xs sm:text-sm"
            >
              <LayoutGrid size={16} />
              <span>Weekly</span>
            </button>
            
            <button 
              onClick={openAddModal} 
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 text-xs sm:text-sm"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {loadError && (<div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex gap-2 border border-red-100"><AlertCircle /> {loadError}</div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!isLoading && visibleSchedule.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"><p className="text-lg font-semibold mb-2">No schedules found</p><p className="text-sm">Click "Add Schedule" or "Import" to create your first entry</p></div>}
          {visibleSchedule.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase">{item.day}</span>
                {item.is_locked ? <div className="text-gray-300"><Lock size={16} /></div> : <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>}
              </div>
              
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-lg text-gray-800">{item.subject}</h3>
                {item.section && <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{item.section}</span>}
              </div>
              
              <p className="text-xs text-gray-500 mb-3">{item.term}</p>
              <div className="space-y-2 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Clock size={15} className="text-emerald-500" /><span>{item.startTime} - {item.endTime}</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={15} className="text-emerald-500" /><span className="truncate">{item.room}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Upload size={20} className="text-emerald-600"/> Import Schedule</h3>
              <button onClick={closeUploadModal}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!uploadResult ? (
                <div className="space-y-5">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1"><FileDown size={16} /></div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Download Template</p>
                      <p className="text-xs text-blue-700 mt-1">Use our standard CSV/Excel template to avoid errors.<button onClick={handleDownloadTemplate} className="ml-1 underline font-bold hover:text-blue-900">Click here to download.</button></p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Semester</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={uploadSemesterId} onChange={(e) => setUploadSemesterId(e.target.value)}>
                      <option value="">-- Select Semester --</option>
                      {semesters.filter(sem => !sem.is_locked).map(sem => (<option key={sem.semester_id} value={sem.semester_id}>{sem.semester_name}</option>))}
                    </select>
                  </div>
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'} ${uploadFile ? 'bg-emerald-50 border-emerald-200' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileSelect}/>
                    {uploadFile ? (<><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><FileSpreadsheet size={24} /></div><div><p className="font-bold text-emerald-800 text-sm">{uploadFile.name}</p></div></>) : (<><div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors"><CloudUpload size={24} /></div><div><p className="font-semibold text-gray-600 text-sm">Click to upload or drag and drop</p></div></>)}
                  </div>
                  <button onClick={handleUploadSubmit} disabled={!uploadFile || !uploadSemesterId || uploadStatus === 'uploading'} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md flex justify-center items-center gap-2 transition-colors mt-2">
                    {uploadStatus === 'uploading' ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : "Upload Schedule"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className={`p-5 rounded-xl border flex items-start gap-3 ${uploadStatus === 'success' || uploadStatus === 'partial' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                     <div className={`p-2 rounded-full ${uploadStatus === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>{uploadStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}</div>
                     <div><p className="font-bold text-lg">{uploadResult.message || "Upload Completed"}</p>{uploadResult.summary && (<div className="flex gap-4 mt-2 text-sm"><span className="bg-white/50 px-2 py-1 rounded">✅ {uploadResult.summary.successful} Added</span><span className="bg-white/50 px-2 py-1 rounded">❌ {uploadResult.summary.failed} Failed</span></div>)}</div>
                  </div>

                  {missingColumns.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-amber-600" size={18}/>
                        <p className="font-bold text-amber-900 text-sm">Missing or Renamed Columns</p>
                      </div>
                      <p className="text-xs text-amber-800 mb-3">
                        The following required columns were not found in your file. Please check your headers against the template.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {missingColumns.map(col => (
                          <span key={col} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-mono font-bold border border-amber-200">
                            {col}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-amber-200/50">
                        <button onClick={handleDownloadTemplate} className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
                          <FileDown size={14}/> Download Correct Template
                        </button>
                      </div>
                    </div>
                  )}

                  {specificErrors.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Detailed Error Log</p>
                        <span className="text-xs text-gray-400">{specificErrors.length} issues</span>
                      </div>
                      <div className="bg-white max-h-48 overflow-y-auto p-0">
                        {specificErrors.map((err, idx) => (
                          <div key={idx} className="px-4 py-2 text-xs font-mono text-red-600 border-b border-gray-100 last:border-0 hover:bg-red-50 flex items-start gap-2">
                             <span className="mt-0.5">•</span>
                             <span className="break-all">{typeof err === 'string' ? err : JSON.stringify(err)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={closeUploadModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition-colors">
                    {uploadStatus === 'success' ? "Finish" : "Close & Try Again"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- WEEKLY MODAL (FIXED) --- */}
      {showWeeklyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid size={20} className="sm:hidden" />
                <LayoutGrid size={24} className="hidden sm:block text-emerald-600" />
                <span className="hidden sm:inline">Weekly Class Schedule</span>
                <span className="sm:hidden">Weekly Schedule</span>
              </h3>
              <button 
                onClick={() => setShowWeeklyModal(false)} 
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="sm:hidden text-gray-500" />
                <X size={24} className="hidden sm:block text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-2 sm:p-6 bg-gray-50">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-auto">
                
                {/* FIXED HERE: Added 'relative' class to the grid container.
                   This ensures absolute children position themselves based on this grid, 
                   not the whole screen.
                */}
                <div className="relative grid grid-cols-[50px_repeat(7,minmax(70px,1fr))] sm:grid-cols-[80px_repeat(7,1fr)] bg-gray-200 gap-px border border-gray-200 min-w-[600px]">
                  
                  <div className="bg-gray-100 p-2 sm:p-3 text-center text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 left-0 z-20">
                    Time
                  </div>
                  
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="bg-emerald-50/50 p-2 sm:p-3 text-center text-[10px] sm:text-sm font-bold text-gray-700 sticky top-0 z-10">
                      <span className="sm:hidden">{day}</span>
                      <span className="hidden sm:inline">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]}
                      </span>
                    </div>
                  ))}
                  
                  {Array.from({ length: 33 }).map((_, i) => { 
                    const hour = Math.floor(i / 2) + 6;
                    const min = (i % 2) * 30;
                    return (
                      <React.Fragment key={i}>
                        <div className="bg-white p-1 sm:p-2 text-right text-[9px] sm:text-xs text-gray-400 font-mono border-r border-gray-100 h-10 sm:h-12 flex items-center justify-end sticky left-0 z-10">
                          {min === 0 && (
                            <span>{hour.toString().padStart(2, '0')}:{min.toString().padStart(2, '0')}</span>
                          )}
                        </div>
                        
                        {Array.from({ length: 7 }).map((_, d) => (
                          <div key={d} className="bg-white h-10 sm:h-12 border-b border-dashed border-gray-100" />
                        ))}
                      </React.Fragment>
                    );
                  })}
                  
                  {visibleSchedule.map((item) => {
                    const pos = getGridPosition(item.day, item.startTime);
                    if (!pos) return null;
                    const span = getDurationSpan(item.startTime, item.endTime);
                    const colorClass = getSubjectColor(item.subject);
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`absolute mx-0.5 sm:mx-1 rounded-md sm:rounded-lg shadow-md border-l-2 sm:border-l-4 text-white overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer z-30 flex flex-col justify-center p-1 sm:p-2 ${item.is_locked ? colorClass : 'bg-yellow-500 border-yellow-600'}`}
                        style={{ 
                          gridColumnStart: pos.colIndex, 
                          gridColumnEnd: 'span 1', 
                          gridRowStart: pos.rowIndex, 
                          gridRowEnd: `span ${span}`,
                          width: 'calc(100% - 4px)',
                          minHeight: '100%'
                        }}
                      >
                        <div className="font-bold text-[9px] sm:text-xs md:text-sm leading-tight truncate">
                          {item.subject}
                        </div>
                        <div className="text-[8px] sm:text-[10px] md:text-xs opacity-90 mt-0.5 sm:mt-1 truncate">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="text-[8px] sm:text-[10px] md:text-xs font-mono bg-black/20 rounded px-1 sm:px-1.5 py-0.5 mt-auto w-fit truncate">
                          {item.room.split(' ').pop()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Add New Class</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              
              {submitError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200 animate-in slide-in-from-top-1">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Cannot Add Schedule</p>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Semester</label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={newClass.semesterId} onChange={e => setNewClass({...newClass, semesterId: e.target.value})}>
                  <option value="" disabled>-- Select a semester --</option>
                  {semesters.filter(sem => !sem.is_locked).map(sem => (<option key={sem.semester_id} value={sem.semester_id}>{sem.semester_name}</option>))}
                </select>
                <p className="text-xs text-gray-500 mt-1">You can only add classes to pending semesters.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Subject Code</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. CPP106" value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Section</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 2CPEA" value={newClass.section} onChange={e => setNewClass({...newClass, section: e.target.value})}/>
                </div>
              </div>

              <div><label className="block text-sm font-bold text-gray-700 mb-1">Day</label><select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={newClass.day} onChange={e => setNewClass({...newClass, day: e.target.value})}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (<option key={d} value={d}>{d}</option>))}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label><input type="time" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={newClass.startTime} onChange={e => setNewClass({...newClass, startTime: e.target.value})}/></div><div><label className="block text-sm font-bold text-gray-700 mb-1">End Time</label><input type="time" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={newClass.endTime} onChange={e => setNewClass({...newClass, endTime: e.target.value})}/></div></div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Room Name</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="e.g. Comlab 1" 
                    value={newClass.room} 
                    onChange={e => setNewClass({...newClass, room: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={handleOpenRoomModal}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <MapPin size={14} />
                    Show Rooms
                  </button>
                </div>
              </div>
              
              <button onClick={handleAddSubmit} disabled={isSubmitting || !newClass.semesterId} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md mt-2 flex justify-center items-center gap-2 transition-colors">{isSubmitting ? <Loader2 className="animate-spin" /> : "Save Schedule"}</button>
            </div>
          </div>
        </div>
      )}
      {showRoomModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Select Room</h3>
            <button onClick={() => setShowRoomModal(false)}><X size={20} /></button>
          </div>
          
          <div className="p-4 border-b">
            <div className="relative">
              <input 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Search room or building..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
              />
              <LayoutGrid className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingRooms ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Loader2 className="animate-spin mb-2" />
                <p className="text-sm">Fetching rooms...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <p className="text-center py-10 text-gray-500 text-sm">No rooms found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filteredRooms.map((room) => (
                <button
                  key={room.room_id}
                  // CHANGE THIS LINE: Remove building_name from the argument
                  onClick={() => selectRoom(room.room_name)} 
                  className="flex flex-col items-start p-3 hover:bg-emerald-50 rounded-xl transition-colors text-left border border-transparent hover:border-emerald-100 group"
                >
                  <span className="font-bold text-gray-800 group-hover:text-emerald-700">
                    {room.room_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {room.building_name}
                  </span>
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}