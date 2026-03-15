'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      // Show field-level error for auth failures
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
        setErrors({ password: 'Incorrect email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Phoneix Logo" width={80} height={80} className="rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Phoneix Business Suite</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                autoFocus
                className={`input pl-9 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="admin@phoneix.com"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: '' })); }}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: '' })); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center py-2.5 text-base"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6 bg-gray-50 rounded-lg p-2.5">
          Default: <span className="font-mono">admin@phoneix.com</span> / <span className="font-mono">Admin@1234</span>
        </p>
      </div>
    </div>
  );
}
