import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.display_name?.charAt(0) || '؟'}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.display_name || 'مستخدم'}</p>
            <p className="text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-fade-in">
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
