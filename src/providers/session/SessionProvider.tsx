'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { decodeRefreshToken, decodeAccessToken } from '@/lib/jwt';
import { TokenStorage } from '@/lib/auth/token';

interface User {
    id: string;
    username: string;
    roles: string[];
}

interface DecodedToken {
    sub: string;
    username: string;
    roles: string[];
    exp: number;
}

const TokenContext = createContext<string | null>(null);
const UserContext = createContext<User | null>(null);
const LoadingContext = createContext<boolean>(true);

const TokenService = {
    async refresh(refreshToken: string) {
        const response = await fetch('/api/auth/token/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return null;
        return response.json();
    },

    async renew(refreshToken: string) {
        const response = await fetch('/api/auth/token/renew', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return null;
        return response.json();
    },

    calculateExpirationTime(token: string): number | null {
        try {
            const decoded = decodeAccessToken(token) as DecodedToken;
            return decoded.exp * 1000;
        } catch {
            return null;
        }
    },

    async decodeToken(token: string): Promise<DecodedToken | null> {
        try {
            return await decodeAccessToken(token) as DecodedToken;
        } catch {
            return null;
        }
    }
};

function useTokenRefresh(onTokenRefreshed: (token: string, decoded: DecodedToken) => void, onRefreshFailed: () => void) {
    const refreshingRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const scheduleRefresh = useCallback((token: string) => {
        clearTimer();
        
        const expirationTime = TokenService.calculateExpirationTime(token);
        if (!expirationTime) return;

        const timeUntilExpiry = expirationTime - Date.now();
        if (timeUntilExpiry <= 0) return;

        const refreshTime = Math.max(0, timeUntilExpiry - 1000);
        console.log(`Next token refresh in ${Math.floor(refreshTime / 1000)}s`);
        
        timerRef.current = setTimeout(refreshToken, refreshTime);
    }, []);

    const refreshToken = useCallback(async () => {
        if (refreshingRef.current) return;

        try {
            refreshingRef.current = true;
            const refreshToken = TokenStorage.getRefreshToken();
            
            if (!refreshToken) {
                onRefreshFailed();
                return;
            }

            const response = await TokenService.refresh(refreshToken);
            
            if (response?.accessToken) {
                const decoded = await TokenService.decodeToken(response.accessToken);
                if (decoded) {
                    onTokenRefreshed(response.accessToken, decoded);
                    scheduleRefresh(response.accessToken);
                    return;
                }
            }

            const renewalResponse = await TokenService.renew(refreshToken);
            if (renewalResponse?.accessToken && renewalResponse.newRefreshToken) {
                TokenStorage.saveRefreshToken(renewalResponse.newRefreshToken);
                const decoded = await TokenService.decodeToken(renewalResponse.accessToken);
                if (decoded) {
                    onTokenRefreshed(renewalResponse.accessToken, decoded);
                    scheduleRefresh(renewalResponse.accessToken);
                    return;
                }
            }

            onRefreshFailed();
        } catch (error) {
            console.error('Token refresh failed:', error);
            onRefreshFailed();
        } finally {
            refreshingRef.current = false;
        }
    }, [onTokenRefreshed, onRefreshFailed, scheduleRefresh]);

    return {
        refreshToken,
        scheduleRefresh,
        clearTimer
    };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const handleTokenRefreshed = useCallback((newToken: string, decoded: DecodedToken) => {
        const newUser = {
            id: decoded.sub,
            username: decoded.username,
            roles: decoded.roles,
        };

        setAccessToken(newToken);
        
        setTimeout(() => {
            setUser(newUser);
            setLoading(false);
        }, 0);
    }, []);

    const handleRefreshFailed = useCallback(() => {
        setAccessToken(null);
        setTimeout(() => {
            setUser(null);
            setLoading(false);
        }, 0);
    }, []);

    const { refreshToken, clearTimer } = useTokenRefresh(
        handleTokenRefreshed,
        handleRefreshFailed
    );

    const initializeSession = useCallback(async () => {
        const storedRefreshToken = TokenStorage.getRefreshToken();
        if (!storedRefreshToken) {
            handleRefreshFailed();
            return;
        }

        await refreshToken();
    }, [refreshToken, handleRefreshFailed]);

    useEffect(() => {
        initializeSession();
        return () => {
            clearTimer();
        };
    }, [initializeSession, clearTimer]);

    return (
        <TokenContext.Provider value={accessToken}>
            <UserContext.Provider value={user}>
                <LoadingContext.Provider value={loading}>
                    {children}
                </LoadingContext.Provider>
            </UserContext.Provider>
        </TokenContext.Provider>
    );
}

export const useSession = () => {
    const accessToken = useContext(TokenContext);
    const user = useContext(UserContext);
    const loading = useContext(LoadingContext);

    return { user, accessToken, loading };
};