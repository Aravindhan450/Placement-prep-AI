"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";

export function SignInForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  // Redirect to chat page when authenticated
  useEffect(() => {
    if (user) {
      console.log("✅ User authenticated, redirecting to chat...");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (flow === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created successfully!");
      }
      // Auth state will change and useEffect will handle redirect
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(error.message || "Authentication failed");
      setSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success("Signed in as guest");
      // Auth state will change and useEffect will handle redirect
    } catch (error: any) {
      console.error("Anonymous sign-in error:", error);
      toast.error(error.message || "Failed to sign in as guest");
      setSubmitting(false);
    }
  };

  const handleClearCache = () => {
    console.log("🗑️ Clearing all auth cache...");
    // Clear all localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
        console.log("Cleared:", key);
      }
    });
    // Clear all sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
        console.log("Cleared:", key);
      }
    });
    toast.success("Cache cleared! Reloading...");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button 
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? "Loading..." : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-6">
        <hr className="flex-1 border-gray-300 dark:border-gray-600" />
        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">or</span>
        <hr className="flex-1 border-gray-300 dark:border-gray-600" />
      </div>
      <button 
        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium" 
        onClick={handleAnonymousSignIn}
        disabled={submitting}
      >
        Continue as Guest
      </button>
      <button 
        className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" 
        onClick={handleClearCache}
        type="button"
      >
        Having issues? Clear cache & reload
      </button>
    </div>
  );
}
