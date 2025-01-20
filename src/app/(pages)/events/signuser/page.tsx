'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; 
import { useSession } from '@/providers/session/SessionProvider';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { toast } from 'sonner';
import Loader from '@/components/ui/loader';

const SignUserPage = () => {
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams(); 
  const { accessToken, loading } = useSession(); 
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; 
    }

    const accessCode = searchParams.get('accessCode');
    if (!accessCode) {
      toast('Access code is missing.');
      router.push('/dashboard');
      return;
    }

    const fetchEventData = async () => {
      try {
        const response = await clientApiFetch('/api/events/signwithcode', accessToken ?? '', {
          body: JSON.stringify({ accessCode }),
        });

        if (response.ok) {
          const result = await response.json();
          setEvent(result.event); 
          router.push('/events/view'); 
          toast('Successfully joined the event!');
        } else {
            const result = await response.json();
            toast(result.message || 'Failed to join event.');
          router.push('/dashboard');
        }
      } catch (err) {
        toast('An error occurred while fetching the event.');
        router.push('/dashboard');
      }
    };

    fetchEventData();
  }, [searchParams, accessToken, loading, router]);

  return (
    <Loader/>
  );
};

export default SignUserPage;
