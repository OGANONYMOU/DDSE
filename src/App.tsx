import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import LoadingScreen from './components/LoadingScreen';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

export type UserRole = 'super_admin' | 'evaluator' | 'directorate_officer';

function App() {
  const [appState, setAppState] = useState<'loading' | 'auth' | 'dashboard'>('loading');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userAppointment, setUserAppointment] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('ddse_token');
    const role  = localStorage.getItem('ddse_role') as UserRole;
    const appt  = localStorage.getItem('ddse_appointment') || '';
    if (token && role) {
      setUserRole(role);
      setUserAppointment(appt);
      setAppState('dashboard');
    }
  }, []);

  const handleLoadingComplete = () => setAppState('auth');

  const handleLogin = (role: UserRole, appointment: string) => {
    setUserRole(role);
    setUserAppointment(appointment);
    localStorage.setItem('ddse_token', 'ddse_secure_token');
    localStorage.setItem('ddse_role', role);
    localStorage.setItem('ddse_appointment', appointment);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserAppointment('');
    localStorage.removeItem('ddse_token');
    localStorage.removeItem('ddse_role');
    localStorage.removeItem('ddse_appointment');
    setAppState('auth');
  };

  return (
    <div className="min-h-screen bg-[#03040f] text-slate-100 font-sans antialiased">
      <Toaster position="top-right" theme="dark"
        toastOptions={{ style: { background: '#0d1117', border: '1px solid #1800ad60', color: '#f1f5f9' } }} />
      {appState === 'loading'    && <LoadingScreen onComplete={handleLoadingComplete} />}
      {appState === 'auth'       && <AuthPage onLogin={handleLogin} />}
      {appState === 'dashboard'  && <Dashboard userRole={userRole} appointment={userAppointment} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
