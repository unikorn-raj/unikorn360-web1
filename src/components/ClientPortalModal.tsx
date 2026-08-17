import React, { useState, useEffect } from 'react';
import { AuthUserProfile, signOutUser, EnquirySubmission } from '../lib/supabase';

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUserProfile;
  onSignOut: () => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem('u360_enquiries') || '[]');
        setEnquiries(stored);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#020203]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl p-6 sm:p-8 bg-[#050505] border border-[#00f0ff]/40 shadow-[0_0_60px_-15px_rgba(0,240,255,0.3)] text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-mono tracking-widest text-white/50 hover:text-[#00f0ff] transition-colors p-2"
          aria-label="Close client portal"
        >
          ✕ ESC
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border border-[#00f0ff] bg-[#00f0ff]/10 grid place-items-center text-lg font-mono font-black text-[#00f0ff]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                {user.name}
                <span className="px-2 py-0.5 text-[0.6rem] font-mono tracking-wider text-black bg-[#00f0ff] rounded-full uppercase font-bold">
                  {user.provider} AUTH
                </span>
              </h3>
              <p className="text-xs text-white/50 font-mono">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              signOutUser();
              onSignOut();
              onClose();
            }}
            className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest text-[#ff5252] border border-[#ff5252]/40 hover:bg-[#ff5252]/10 transition-colors rounded-full"
          >
            SIGN OUT
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 bg-[#0a0b0e] border border-white/10">
            <div className="text-[0.6rem] font-mono tracking-widest text-white/40 uppercase mb-1">Status</div>
            <div className="text-sm font-black uppercase text-[#00f0ff] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
              ACTIVE MANDATE
            </div>
          </div>
          <div className="p-4 bg-[#0a0b0e] border border-white/10">
            <div className="text-[0.6rem] font-mono tracking-widest text-white/40 uppercase mb-1">Intelligence Tier</div>
            <div className="text-sm font-black uppercase text-white">EXECUTIVE360</div>
          </div>
          <div className="p-4 bg-[#0a0b0e] border border-white/10">
            <div className="text-[0.6rem] font-mono tracking-widest text-white/40 uppercase mb-1">Advisory Desk</div>
            <div className="text-sm font-black uppercase text-white/80">VANIYAMBADI / DIRECT</div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-sans text-lg font-black uppercase tracking-tight text-white mb-3">
            ENQUIRY &amp; CONSULTATION <span className="text-[#00f0ff]">HISTORY</span>
          </h4>
          {enquiries.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-white/15 bg-white/[0.01]">
              <p className="text-xs text-white/40 font-light mb-2">No pending consultation briefs submitted yet.</p>
              <a
                href="#contact"
                onClick={onClose}
                className="inline-block text-xs font-mono text-[#00f0ff] uppercase tracking-widest hover:underline"
              >
                Draft an enquiry below ↓
              </a>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {enquiries.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#0e1015] border border-white/10">
                  <div className="flex items-center justify-between text-[0.65rem] font-mono text-[#00f0ff] mb-1 font-bold">
                    <span>{item.interest}</span>
                    <span className="text-white/40">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs font-light text-white/80 line-clamp-2">{item.message || 'Standard consultation requested.'}</div>
                  <div className="mt-2 text-[0.6rem] font-mono text-[#00f0ff] flex items-center gap-1">
                    ✓ LOGGED WITH PRINCIPAL CONSULTANT S. RAJKUMAR
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#00f0ff] hover:bg-white text-black font-sans font-black text-xs tracking-widest uppercase rounded-full transition-all cursor-pointer"
          >
            CLOSE DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};
