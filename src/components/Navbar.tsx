import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, User, LogOut, Menu, X, MessageSquare } from "lucide-react";
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-[#002366]" />
              <span className="text-xl font-bold text-[#002366] tracking-tight">Inves4Business</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-[#002366] font-medium transition-colors">Browse</Link>
            {user ? (
              <>
                {profile?.role === "user" && (
                  <Link to="/buyer" className="text-gray-600 hover:text-[#002366] font-medium transition-colors">My Enquiries</Link>
                )}
                {profile?.role === "vendor" && (
                  <Link to="/vendor" className="text-gray-600 hover:text-[#002366] font-medium transition-colors">Vendor Panel</Link>
                )}
                {profile?.role === "admin" && (
                  <Link to="/admin" className="text-gray-600 hover:text-[#002366] font-medium transition-colors">Admin Panel</Link>
                )}
                <Link to="/messages" className="text-gray-600 hover:text-[#002366] font-medium transition-colors relative">
                  Messages
                </Link>
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#002366] transition-colors">
                    <User className="h-4 w-4" />
                    <span>{profile?.name || user.email}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-600 hover:text-[#002366] font-medium transition-colors">Login</Link>
                <Link
                  to="/register"
                  className="bg-[#002366] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#001a4d] transition-all shadow-sm"
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
              {profile?.role === "vendor" && (
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
