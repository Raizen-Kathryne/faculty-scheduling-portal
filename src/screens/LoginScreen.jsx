import React, { useState, useEffect } from 'react';
import { User, Lock, School, X, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { loginFaculty, loginAdmin } from '../utils/auth';

export default function LoginScreen({ onLogin }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');
  
  // State to track if we are logging in as Admin or Faculty
  const [isAdminMode, setIsAdminMode] = useState(false); 

  const [credentials, setCredentials] = useState({ username: '', password: '' });

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      // Use the appropriate login function based on mode
      if (isAdminMode) {
        response = await loginAdmin(credentials.username, credentials.password);
      } else {
        response = await loginFaculty(credentials.username, credentials.password);
      }
      
      setShowModal(false);
      // Pass the user data and role to parent component
      onLogin(response.user || response.faculty, isAdminMode ? 'admin' : 'faculty'); 
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to open the modal in the correct mode
  const openLoginModal = (mode) => {
    setIsAdminMode(mode === 'admin');
    setCredentials({ username: '', password: '' }); // Reset form
    setError('');
    setShowModal(true);
  };

  // Dynamic Theme Colors based on mode (Green for Faculty, Indigo for Admin)
  const theme = isAdminMode 
    ? { 
        bg: 'bg-indigo-600', 
        hover: 'hover:bg-indigo-700', 
        text: 'text-indigo-600',
        lightBg: 'bg-indigo-50',
        border: 'border-indigo-500'
      }
    : { 
        bg: 'bg-emerald-600', 
        hover: 'hover:bg-emerald-700', 
        text: 'text-emerald-600',
        lightBg: 'bg-emerald-50',
        border: 'border-emerald-500'
      };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">
      
      {/* Main Card */}
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-in fade-in zoom-in duration-300">
        
        {/* Left Side: Branding */}
        <div className="md:w-5/12 p-8 md:p-12 flex flex-col items-center justify-center text-center border-b md:border-r border-gray-100 bg-gradient-to-b from-white to-gray-50">
          <div className="w-48 h-48 md:w-56 md:h-56 relative mb-6 group transition-transform hover:scale-105 duration-500">
            <div className="absolute inset-0 bg-emerald-600 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
            <div className="w-full h-full rounded-full border-4 border-emerald-500 bg-white flex items-center justify-center shadow-lg relative overflow-hidden">
               <div className="flex flex-col items-center justify-center text-emerald-800">
                  <School size={64} strokeWidth={1.5} />
               </div>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-700 leading-tight">
            University<br />
            <span className="text-emerald-600">Portal Access</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">Secure Schedule Management</p>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-gray-50/50">
          <div className="mb-10 text-center md:text-left">
             <p className="text-gray-500 font-semibold text-lg">
               {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
             </p>
             <p className="text-5xl font-black text-gray-700 tracking-tighter">
               {currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
             </p>
          </div>

          <div className="space-y-4">
            {/* BUTTON 1: FACULTY LOGIN */}
            <button 
              onClick={() => openLoginModal('faculty')}
              className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-4 text-lg font-bold"
            >
              <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <User size={24} />
              </div>
              <div className="flex-1 text-left">
                <div>Faculty Login</div>
                <div className="text-xs font-normal opacity-80">Manage your schedule</div>
              </div>
            </button>

            {/* BUTTON 2: ADMIN LOGIN */}
            <button 
              onClick={() => openLoginModal('admin')}
              className="group w-full bg-white border-2 border-indigo-100 hover:border-indigo-500 text-indigo-700 hover:bg-indigo-50 p-4 rounded-xl transition-all flex items-center gap-4 text-lg font-bold"
            >
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1 text-left">
                <div>Admin Console</div>
                <div className="text-xs font-normal text-gray-500">System management</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative m-4 animate-in slide-in-from-bottom-10 zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
            
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${theme.lightBg} ${theme.text} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {isAdminMode ? <ShieldCheck size={32} /> : <Lock size={32} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{isAdminMode ? 'Admin Access' : 'Faculty Access'}</h3>
              <p className="text-gray-500 text-sm">Please enter your credentials</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2"><AlertCircle size={18}/>{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAdminMode ? 'Username' : 'Email or Username'}
                </label>
                <input 
                  type="text" 
                  value={credentials.username} 
                  onChange={e => setCredentials({...credentials, username: e.target.value})} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder={isAdminMode ? "e.g. admin" : "e.g. faculty@university.edu"} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={credentials.password} 
                  onChange={e => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="••••••••" 
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading} 
                className={`w-full ${theme.bg} ${theme.hover} text-white font-bold py-3 rounded-lg shadow-md mt-6 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (isAdminMode ? 'Enter Console' : 'Login')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}