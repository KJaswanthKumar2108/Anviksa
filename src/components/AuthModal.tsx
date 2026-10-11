import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User, Building2, Shield, Check, Info } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userProfile: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState<'researcher' | 'organization_member' | 'reviewer'>('researcher');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      // Demo Auth Mode when Supabase credentials are not set
      setTimeout(() => {
        const mockProfile = {
          id: `user-${Date.now()}`,
          email,
          display_name: displayName || undefined,
          title: role === 'reviewer' ? 'Peer Reviewer' : role === 'organization_member' ? 'Organization Member' : 'Researcher',
          institution: institution || undefined,
          role: role,
          is_verified: true,
          h_index: 28
        };
        setLoading(false);
        onAuthSuccess(mockProfile);
        onClose();
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              institution,
              role
            }
          }
        });
        if (error) throw error;

        // Upsert profile in Supabase profiles table
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            display_name: displayName,
            institution,
            role,
            is_verified: false
          });
          onAuthSuccess({
            id: data.user.id,
            email,
            display_name: displayName,
            institution,
            role
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          onAuthSuccess(profile || {
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.user_metadata?.display_name,
            role: data.user.user_metadata?.role || 'researcher'
          });
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div>
            <span className="text-[10px] font-bold text-[#8B5E34] uppercase tracking-wider">Authentication</span>
            <h3 className="text-base font-bold text-[#342F27]">
              {isSignUp ? 'Create Anvīkṣā Account' : 'Sign In to Workspace'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Notification Banner if Supabase is awaiting keys */}
        {!isSupabaseConfigured && (
          <div className="bg-[#CCD5AE]/40 px-6 py-2.5 border-b border-[#DCD5BC] text-[11px] text-[#342F27] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#8B5E34] shrink-0" />
            <span>Demo Mode: Signing in will instantly authenticate a local session.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-[#B83A32]/10 border border-[#B83A32]/30 rounded-xl text-[#B83A32] text-[11px] font-medium">
              {errorMsg}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block font-bold text-[#342F27] mb-1">Full Name & Academic Title *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#342F27] mb-1">Institutional Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
              <input
                type="email"
                required
                placeholder="researcher@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#342F27] mb-1">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Primary Affiliation / Institution</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
                  <input
                    type="text"
                    placeholder="ETH Zürich / Harvard Wyss"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#342F27] mb-1">Primary Platform Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'researcher', label: 'Researcher' },
                    { id: 'organization_member', label: 'Grantor / Org' },
                    { id: 'reviewer', label: 'Reviewer' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                        role === r.id
                          ? 'bg-[#CCD5AE] border-[#B8C299] text-[#342F27] shadow-2xs font-bold'
                          : 'bg-[#FEFAE0] border-[#DCD5BC] text-[#6B6255] hover:border-[#D4A373]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Researcher Profile' : 'Sign In'}</span>
          </button>

          <div className="text-center pt-2 border-t border-[#DCD5BC]">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
              className="text-xs text-[#8B5E34] hover:underline font-semibold cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create Profile"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
