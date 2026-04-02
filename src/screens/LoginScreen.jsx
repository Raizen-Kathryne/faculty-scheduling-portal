import React, { useState, useEffect } from 'react';
import { User, Lock, X, AlertCircle, ShieldCheck, Loader2, Eye, EyeOff, Calendar, Clock } from 'lucide-react'; 
import { loginFaculty, loginAdmin } from '../utils/auth';

const redirect_BASE_URL = import.meta.env.VITE_WEB_REDIRECT;

export default function LoginScreen({ onLogin, onOpenSchedules }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');
  
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); 

  const [credentials, setCredentials] = useState({ username: '', password: '' });

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
    if (isAdminMode) {
      response = await loginAdmin(credentials.username, credentials.password);
    } else {
      response = await loginFaculty(credentials.username, credentials.password);
    }

    setShowModal(false);

    // ADD THIS: verify token actually saved before switching screens
    const waitForToken = () => new Promise((resolve) => {
      const check = () => {
        const token = localStorage.getItem('token');
        if (token) {
          resolve();
        } else {
          setTimeout(check, 50); // retry every 50ms
        }
      };
      check();
    });

    await waitForToken(); // wait until token is confirmed in localStorage

    onLogin(response.user || response.faculty, isAdminMode ? 'admin' : 'faculty');

  } catch (err) {
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const openLoginModal = (mode) => {
    setIsAdminMode(mode === 'admin');
    setCredentials({ username: '', password: '' }); 
    setShowPassword(false); 
    setError('');
    setShowModal(true);
  };

  const theme = isAdminMode 
    ? { bg: 'bg-indigo-700', hover: 'hover:bg-indigo-800', text: 'text-indigo-700', lightBg: 'bg-indigo-50', focusRing: 'focus:ring-indigo-500' }
    : { bg: 'bg-emerald-700', hover: 'hover:bg-emerald-800', text: 'text-emerald-700', lightBg: 'bg-emerald-50', focusRing: 'focus:ring-emerald-600' };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 lg:p-6 relative overflow-y-auto md:overflow-hidden font-sans">
      {/* Background Wallpaper */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('/classroom.jpg')" }}
      >
        <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-fit md:min-h-[550px] animate-in fade-in zoom-in duration-500 border border-white/20 mb-8 md:mb-0">
        
        {/* Left Side: Branding & Date/Time */}
        <div className="w-full md:w-5/12 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 bg-white/50">
          
          {/* Pulsing Logo */}
          <div 
            onClick={() => window.open(redirect_BASE_URL, '_self')}
            className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 relative mb-4 md:mb-6 group transition-transform hover:scale-105 duration-500 cursor-pointer flex items-center justify-center"
            title="Click to Navigate PNC Campus"
          >
            {/* Green Ping Animation */}
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Static Glow */}
            <div className="absolute inset-0 bg-emerald-600 rounded-full opacity-15 blur-2xl group-hover:opacity-25 transition-opacity"></div>
            
            <div className="w-full h-full flex items-center justify-center relative z-10">
               <img src="/pnc.png" alt="PNC Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-emerald-900 leading-tight uppercase tracking-tight">
            Click to Navigate<br />
            <span className="text-emerald-600">PNC Campus</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6 mt-1">Official Faculty Portal</p>
          
          <div className="mt-2 md:mt-0 w-full flex flex-col items-center justify-center border-t border-emerald-100/50 pt-4">
             <div className="flex items-center gap-2 text-emerald-800/70 mb-1">
                <Calendar size={14} className="md:w-[16px] md:h-[16px]" />
                <p className="font-bold text-xs md:text-sm uppercase tracking-wider">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
             </div>
             <div className="flex items-center gap-2 md:gap-3 text-gray-800">
                <Clock className="text-emerald-600 w-5 h-5 md:w-7 md:h-7" />
                <p className="text-3xl sm:text-4xl md:text-4xl font-black tracking-tighter">
                  {currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
             </div>
          </div>
        </div>

        {/* Right Side: QR Code & Action Buttons */}
        <div className="w-full md:w-7/12 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center bg-gray-50/30">
          
          {/* QR Code */}
          <div className="hidden md:flex w-full max-w-[280px] bg-white border border-gray-100 rounded-[2rem] p-0 flex-col items-center mb-8 overflow-hidden">
            <div className="w-full py-3 flex flex-col items-center justify-center">
              <p className="text-[14px] font-black text-gray-600 uppercase tracking-[0.2em]">Scan for Access</p>
            </div>
            
            <div className="w-56 h-56 flex items-center justify-center bg-white">
              <img 
                src="/qrcode.png" 
                alt="Portal QR Code" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="w-full py-3 text-center">
               <p className="text-[13px] text-gray-600 font-bold uppercase tracking-widest">
                 Wifi: <span className="text-gray-800">Group 19 Kiosk</span>
               </p>
            </div>
          </div>

          <div className="grid gap-3 w-full max-w-sm md:max-w-md mx-auto">
            <button 
              onClick={() => openLoginModal('faculty')}
              className="group w-full bg-emerald-700 hover:bg-emerald-800 text-white p-3 md:p-4 rounded-xl shadow-lg hover:shadow-emerald-900/20 transition-all flex items-center gap-3 md:gap-4"
            >
              <div className="bg-white/10 p-2 md:p-3 rounded-lg group-hover:bg-white/20 transition-colors">
                <User className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base md:text-lg font-bold uppercase tracking-tight">Faculty Login</div>
                <div className="text-xs font-medium opacity-70 italic">Manage your classroom schedule</div>
              </div>
            </button>

            <button 
              onClick={() => openLoginModal('admin')}
              className="group w-full bg-white border-2 border-gray-200 hover:border-indigo-600 text-gray-700 hover:text-indigo-700 p-3 md:p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 md:gap-4"
            >
              <div className="bg-gray-100 p-2 md:p-3 rounded-lg text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base md:text-lg font-bold uppercase tracking-tight">Admin Console</div>
                <div className="text-xs font-medium text-gray-400">System maintenance & logs</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
            
            <div className="text-center mb-5 mt-2 sm:mt-0">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 ${theme.lightBg} ${theme.text} rounded-2xl flex items-center justify-center mx-auto mb-3 -rotate-3 transition-transform hover:rotate-0 duration-300`}>
                {isAdminMode ? <ShieldCheck size={28} /> : <Lock size={28} />}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">{isAdminMode ? 'ADMIN ACCESS' : 'FACULTY ACCESS'}</h3>
              <p className="text-gray-500 text-xs font-medium">Verify credentials to continue</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs sm:text-sm font-bold flex gap-2 animate-pulse"><AlertCircle size={18}/>{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 ml-1">{isAdminMode ? 'Username' : 'Employee ID'}</label>
                <input 
                  type="text" 
                  value={credentials.username} 
                  onChange={e => setCredentials({...credentials, username: e.target.value})} 
                  className={`w-full px-4 py-2.5 sm:px-4 sm:py-3 text-sm rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:ring-4 ${theme.focusRing} outline-none transition-all font-medium`} 
                  placeholder={isAdminMode ? "admin_root" : "2024-XXXX"} 
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={credentials.password} 
                    onChange={e => setCredentials({...credentials, password: e.target.value})}
                    className={`w-full px-4 py-2.5 sm:px-4 sm:py-3 text-sm rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:ring-4 ${theme.focusRing} outline-none pr-12 transition-all font-medium`} 
                    placeholder="••••••••" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading} 
                className={`w-full ${theme.bg} ${theme.hover} text-white font-black py-3 text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-900/20 mt-2 flex justify-center items-center gap-2 disabled:opacity-50 uppercase tracking-widest transition-all active:scale-95`}
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <p 
        className="z-10 w-full text-center px-4 left-0"
        style={{ 
          position: 'absolute', 
          bottom: 24, 
          color: 'rgba(255,255,255,0.7)', 
          fontSize: 11, 
          letterSpacing: 2, 
          fontWeight: 700,
          textTransform: 'uppercase'
        }}
      >
        © 2026 CpE Group 19 - Pamantasan ng Cabuyao
      </p>
    </div>
  );
}
