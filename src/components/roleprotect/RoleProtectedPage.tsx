'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession } from '@/providers/session/SessionProvider';
import { toast } from 'sonner';

interface RoleProtectedPageProps {
    requiredRoles: string[];
    children: React.ReactNode;
  }

const RoleProtectedPage = ({ requiredRoles, children }: RoleProtectedPageProps) => {
  const { user, loading } = useSession();
  const router = useRouter();
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    if (loading) return; 

    if (user) {
      const userRoles = user.roles || []; 
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        toast.error('You do not have the required role for this page.');
        router.push('/dashboard'); 
      } else {
        setHasRequiredRole(true);
      }
    }
  }, [user, loading, requiredRoles, router]);

  if (loading || !hasRequiredRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-4 h-4 bg-black animate-pulse transform rotate-45"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedPage;
