'use client';
import { useActionState, useState } from 'react';
import { signup } from '@/actions/auth'; 
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  
  const [state, formAction, isPending] = useActionState(signup, null);
  
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');

  
  const handleSubmit = (e) => {
    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match");
      return;
    }
    setClientError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <Image src="/trello.svg" alt="Trello" width={48} height={48}></Image>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Create Account</h2>
        <p className="text-center text-gray-300 mb-8 text-sm">
          Join us and start managing your projects properly
        </p>

       
        {(state?.error || clientError) && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm text-center">
            {clientError || state?.error}
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-300">Full Name</label>
            <input
              type="text"
              name="full_name"
              placeholder="Rahul Easwar"
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              placeholder="sunni@pulsar.com"
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Confirm Password</label>
            <input
              type="password"
              name="confirm_password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}