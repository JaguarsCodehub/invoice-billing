"use client"

import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const publicRoutes = ['/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push('/login');
    } else if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router, mounted]);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  // If not authenticated and trying to access private route, return null before redirect kicks in
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
