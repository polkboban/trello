"use client";

import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const logout = () => {
    // Remove token
    localStorage.removeItem("token");

    // Optional: also clear cached user data
    localStorage.removeItem("user");

    // Redirect to login
    router.push("/login");
  };

  return logout;
}
