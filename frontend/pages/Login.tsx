import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Music, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await login(email);
    } catch (error) {
      console.error("Auth failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-white/[0.02] rounded-full blur-[100px]"></div>
      </div>
      <div className="relative z-10 w-full max-w-[400px] p-4">
        <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden ring-1 ring-white/5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <Music size={32} className="text-black" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Sign In
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Enter your email to continue.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all font-medium text-sm"
                  placeholder="name@domain.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-gray-200 hover:scale-[1.01] transition-all shadow-[0_0_25px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
