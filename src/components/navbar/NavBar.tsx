import Link from "next/link";
import UserAccountNav from "./UserAccountNav";

export const NavBar = async () => {
  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-white">
          MyApp
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Dashboard
          </Link>

          <UserAccountNav />
        </div>
      </div>
    </nav>
  );
};
