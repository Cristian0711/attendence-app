import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export type AuthOptions = {
  requireAuth?: boolean;
  requiredRoles?: string[];
};

export async function withAuth(
  request: NextRequest,
  options: AuthOptions = {}
) {
  const { requireAuth = true, requiredRoles = [] } = options;
  
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken && requireAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (accessToken) {
    const verifiedToken = await verifyAccessToken(accessToken);

    if (!verifiedToken || 'error' in verifiedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (requiredRoles.length > 0) {
      const hasRequiredRole = verifiedToken.roles?.some(role => 
        requiredRoles.includes(role)
      );

      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { userId: verifiedToken.userId, roles: verifiedToken.roles || [] },
      { status: 200 }
    );
  }

  return NextResponse.next();
}