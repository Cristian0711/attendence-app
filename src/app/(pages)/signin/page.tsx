"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { TokenStorage } from "@/lib/auth/token";
import { useSession } from "@/providers/session/SessionProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect } from "react";
import { toast } from "sonner";

function Page() {
    const router = useRouter();
    const { user, loading } = useSession();
    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (loading) return;

        if (user !== null) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    if(loading){
        return (<Loader/>);
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formdata = new FormData(e.currentTarget);
        const email = formdata.get("email") as string;
        const password = formdata.get("password") as string;

        try {
            const response = await fetch("/api/auth/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
    
            const res = await response.json();
    
            if (res.message !== "OK") {
                toast.error(res.error);
                return;
            }

            TokenStorage.saveRefreshToken(res.refreshToken);

            toast.success("Signed in successfully!");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Error signing in:", error);
            toast.error("An unexpected error occurred.");
        }
    };

    return (
        <section className="flex flex-1 flex-col items-center justify-center gap-5">
            <h1 className="text-3xl font-bold">Signin</h1>

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <Input name="email" type="text" />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <Input name="password" type="password" />
                </div>

                <Button type="submit">Signin</Button>
            </form>

            <Link href="/signup">Signup</Link>
        </section>
    );
}

export default Page;
