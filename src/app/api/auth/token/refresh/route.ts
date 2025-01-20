import { NextRequest, NextResponse } from 'next/server';
import { decodeAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { areUserRolesDifferent, isRefreshTokenValid } from '@/lib/db/roles';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const refreshToken = body?.refreshToken;

        if (!refreshToken) {
            console.log('No session found');
            return NextResponse.json({ error: 'No session found' }, { status: 401 });
        }

        const verified = await verifyRefreshToken(refreshToken);

        if (!verified) {
            console.log('Invalid session');
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if(!verified.accessToken){
            return NextResponse.json({ error: 'No access token' }, { status: 401 });
        }

        const decoded = await decodeAccessToken(verified.accessToken);

        const valid = await isRefreshTokenValid(decoded.sub, refreshToken);
        if(!valid) {
            console.log('Invalid token');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const different = await areUserRolesDifferent(decoded.sub, decoded.roles);
        if(different) {
            console.log('Roles are different, renew the refresh token!');
            return NextResponse.json({ error: 'Roles are different, renew the refresh token!' }, { status: 201 });
        }

        return NextResponse.json({
            accessToken: verified.accessToken,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}