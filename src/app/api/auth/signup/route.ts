import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { users, roles, usersToRoles } from "@/lib/db/schema";
import { insertUserSchema } from "@/lib/db/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const signUpSchema = insertUserSchema.extend({
  username: z.string().min(6, 'Username must be at least 6 characters long'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validatedData = signUpSchema.parse(body);
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const existingUserByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, validatedData.username))
      .limit(1);

    if (existingUserByUsername.length > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(validatedData.password, 10);

    const newUser = await db.insert(users).values({
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword,
    }).returning({
      id: users.id,
      email: users.email,
      username: users.username,
      createdAt: users.createdAt,
    });

    // Insert the "user" role for the new user into the `usersToRoles` table
    const userRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'user'))
    .limit(1);

    // Ensure the role exists or create it if necessary
    const userRoleId = userRole.length > 0
    ? userRole[0].id
    : await db
        .insert(roles)
        .values({ name: 'user' })
        .returning()
        .then(result => result[0].id);

    await db
    .insert(usersToRoles)
    .values({
        userId: newUser[0].id as number, 
        roleId: userRoleId as number,   
    });

    return NextResponse.json({
        message: "User created successfully",
        user: newUser[0]
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
        return NextResponse.json(
            { error: "Invalid input", details: error.errors },
            { status: 400 }
        );
        }

        console.error("Signup error:", error);
        return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
        );
    }
}
