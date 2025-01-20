import { NextRequest, NextResponse } from 'next/server';
import { decodeAccessToken, decodeRefreshToken, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/jwt'; 
import { areUserRolesDifferent, getUserRoles, isRefreshTokenValid } from '@/lib/db/roles';
import { db } from '@/lib/db/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            return NextResponse.json({ error: 'No session found' }, { status: 401 });
        }

        const verified = await verifyRefreshToken(refreshToken);

        if (!verified) {
            const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 });
            return response;
        }

        if(!verified.accessToken){
            return;
        }

        const decoded = await decodeAccessToken(verified.accessToken);

        const valid = await isRefreshTokenValid(decoded.sub, refreshToken);
        if(!valid) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const different = await areUserRolesDifferent(decoded.sub, decoded.roles);

        if(!different) {
            return NextResponse.json({ error: 'Unauthorized request!' }, { status: 401 });
        }

        const roles = await getUserRoles(decoded.sub);
        const newRefreshToken = await generateRefreshToken(decoded.sub, {
            username: decoded.username,
            roles: roles
        });
        
        const refreshTokenDecoded = await decodeRefreshToken(newRefreshToken);
        
        await db
        .update(users)
        .set({
            updatedAt: sql`NOW()`,
            jwtid: refreshTokenDecoded.jti,
        })
        .where(eq(users.id, Number(decoded.sub)));

        const accessToken = await generateAccessToken(decoded.sub, {
            username: decoded.username,
            roles: roles
        });

        return NextResponse.json(
            {
                message: "OK",
                newRefreshToken,
                accessToken   
            },
            { status: 200 }
        );
    } catch (error) {
        const response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        console.error('Error verifying token:', error);
        return response;
    }
}