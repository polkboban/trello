// frontend/src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

// Attach token from localStorage or Supabase session
api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;

  // prefer token stored in localStorage
  let token = localStorage.getItem('token');

  // if no token, try to read Supabase session
  if (!token) {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token;
      if (token) localStorage.setItem('token', token);
    } catch (e) {
      // ignore
    }
  }

  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
}, (err) => Promise.reject(err));

export default api;
