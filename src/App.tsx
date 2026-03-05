import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import LoadingScreen   from './components/LoadingScreen';
import AuthPage        from './components/AuthPage';
import Dashboard       from './components/Dashboard';
import DirectorateDash from './components/DirectorateDash';
import SoldierDash     from './components/SoldierDash';

export type UserRole = 'super_admin' | 'evaluator' | 'directorate_officer' | 'base_soldier';

function App() {
  const [appState, setAppState] = useState<'loading'|'auth'|'dashboard'>('loading');
  const [userRole, setUserRole]   = useState<UserRole|null>(null);
  const [userAppt, setUserAppt]   = useState('');
  const [userName, setUserName]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('ddse_token');
    const role  = localStorage.getItem('ddse_role') as UserRole;
    const appt  = localStorage.getItem('ddse_appointment') || '';
    const name  = localStorage.getItem('ddse_name') || '';
    if (token && role) { setUserRole(role); setUserAppt(appt); setUserName(name); setAppState('dashboard'); }
  }, []);

  const handleLogin = (role: UserRole, appointment: string, name = '') => {
    setUserRole(role); setUserAppt(appointment); setUserName(name);
    localStorage.setItem('ddse_token', 'ddse_token');
    localStorage.setItem('ddse_role', role);
    localStorage.setItem('ddse_appointment', appointment);
    localStorage.setItem('ddse_name', name);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUserRole(null); setUserAppt(''); setUserName('');
    ['ddse_token','ddse_role','ddse_appointment','ddse_name'].forEach(k => localStorage.removeItem(k));
    setAppState('auth');
  };

  const dashProps = { userRole, appointment: userAppt, userName, onLogout: handleLogout };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background:'#03040f' }}>
      <Toaster position="top-right" theme="dark"
        toastOptions={{ style:{ background:'#0d1117', border:'1px solid #1800ad60', color:'#f1f5f9' } }}/>
      {appState === 'loading'   && <LoadingScreen onComplete={() => setAppState('auth')}/>}
      {appState === 'auth'      && <AuthPage onLogin={handleLogin}/>}
      {appState === 'dashboard' && (
        userRole === 'directorate_officer' ? <DirectorateDash {...dashProps}/> :
        userRole === 'base_soldier'        ? <SoldierDash     {...dashProps}/> :
                                             <Dashboard       {...dashProps}/>
      )}
    </div>
  );
}
export default App;
