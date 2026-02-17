
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import ProfileSettings from './ProfileSettings';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  user: UserProfile;
  schoolName: string;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, schoolName, onLogout, onSwitchRole, onUpdateProfile, children }) => {
  const [imgError, setImgError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const roles = [
    { id: UserRole.ADMIN, label: 'Administration' },
    { id: UserRole.TEACHER, label: 'Teacher' },
    { id: UserRole.STUDENT, label: 'Student Body' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  useEffect(() => {
    if (isMobileMenuOpen || isAIOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen, isAIOpen]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav 
        role="navigation"
        aria-label="Hauptnavigation"
        className={`px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-[100] border-b shadow-lg transition-colors duration-300 backdrop-blur-md ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-800' 
            : 'bg-[#1e3a8a] border-white/10 text-white'
        }`}
      >
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${
            isDarkMode ? 'bg-indigo-600 text-white' : 'bg-white text-[#1e3a8a]'
          }`}>
            {schoolName.split(' ').map(w => w[0]).join('')}
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xs md:text-base leading-tight tracking-tight uppercase">{schoolName}</h1>
            <p className={`text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-indigo-400' : 'text-blue-300'}`}>Digital Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-6">
          <div className="hidden lg:flex items-center bg-white/10 border border-white/10 rounded-xl px-4 py-2 focus-within:bg-white/20 transition-all">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Suchen..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white placeholder-white/40 outline-none ml-3 w-40 focus:w-60 transition-all" 
              aria-label="Portalweite Suche"
            />
          </div>

          <div className="hidden lg:flex p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5">
            {roles.map((role) => {
              const isActive = user.role === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => onSwitchRole(role.id)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive 
                      ? 'bg-white text-[#1e3a8a] shadow-xl scale-105 z-10' 
                      : 'text-blue-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1 md:space-x-4">
            {/* AI Assistant Toggle Button */}
            <button 
              onClick={() => setIsAIOpen(true)}
              className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center gap-2 group shadow-xl ${
                isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'bg-white/20 text-white border border-white/20 hover:bg-white/30'
              }`}
              aria-label="AI Strategie-Berater öffnen"
            >
              <span className="text-lg">🧠</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Consult AI</span>
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isDarkMode ? "In den hellen Modus wechseln" : "In den dunklen Modus wechseln"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              )}
            </button>

            <div className="flex items-center space-x-2 border-l border-white/10 pl-2 md:pl-4">
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className="relative group active:scale-95 transition-transform"
                aria-label="Profileinstellungen öffnen"
              >
                {user.avatar_url && !imgError ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-8 h-8 md:w-9 md:h-9 rounded-xl border-2 border-white/20 object-cover" 
                    onError={() => setImgError(true)} 
                  />
                ) : (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl border-2 border-white/20 flex items-center justify-center bg-blue-600 text-white text-[10px] font-black uppercase">
                    {getInitials(user.full_name)}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1e3a8a] rounded-full"></div>
              </button>

              <button 
                onClick={onLogout} 
                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all hidden sm:block"
                title="Abmelden"
                aria-label="Abmelden"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className={`lg:hidden p-2 rounded-xl transition-all active:scale-90 relative z-[110] ${isDarkMode ? 'text-indigo-400' : 'text-white'}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu-drawer"
                aria-label="Mobiles Menü umschalten"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5 overflow-hidden">
                    <span className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-200 ${isMobileMenuOpen ? '-translate-x-10 opacity-0' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div 
        id="mobile-menu-drawer"
        className={`lg:hidden fixed inset-0 z-[90] flex items-start transition-opacity duration-500 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-opacity duration-500" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`relative w-full p-6 pt-24 border-b shadow-2xl transition-all duration-500 flex flex-col gap-8 transform ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#1e3a8a] text-white'}`}>
          <div className="space-y-6">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 px-2">Bereich wechseln</p>
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => {
                const isActive = user.role === role.id;
                return (
                  <button 
                    key={role.id} 
                    onClick={() => { onSwitchRole(role.id); setIsMobileMenuOpen(false); }} 
                    aria-pressed={isActive}
                    className={`flex items-center justify-between p-5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all active:scale-[0.97] transform ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'} ${isActive ? 'bg-white text-[#1e3a8a] shadow-2xl' : 'bg-white/5 text-white border border-white/5'}`}
                  >
                    <span>{role.label}</span>
                    {isActive && (
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ProfileSettings user={user} onUpdate={async (updates) => { await onUpdateProfile(updates); setImgError(false); }} onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Thinking-Enabled AI Assistant Drawer */}
      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        userRole={user.role} 
      />

      <main id="main-content" className="flex-1 overflow-x-hidden relative focus:outline-none" tabIndex={-1}>
        <div key={user.role} className="animate-[fadeIn_0.6s_ease-out] p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      <footer className={`py-12 md:py-16 px-6 text-center transition-colors border-t ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'}`}>
        <p className="text-slate-400 text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase">
          &copy; {new Date().getFullYear()} {schoolName} • Excellence in Global Education
        </p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
