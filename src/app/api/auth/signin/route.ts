import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { z } from "zod";
import { compare } from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { decodeRefreshToken, generateRefreshToken } from "@/lib/jwt";
import { getUserRoles } from "@/lib/db/roles";

export const signInSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const validatedData = signInSchema.parse(body);
        const existingUser = await db
            .select({
                id: users.id,
                email: users.email,
                username: users.username,
                password: users.password,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.email, validatedData.email))
            .limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 400 }
            );
        }

        const user = existingUser[0];
        const isPasswordValid = await compare(validatedData.password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 400 }
            );
        }

        const roles = await getUserRoles(String(user.id));
        const refreshToken = await generateRefreshToken(String(user.id), {
            username: user.username,
            roles: roles
        });

        const decoded = await decodeRefreshToken(refreshToken);
        
        await db
        .update(users)
        .set({
            updatedAt: sql`NOW()`,
            jwtid: decoded.jti,
        })
        .where(eq(users.id, user.id));

        return NextResponse.json(
            {
                message: "OK",
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    createdAt: user.createdAt,
                },
                refreshToken
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Sign-in error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
