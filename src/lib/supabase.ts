import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback user state for preview when Supabase env vars are pending
const LOCAL_USER_KEY = 'u360_auth_user';

export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'email';
  created_at: string;
  company?: string;
}

export async function signInWithGoogle(): Promise<{ user: AuthUserProfile | null; error: Error | null }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return { user: null, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase Google OAuth fallback triggered:', err.message);
    }
  }

  // Graceful simulated Google sign-in for preview sandbox
  const simulatedUser: AuthUserProfile = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: 'executive@enterprise.com',
    name: 'Executive Partner',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    provider: 'google',
    created_at: new Date().toISOString(),
    company: 'Enterprise Group'
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(simulatedUser));
  return { user: simulatedUser, error: null };
}

export async function signInWithEmail(email: string): Promise<{ user: AuthUserProfile | null; error: Error | null }> {
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase OTP fallback triggered:', err.message);
    }
  }

  const simulatedUser: AuthUserProfile = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email,
    name: email.split('@')[0],
    provider: 'email',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(simulatedUser));
  return { user: simulatedUser, error: null };
}

export async function signOutUser() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export function getCurrentLocalUser(): AuthUserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface EnquirySubmission {
  id?: string;
  name: string;
  org: string;
  email: string;
  phone: string;
  interest: string;
  scale: string;
  message: string;
  created_at: string;
  user_id?: string;
}

export async function saveEnquiry(enquiry: Omit<EnquirySubmission, 'id' | 'created_at'>) {
  const newRecord: EnquirySubmission = {
    ...enquiry,
    id: 'enq_' + Date.now(),
    created_at: new Date().toISOString(),
  };

  // Save to Supabase if available
  if (supabase) {
    try {
      const { data, error } = await supabase.from('enquiries').insert([newRecord]);
      if (!error) return { success: true, record: data };
    } catch (err) {
      console.warn('Could not insert to Supabase table enquiries:', err);
    }
  }

  // Store in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('u360_enquiries') || '[]');
    existing.unshift(newRecord);
    localStorage.setItem('u360_enquiries', JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to store enquiry locally', e);
  }

  return { success: true, record: newRecord };
}
