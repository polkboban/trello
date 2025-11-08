'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        console.error('Auth callback error:', error);
        router.push('/login');
        return;
      }

      const session = data.session;
      const accessToken = session.access_token;
      const user = session.user;

      // ✅ Store Supabase tokens for backend + client use
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Optional: also keep the theme or any other session info
      console.log('✅ Google login successful:', user.email);

      // Redirect to dashboard
      router.push('/dashboard');
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
      <div className="animate-pulse text-lg text-gray-300">
        Signing you in securely...
      </div>
    </div>
  );
}
