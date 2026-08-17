import React, { useState } from 'react';
import { AuthUserProfile, signInWithGoogle, signInWithEmail, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await signInWithGoogle();
      if (res.user) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setMessage('');
    try {
      const res = await signInWithEmail(email.trim());
      if (res.user) {
        onSuccess(res.user);
        setMessage('Sign-in successful!');
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to send magic link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#020203]/90 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-[#050505] border border-[#00f0ff]/40 shadow-[0_0_50px_-12px_rgba(0,240,255,0.3)] text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-mono tracking-widest text-white/50 hover:text-[#00f0ff] transition-colors p-2"
          aria-label="Close dialog"
        >
          ✕ ESC
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 grid place-items-center rounded-full border border-[#00f0ff] font-mono font-black text-lg text-[#00f0ff] bg-[#00f0ff]/10">
            U
          </div>
          <div>
            <div className="font-black text-sm tracking-[0.18em] uppercase">UNIKORN<span className="text-[#00f0ff]">360</span></div>
            <div className="font-mono text-[0.6rem] tracking-[0.25em] text-white/40 uppercase">Executive Client Portal</div>
          </div>
        </div>

        <h3 className="font-sans text-2xl font-black uppercase tracking-tight mb-2 text-white">
          AUTHENTICATE <span className="text-transparent" style={{ WebkitTextStroke: '1px #00f0ff' }}>ACCESS</span>
        </h3>
        <p className="text-xs text-white/60 font-light leading-relaxed mb-6">
          Access your enterprise intelligence dashboard, private advisory transcripts, and custom compliance workflows.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] text-xs">
            {message}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 mb-4 bg-[#0e1015] hover:bg-white hover:text-black text-white border border-white/20 rounded-full font-sans text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-md group cursor-pointer"
        >
          <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>{isLoading ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest">or via email</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div>
            <label className="block font-mono text-[0.58rem] tracking-[0.2em] text-white/50 uppercase mb-1.5">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@company.com"
              className="w-full px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-[#00f0ff] transition-colors font-light"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#00f0ff] hover:bg-white text-black font-black text-xs tracking-widest uppercase rounded-full transition-all cursor-pointer"
          >
            {isLoading ? 'SENDING LINK...' : 'CONTINUE WITH EMAIL'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[0.65rem] text-white/40 font-mono">
          <span>{isSupabaseConfigured ? '⚡ SUPABASE ACTIVE' : '🔒 SECURE SANDBOX'}</span>
          <span>AES-512 ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};
