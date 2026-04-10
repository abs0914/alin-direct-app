import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { api } from '@/lib/api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const ALLOWED_ROLES = ['admin', 'super_admin', 'branch_manager', 'dispatcher'];

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const authRes = await axios.post(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        { email: data.email, password: data.password },
        { headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } },
      );
      const token: string = authRes.data.access_token;
      localStorage.setItem('alin_admin_token', token);

      const meRes = await api.get('/me');
      const userType: string = meRes.data?.user?.userType ?? '';

      if (!ALLOWED_ROLES.includes(userType)) {
        localStorage.removeItem('alin_admin_token');
        setError('Your account does not have access to this portal.');
        return;
      }

      const dest = userType === 'admin' || userType === 'super_admin' ? '/hq' : '/branch';
      navigate(dest, { replace: true });
    } catch (err: any) {
      localStorage.removeItem('alin_admin_token');
      const msg = err?.response?.data?.error_description
        ?? err?.response?.data?.message
        ?? 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/alin-move-logo.png"
            alt="ALiN Move"
            className="h-20 w-auto object-contain mb-4"
          />
          <h1 className="text-lg font-bold text-foreground tracking-tight">Admin &amp; Branch Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your operations</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border px-8 py-8">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@alinmove.com"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold hover:brightness-105 active:brightness-95 transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ALiN Technologies Inc. © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

