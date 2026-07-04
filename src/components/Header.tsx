import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, User, LogIn, LogOut, Sliders, PlaySquare, Sun, Moon } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { UserState, Notification } from '../types.ts';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenAI: () => void;
  onOpenPreferences: () => void;
  onViewHome: () => void;
  onViewWatchlist: () => void;
  onViewFavorites: () => void;
  user: UserState | null;
  setUser: (user: UserState | null) => void;
  setAuthToken: (token: string | null) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({
  onSearch,
  onOpenAI,
  onOpenPreferences,
  onViewHome,
  onViewWatchlist,
  onViewFavorites,
  user,
  setUser,
  setAuthToken,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const token = await fUser.getIdToken();
        setAuthToken(token);
        
        // Sync user with our Postgres DB
        try {
          const res = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            fetchNotifications(token);
          }
        } catch (error) {
          console.error('Error syncing user with backend:', error);
        }
      } else {
        setAuthToken(null);
        setUser(null);
        setNotifications([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async (token: string) => {
    try {
      const res = await fetch('/api/user/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markAsRead = async (id: number) => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/user/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${theme === 'light' ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' : 'bg-[#030712]/80 border-white/5 text-slate-100'} backdrop-blur-xl border-b px-4 py-3 md:px-8`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={onViewHome}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          id="brand-logo"
        >
          {/* Well-Structured Premium Logo Emblem */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 p-[1.5px] shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/20 transition-all duration-300 group-hover:scale-105">
            <div className={`flex items-center justify-center w-full h-full rounded-[10px] ${theme === 'light' ? 'bg-white' : 'bg-[#030712]'} transition-colors duration-300 group-hover:bg-[#0b0f19]`}>
              <div className="relative">
                <PlaySquare className="w-5 h-5 text-amber-500 fill-amber-500/20" strokeWidth={2} />
                <Sparkles className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-display font-black tracking-tight ${theme === 'light' ? 'text-slate-950' : 'bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent'}`}>
                Cine
              </span>
              <span className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Luxe
              </span>
            </div>
            <span className="text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-amber-500/80 -mt-1 block">
              PREMIUM CINEMA
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="relative max-w-lg w-full hidden sm:block"
          id="global-search-form"
        >
          <input
            type="text"
            placeholder="Search movies, directors, actors..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={`w-full px-5 py-2.5 pl-11 rounded-full ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-slate-300' : 'bg-white/5 border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-white/20 focus:bg-white/10'} border transition-all font-sans`}
          />
          <Search className="absolute left-4 top-3 w-4.5 h-4.5 text-slate-400" />
        </form>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          
          {/* AI Concierge Trigger */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-500 text-sm font-sans font-bold transition-all cursor-pointer shadow-sm"
            id="ai-concierge-btn"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="hidden md:inline">AI Magic</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to High-Contrast Light Mode'}
            id="theme-switcher-btn"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Preferences Trigger */}
          {user && (
            <button
              onClick={onOpenPreferences}
              className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Preferences"
              id="preferences-btn"
            >
              <Sliders className="w-5 h-5" />
            </button>
          )}

          {/* Notifications Panel */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                id="notifications-bell"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#030712]" />
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-white'}`}>
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0B1120] border-slate-800'}`}>
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  <div className={`max-h-64 overflow-y-auto divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 text-xs cursor-pointer transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'} ${!n.isRead ? (theme === 'light' ? 'bg-amber-500/5 border-l-2 border-amber-500' : 'bg-amber-500/10 border-l-2 border-amber-500') : ''}`}
                        >
                          <div className={`font-medium mb-0.5 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{n.title}</div>
                          <div className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 p-1 pr-3 rounded-full transition-all cursor-pointer ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
                id="user-profile-menu"
              >
                <img 
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'} 
                  alt={user.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-white/20 transition-all"
                />
              </button>

              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl z-50 overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-white'}`}>
                  <div className={`p-4 border-b ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0B1120] border-slate-800'}`}>
                    <div className={`font-medium text-sm truncate ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{user.name}</div>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={onViewWatchlist}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      My Watchlist
                    </button>
                    <button 
                      onClick={onViewFavorites}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      My Favorites
                    </button>
                  </div>
                  <div className={`border-t py-2 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 text-sm font-sans font-extrabold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer scale-100 hover:scale-[1.02]"
              id="login-btn"
            >
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
