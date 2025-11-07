'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token → redirect to login
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Prevent flicker before redirect
  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking authentication...
      </div>
    );
  }

  return children;
}
