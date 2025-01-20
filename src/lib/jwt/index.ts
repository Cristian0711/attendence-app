import { decodeJwt, errors, jwtVerify, SignJWT } from "jose";
import { env } from "@/../env.mjs";
import { generateId } from "../utils";

type TokenPayload = {
  username: string;
  roles: string[];
};

export function generateRefreshToken(userId: string, { username, roles }: TokenPayload) {
    const jwt = new SignJWT({ username, roles })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(generateId())
        .setIssuedAt()
        .setExpirationTime("7d")
        .setSubject(userId)
        .sign(new TextEncoder().encode(env.REFRESH_TOKEN_SECRET));

    return jwt;
}


export function generateAccessToken(userId: string, { username, roles }: TokenPayload) {
    const jwt = new SignJWT({ username, roles })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(generateId())
        .setIssuedAt()
        .setExpirationTime("10m")
        .setSubject(userId)
        .sign(new TextEncoder().encode(env.ACCESS_TOKEN_SECRET));

    return jwt;
}

export async function verifyRefreshToken(token: string) {
    try {
        const payload = await jwtVerify(
            token,
            new TextEncoder().encode(env.REFRESH_TOKEN_SECRET)
        );
        if (!payload.payload.sub) 
            return {
                error: "INVALID" as const,
                message: "Invalid token",
            };

        const { username, roles } = payload.payload as TokenPayload;

        const accessToken = await generateAccessToken(payload.payload.sub, { 
            username, 
            roles 
        });
        
        return { 
            accessToken, 
            userId: payload.payload.sub,
            username,
            roles
        };
    } catch (err) {
        return null;
    }
}

export async function verifyAccessToken(accessToken: string) {
    try {
        const payload = await jwtVerify(
            accessToken,
            new TextEncoder().encode(env.ACCESS_TOKEN_SECRET)
        );
        if (!payload.payload.sub)
            return {
                error: "INVALID" as const,
                message: "Invalid token",
            };

        const { username, roles } = payload.payload as TokenPayload;

        return { 
            accessToken, 
            userId: payload.payload.sub,
            username,
            roles
        };
    } catch (err) {
        if (err instanceof errors.JWTExpired)
            return {
                error: "EXPIRED" as const,
                message: "Token has expired",
            };

        return null;
    }
}

export function decodeRefreshToken(token: string) {
    return decodeJwt(token) as {
        sub: string;
        username: string;
        roles: string[];
        exp?: number;
        iat: number;
        jti: string;
    };
}

export function decodeAccessToken(token: string) {
    return decodeJwt(token) as {
        sub: string;
        username: string;
        roles: string[];
        exp?: number;
        iat: number;
        jti: string;
    };
}