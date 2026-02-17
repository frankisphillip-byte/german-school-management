
import React, { useState } from 'react';
import { UserRole, UserProfile } from './types';
import ProfileSettings from './components/ProfileSettings';

interface LayoutProps {
  user: UserProfile;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onSwitchRole, onUpdateProfile, children }) => {
  const [imgError, setImgError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const roles = [
    { id: UserRole.ADMIN, label: 'Administration' },
    { id: UserRole.HR, label: 'HR Management' },
    { id: UserRole.TEACHER, label: 'Teacher' },
    { id: UserRole.STUDENT, label: 'Student Body' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 border-b shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#1e3a8a] border-white/10 text-white'}`}>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transition-colors ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-white text-[#1e3a8a]'}`}>
            DSB
          </div>
          <div className="hidden sm:block">
            <h1 className={`font-black text-base md:text-lg leading-tight tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-white'}`}>DSB Brooklyn</h1>
            <p className={`text-[9px] uppercase tracking-[0.3em] font-black ${isDarkMode ? 'text-indigo-400' : 'text-blue-300'}`}>Digital Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-8">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            )}
          </button>

          <div className="hidden lg:flex p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5">
            {roles.map((role) => {
              const isActive = user.role === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => onSwitchRole(role.id)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-white text-[#1e3a8a] shadow-xl scale-105 z-10' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 md:space-x-5 border-l border-white/10 pl-4 md:pl-8">
            <button onClick={() => setIsSettingsOpen(true)} className="relative group">
              {user.avatar_url && !imgError ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 border-white/20 transition-transform group-hover:scale-105 object-cover" onError={() => setImgError(true)} />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 border-white/20 flex items-center justify-center bg-blue-600 text-white text-[10px] font-black uppercase">{getInitials(user.full_name)}</div>
              )}
            </button>

            <button onClick={onLogout} className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            </button>
            
            <button className="lg:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className={`lg:hidden p-4 border-b transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-blue-800 border-blue-700 text-white'}`}>
          <div className="flex flex-col space-y-2">
            {roles.map((role) => (
              <button key={role.id} onClick={() => { onSwitchRole(role.id); setIsMobileMenuOpen(false); }} className={`p-3 rounded-xl text-xs font-black uppercase text-left ${user.role === role.id ? 'bg-white text-blue-900' : 'text-blue-100'}`}>
                {role.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <ProfileSettings user={user} onUpdate={async (updates) => { await onUpdateProfile(updates); setImgError(false); }} onClose={() => setIsSettingsOpen(false)} />
      )}

      <main className="flex-1 overflow-x-hidden">
        <div key={user.role} className="animate-[fadeIn_0.5s_ease-out] p-4 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      <footer className={`py-10 px-6 text-center transition-colors ${isDarkMode ? 'bg-slate-950 border-t border-slate-900' : 'bg-white border-t border-slate-100'}`}>
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Deutsche Schule Brooklyn • Excellence in Brooklyn
        </p>
      </footer>
    </div>
  );
};

export default Layout;
