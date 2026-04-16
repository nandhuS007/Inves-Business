import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Shield, CheckCircle2, Search, Fingerprint } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { OTPVerification } from "../components/OTPVerification";
import { GoogleLoginButton } from "../components/GoogleLoginButton";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "seller">("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [registeredUid, setRegisteredUid] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
      
      setRegisteredUid(data.uid);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-20 px-4">
        <div className="mb-10 flex flex-col items-center">
          <Link to="/" className="flex flex-col items-center gap-3 mb-10 group transition-all">
            <div className="relative flex items-center justify-center">
              <div className="bg-brand-primary p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center">
                <Search className="h-10 w-10 text-white stroke-[2.5]" />
              </div>
              <Briefcase className="h-4 w-4 text-white absolute -top-1 -right-1 bg-brand-primary rounded-full p-1 border border-white" />
            </div>
            <span className="text-4xl font-serif font-black text-brand-primary tracking-tight leading-none uppercase italic">Inves4Business</span>
          </Link>
        </div>
        <OTPVerification uid={registeredUid} onSuccess={() => setSuccess(true)} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 text-center">
            <div className="bg-green-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase tracking-widest mb-2">
                Success!
              </span>
              <h2 className="text-2xl font-bold text-gray-900">Account Created</h2>
            </div>
            <p className="text-gray-600 mb-8">
              Welcome to Inves4Business! Your <span className="font-bold text-[#002366] capitalize">{role === "user" ? "investor" : "seller"}</span> account has been successfully created.
              <br /><br />
              You can now log in to access your dashboard.
            </p>
            <Link 
              to="/login"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#002366] hover:bg-[#001a4d] transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-20 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex flex-col items-center gap-3 mb-10 group transition-all">
          <div className="relative flex items-center justify-center">
            <div className="bg-brand-primary p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center">
              <Search className="h-10 w-10 text-white stroke-[2.5]" />
            </div>
            <Briefcase className="h-4 w-4 text-white absolute -top-1 -right-1 bg-brand-primary rounded-full p-1 border border-white" />
          </div>
          <span className="text-4xl font-serif font-black text-brand-primary tracking-tight leading-none uppercase italic">Inves4Business</span>
        </Link>
        <h2 className="text-center text-4xl font-serif font-bold text-brand-primary tracking-tight">
          Create <span className="italic text-gray-400">Profile</span>
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500 font-medium">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-brand-primary hover:underline underline-offset-4">
            Initialize access
          </Link>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-12 px-6 shadow-2xl shadow-brand-primary/5 sm:rounded-[2rem] sm:px-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
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

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                  role === "user" ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                )}
              >
                <User className={cn("h-6 w-6", role === "user" ? "text-brand-primary" : "text-gray-400")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", role === "user" ? "text-brand-primary" : "text-gray-500")}>Acquirer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("seller")}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                  role === "seller" ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                )}
              >
                <Briefcase className={cn("h-6 w-6", role === "seller" ? "text-brand-primary" : "text-gray-400")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", role === "seller" ? "text-brand-primary" : "text-gray-500")}>Provider</span>
              </button>
            </div>

            <div className="space-y-5">
              <GoogleLoginButton />
              
              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Or Register</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all text-sm"
                    placeholder="Institutional Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Email Address</label>
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
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Contact Intelligence</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type="tel"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all text-sm"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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

            {/* Mock CAPTCHA placeholder */}
            <div className="mt-6 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-gray-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Verified by FriendlyCaptcha</span>
              </div>
              <Fingerprint className="h-5 w-5 text-gray-300" />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center gap-3 py-5 px-4 rounded-2xl shadow-xl shadow-brand-primary/10 text-xs font-bold uppercase tracking-[0.2em] text-white bg-brand-primary hover:bg-black transition-all disabled:opacity-50 active:scale-95"
              >
                <div className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <span className="animate-pulse">Provisioning...</span>
                  ) : (
                    <>
                      Register Profile
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
