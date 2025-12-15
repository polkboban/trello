'use client';
import { useActionState } from 'react';
import { login } from '@/actions/auth';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  // Use the new Server Action hook
  const [state, formAction, isPending] = useActionState(login, null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ensure this redirects to home (/) not dashboard
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <Image src="/trello.svg" alt="Trello" width={48} height={48} />
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Welcome back</h2>
        <p className="text-center text-gray-300 mb-8 text-sm">
          Sign in to your account to continue
        </p>

        {state?.error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm text-center">
            {state.error}
          </div>
        )}

        {/* Connect the form to the Server Action */}
        <form action={formAction} className="space-y-5">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center justify-center text-gray-400 my-3">
            <span className="border-t border-gray-700 w-1/4"></span>
            <span className="mx-2 text-sm">or</span>
            <span className="border-t border-gray-700 w-1/4"></span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
        >
          <FcGoogle className="text-xl" /> Sign in with Google
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don’t have an account?{' '}
          <a href="/register" className="text-blue-400 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}