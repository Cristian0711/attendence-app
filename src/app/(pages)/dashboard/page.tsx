'use client';

import { useSession } from '@/providers/session/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/loader';

export default function DashboardPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  if (loading) {
    return (
      <Loader/>
    );
  }

  if (!user) {
    window.location.href = '/signin';
    return null;
  }

  // Check if the user has the ADMIN role
  const isAdmin = user.roles.includes('admin');

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const cards = [
    {
      title: 'View Events',
      description: 'See all your upcoming events in one place.',
      path: '/events/view',
    },
  ];

  if (isAdmin) {
    cards.push({
      title: 'Add Event',
      description: 'Create and manage events effortlessly.',
      path: '/events/manage',
    });
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div
        className={`grid gap-6 ${
          cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'
        } justify-center`}
      >
        {cards.map((card, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleNavigation(card.path)}
          >
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
