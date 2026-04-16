import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  useEffect(() => {
    const verify = async () => {
      if (!token || !uid) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Verification failed");
        
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message);
      }
    };

    verify();
  }, [token, uid, navigate]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-md w-full text-center"
      >
        {status === "loading" && (
          <div className="space-y-6">
            <RefreshCw className="h-16 w-16 text-brand-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-tight">Authenticating...</h2>
            <p className="text-gray-500 text-sm">Please wait while we verify your institutional credentials.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="bg-green-50 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-tight">Success!</h2>
            <p className="text-gray-500 text-sm">Your account has been activated. Redirecting to login...</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-brand-primary font-bold uppercase tracking-widest text-xs hover:underline">
              Go to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="bg-red-50 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-tight">Verification Error</h2>
            <p className="text-red-600 text-sm font-medium">{message}</p>
            <div className="pt-4 space-y-3">
              <Link to="/register" className="block w-full py-4 bg-brand-primary text-white text-xs font-bold rounded-2xl uppercase tracking-widest">
                Try Registering Again
              </Link>
              <Link to="/login" className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
