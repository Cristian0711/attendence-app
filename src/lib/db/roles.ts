import { eq } from "drizzle-orm";
import { db } from "./db";
import { roles, users, usersToRoles } from "./schema";
import { decodeRefreshToken } from "../jwt";

function compareArrays(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    // Sort both arrays to ensure order doesn't affect the comparison
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
}


export async function getUserRoles(userId: string) {
    const userRoles = await db
        .select({
            roleName: roles.name,
        })
        .from(usersToRoles)
        .innerJoin(roles, eq(usersToRoles.roleId, roles.id))  
        .where(eq(usersToRoles.userId, Number(userId))); 

    // Extrage doar numele rolurilor
    return userRoles.map(role => role.roleName);
}

export async function areUserRolesDifferent(userId: string, providedRoles: string[]): Promise<boolean> {
    const userRoles = await getUserRoles(userId);
    return !compareArrays(userRoles, providedRoles);
}

export async function isRefreshTokenValid(userId: string, refreshToken: string): Promise<boolean> {
    try {
        const decoded = await decodeRefreshToken(refreshToken);
        const tokenJti = decoded.jti;

        // Retrieve the user's stored jti from the database
        const userRecord = await db
            .select({
                jwtid: users.jwtid,
            })
            .from(users)
            .where(eq(users.id, Number(userId)))
            .limit(1);

        if (userRecord.length === 0) {
            return false;
        }

        const storedJti = userRecord[0].jwtid;
        return tokenJti === storedJti;
    } catch (error) {
        console.error('Error validating refresh token:', error);
        return false;
    }
}