import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور');
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 animate-scale-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-600/30">
              <Droplets className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">تحصيل</h1>
            <p className="text-slate-500 text-sm mt-2">سجل الدخول للوصول إلى النظام</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@water.gov"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-2">حسابات تجريبية:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="font-semibold text-slate-600">الأدمن</p>
                <p>admin@water.gov</p>
                <p>WaterAdmin#2024</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="font-semibold text-slate-600">المدير</p>
                <p>manager@water.gov</p>
                <p>WaterManager#2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
