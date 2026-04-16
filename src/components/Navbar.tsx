import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, User, LogOut, Menu, X, MessageSquare, Search } from "lucide-react";
import { cn } from "../lib/utils";

export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="glass-morphism sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
        <Link to="/" className="flex flex-col items-center gap-1 group">
          <div className="relative flex items-center justify-center">
            <div className="bg-brand-primary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center">
              <Search className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <Briefcase className="h-3 w-3 text-white absolute -top-1 -right-1 bg-brand-primary rounded-full p-0.5 border border-white" />
          </div>
          <span className="text-xl font-serif font-black text-brand-primary tracking-tight leading-none uppercase italic">Inves4Business</span>
        </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Browse</Link>
            {user ? (
              <>
                {profile?.role === "user" && (
                  <Link to="/buyer" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Enquiries</Link>
                )}
                {profile?.role === "seller" && (
                  <Link to="/vendor" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Vendor Kit</Link>
                )}
                {profile?.role === "admin" && (
                  <Link to="/admin" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Control</Link>
                )}
                <Link to="/messages" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors relative">
                  Messages
                </Link>
                <div className="flex items-center gap-6 pl-4 border-l border-gray-100">
                  <Link to="/profile" className="flex items-center gap-2 group/user p-1">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center group-hover/user:bg-brand-primary/10 transition-colors">
                      <User className="h-4 w-4 text-brand-primary" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-900 group-hover/user:text-brand-primary transition-colors">{profile?.name || user.email}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-[13px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Access</Link>
                <Link
                  to="/register"
                  className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-[#002366] p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn("md:hidden bg-white border-b border-gray-200", isOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link to="/" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Browse</Link>
          {user ? (
            <>
              {profile?.role === "user" && (
                <Link to="/buyer" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">My Enquiries</Link>
              )}
              {profile?.role === "seller" && (
                <Link to="/vendor" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Vendor Panel</Link>
              )}
              {profile?.role === "admin" && (
                <Link to="/admin" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Admin Panel</Link>
              )}
              <Link to="/messages" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Messages</Link>
              <Link to="/profile" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">My Profile</Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Login</Link>
              <Link to="/register" className="block px-3 py-2 text-[#002366] font-bold hover:bg-gray-50 rounded-md">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
