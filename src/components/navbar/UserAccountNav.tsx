"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "@/providers/session/SessionProvider";
import { TokenStorage } from "@/lib/auth/token";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/auth/apiFetch";

const UserAccountNav = () => {
  const session = useSession();

  const handleSignOut = async () => {
    try {
        const response = await clientApiFetch("/api/auth/signout", TokenStorage.getRefreshToken() ?? "");

        if (response.ok) {
            toast.success("User signed out successfully");
            TokenStorage.removeRefreshToken();
            window.location.href = "/dashboard";
        } else {
          toast.error("Sign-out failed!");
        }
    } catch (error) {
        console.error("Error during sign-out:", error);
    }
};

  return (
    <div>
      {session?.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm font-medium">
              {session.user.username || "User"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSignOut()}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/signin">
          <Button variant="ghost" className="text-sm font-medium">
            Sign In
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UserAccountNav;
