'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/FrontEvent';
import { toast } from 'sonner';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { useSession } from '@/providers/session/SessionProvider';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react'; 

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export const EventDetailsModal = ({ event, onClose }: { event: Event; onClose: () => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken, loading: sessionLoading } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) {
        toast.error('Access token not available');
        return;
      }

      setIsLoading(true);
      try {
        const response = await clientApiFetch('/api/events/eventusers', accessToken, {
          body: JSON.stringify({ eventId: event.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event users');
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        toast.error('Could not load users for this event');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!sessionLoading) {
      fetchUsers();
    }
  }, [event.id, accessToken, sessionLoading]);

  const copyAccessCode = () => {
    if (event.accessCode) {
      navigator.clipboard
        .writeText(event.accessCode)
        .then(() => {
          toast.success('Access code copied to clipboard!');
        })
        .catch(() => {
          toast.error('Failed to copy access code');
        });
    }
  };


  const exportToCSV = () => {
    const headers = ['ID', 'Username', 'Email', 'Registration Date'];
    const rows = users.map((user) => [
      user.username,
      user.email,
      new Date(user.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')), 
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}_registered_users.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToXLSX = () => {
    const headers = ['ID', 'Username', 'Email', 'Registration Date'];
    const rows = users.map((user) => [
      user.username,
      user.email,
      new Date(user.createdAt).toLocaleString(),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    XLSX.writeFile(workbook, `${event.name}_registered_users.xlsx`);
  };

  const qrCodeUrl = event.accessCode ? `http://localhost:3000/events/signuser?accessCode=${event.accessCode}` : '';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <CardTitle className="text-2xl font-semibold text-center text-black mb-4">{event.name}</CardTitle>
        <CardContent className="space-y-4">
          <p className="text-black">{event.description}</p>

          <div className="flex justify-between items-center">
            <p className="text-sm text-black">
              <strong>Start:</strong> {new Date(event.startTime).toLocaleString()}
            </p>
            <p className="text-sm text-black">
              <strong>End:</strong> {new Date(event.endTime).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-black">
              <strong>Access Code:</strong>
              <span className="font-semibold">{event.accessCode}</span>
            </p>
            <Button variant="default" size="sm" onClick={copyAccessCode} className="ml-2">
              Copy Code
            </Button>
          </div>

          {event.accessCode && qrCodeUrl && (
            <div className="flex justify-center mb-6">
              <QRCodeSVG value={qrCodeUrl} size={128} fgColor="#000000" level="Q" includeMargin />
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3 text-black">Registered Users:</h3>
            {isLoading || sessionLoading ? (
              <p className="text-black">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-black">No users have registered for this event.</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="text-sm text-black">
                    {user.username} ({user.email}) <br />
                    <span className="text-xs text-gray-500">
                      Registered on: {new Date(user.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center space-x-4 mt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex space-x-2">
            <Button variant="default" size="sm" onClick={exportToCSV}>
              Export to CSV
            </Button>
            <Button variant="default" size="sm" onClick={exportToXLSX}>
              Export to XLSX
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
