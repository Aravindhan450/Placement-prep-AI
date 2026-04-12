import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SignOutButton } from "../SignOutButton";
import {
  MessageSquare,
  Map,
  FileText,
  Brain,
  Building2,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/experiment-dashboard", label: "Analytics", icon: MessageSquare },
    { path: "/interview", label: "Interview", icon: Building2 },
    { path: "/", label: "Practice", icon: Brain },
    { path: "/roadmaps", label: "Roadmaps", icon: Map },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a18]/80 backdrop-blur-md border-b border-[#1a1a2e]">
      <div className="w-full px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo - Left aligned */}
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0"
          >
            PlacementPrep AI
          </Link>

          {user ? (
            <>
              {/* Navigation Links - Center aligned */}
              <div className="hidden md:flex items-center space-x-2 flex-1 justify-center">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                          : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions - Right aligned */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="hidden md:block">
                  <SignOutButton />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
                >
                  {mobileMenuOpen ? (
                    <X size={24} />
                  ) : (
                    <Menu size={24} />
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>

        {user && mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#1a1a2e]">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
