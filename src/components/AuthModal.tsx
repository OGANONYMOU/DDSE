// AuthModal.tsx - legacy modal (not used in main flow - AuthPage.tsx handles auth)
// Kept for compatibility
import { useState } from 'react';
import { X, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: 'super_admin' | 'evaluator' | 'directorate_officer') => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [appointment, setAppointment] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) { toast.error('Please enter your appointment'); return; }
    setLoading(true);
    setTimeout(() => {
      let role: 'super_admin' | 'evaluator' | 'directorate_officer' = 'directorate_officer';
      if (appointment.toLowerCase().includes('admin')) role = 'super_admin';
      else if (appointment.toLowerCase().includes('eval')) role = 'evaluator';
      setLoading(false);
      onLogin(role);
    }, 1200);
  };

  const reset = () => { setAppointment(''); setPassword(''); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={reset}/>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(4,6,22,0.98)', border: `1px solid ${C.dark}60`,
          boxShadow: `0 0 0 1px ${C.dark}30, 0 30px 80px ${C.dark}50` }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg,${C.red},${C.dark},${C.light})` }}/>
        <div className="p-8">
          <button onClick={reset} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
            <X className="w-5 h-5"/>
          </button>
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 mb-4"
              style={{ borderColor: C.light + '60', boxShadow: `0 0 20px ${C.dark}80` }}>
              <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
            </div>
            <h2 className="text-xl font-black text-white">DDSE Secure Access</h2>
            <p className="text-xs text-slate-500 mt-1 tracking-wider">DEFENSE DEPT. OF STANDARDS AND EVALUATION</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1.5">Appointment</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                <Input type="text" value={appointment} onChange={e=>setAppointment(e.target.value)}
                  placeholder="e.g. APP-78432"
                  className="pl-9 bg-slate-950/60 border border-slate-800 text-white placeholder:text-slate-700 focus:border-sky-500/60"/>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                <Input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-9 bg-slate-950/60 border border-slate-800 text-white placeholder:text-slate-700 focus:border-sky-500/60"/>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg,${C.dark},${C.light}cc)`, boxShadow: `0 4px 20px ${C.dark}80` }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Authenticating...</>
                : <>Login <ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
