"use client";
import { supabase } from "./lib/supabase";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function SignOutButton() {

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
