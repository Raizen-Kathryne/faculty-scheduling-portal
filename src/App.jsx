// App.jsx
import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import FacultyScreen from './screens/FacultyScreen';
import AdminScreen from './screens/AdminScreen'; // NEW IMPORT

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  // Handle Login: Accepts userData and the target role ('admin' or 'faculty')
  const handleLogin = (userData, role = 'faculty') => {
    if (role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('faculty');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'admin':
        return <AdminScreen onLogout={() => setCurrentScreen('login')} />;
      case 'faculty':
        return <FacultyScreen onLogout={() => setCurrentScreen('login')} />;
      case 'login':
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans ${currentScreen === 'admin' ? 'bg-slate-900 selection:bg-indigo-500/30' : 'bg-green-500 selection:bg-green-200'}`}>
      
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {currentScreen === 'admin' ? (
          // Admin Dark Theme Background
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-3xl"></div>
          </>
        ) : (
          // Faculty Green Theme Background
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-green-400/30 rounded-full blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      {renderScreen()}
    </div>
  );
}