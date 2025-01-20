import { cookies } from 'next/headers';
import { decodeRefreshToken } from '@/lib/jwt';

export type SessionUser = {
  id: string;
  username: string;
  roles: string[];
} | null;

export interface ServerSession {
  user: SessionUser;
  accessToken: string | null;
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return null;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    let accessToken: string | null = null;

    if (response.ok) {
      accessToken = (await response.json()).accessToken

      if (!accessToken) {
        return null;
      }

      const decoded = await decodeRefreshToken(accessToken);

      if (!decoded) {
        return null;
      }

      return {
        user: {
          id: decoded.sub,
          username: decoded.username,
          roles: decoded.roles,
        },
        accessToken,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}