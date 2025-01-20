import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        ACCESS_TOKEN_SECRET: z
            .string()
            .min(1, "ACCESS_TOKEN_SECRET is required"),
        REFRESH_TOKEN_SECRET: z
            .string()
            .min(1, "REFRESH_TOKEN_SECRET is required"),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,

        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    },
});