import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface OTPVerificationProps {
  uid: string;
  onSuccess: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ uid, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-brand-primary/5 border border-gray-100 max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <div className="bg-brand-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="h-8 w-8 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Verify Authority</h2>
        <p className="text-sm text-gray-500 leading-relaxed px-4">
          We've sent a 6-digit intelligence code to your email. Enter it below to activate your account.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-xs font-bold text-red-700">{error}</p>
          </motion.div>
        )}

        <div>
          <input
            type="text"
            maxLength={6}
            className="block w-full px-4 py-5 border border-gray-100 rounded-2xl bg-gray-50/50 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-5 rounded-2xl bg-brand-primary text-white text-xs font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Verify Identity"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-[10px] font-bold uppercase tracking-widest text-[#002366] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Intelligence Code"}
          </button>
        </div>
      </form>
    </div>
  );
};
