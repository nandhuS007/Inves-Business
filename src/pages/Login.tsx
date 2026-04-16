import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      await login(data.token, data.firebaseToken, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-3 mb-10 group transition-all">
          <div className="bg-brand-primary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
             <Briefcase className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-serif font-bold text-brand-primary tracking-tight italic">Inves4Business</span>
        </Link>
        <h2 className="text-center text-4xl font-serif font-bold text-brand-primary tracking-tight">
          Secure <span className="italic text-gray-400">Access</span>
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500 font-medium">
          Or{" "}
          <Link to="/register" className="font-bold text-brand-primary hover:underline underline-offset-4">
            create a new investment profile
          </Link>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-12 px-6 shadow-2xl shadow-brand-primary/5 sm:rounded-[2rem] sm:px-12 border border-gray-100">
          <form className="space-y-8" onSubmit={handleLogin}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Identification</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all text-sm"
                    placeholder="email@institutional.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Passphrase</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-200 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500 cursor-pointer uppercase tracking-wider">
                  Persistent
                </label>
              </div>

              <div className="text-xs">
                <Link to="/forgot-password" title="Go to Forgot Password" className="font-bold text-brand-primary hover:underline underline-offset-4 uppercase tracking-wider">
                  Recover Access
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-3 py-5 px-4 rounded-2xl shadow-xl shadow-brand-primary/10 text-xs font-bold uppercase tracking-[0.2em] text-white bg-brand-primary hover:bg-black transition-all disabled:opacity-50 active:scale-95"
            >
              <div className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
