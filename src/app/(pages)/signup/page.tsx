"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
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
        const username = formdata.get("username") as string;
        const password = formdata.get("password") as string;
        const email = formdata.get("email") as string;

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, email }),
            });
    
            const res = await response.json();
            
            if(response.status !== 201){
                toast.error(res.error);
                return;
            }
    
            toast.success("Signup successful!");
            router.push("/dashboard");  // Redirect to Signin after successful Signup
        } catch (error) {
            console.error("Error signing up:", error);
            toast.error("An unexpected error occurred.");
        }
    };

    return (
        <section className="flex flex-1 flex-col items-center justify-center gap-5">
            <h1 className="text-3xl font-bold">Signup</h1>

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <Input name="email" type="email" required />
                </div>

                <div>
                    <label htmlFor="username">Username</label>
                    <Input name="username" type="text" required />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <Input name="password" type="password" required />
                </div>

                <Button type="submit">Signup</Button>
            </form>

            <Link href="/signin">Already have an account? Sign In</Link>
        </section>
    );
}

export default Page;
