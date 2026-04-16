import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const GoogleLoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync with our backend
      const response = await fetch("/api/auth/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleUser: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Google sync failed");

      // Log in to our app
      await login(data.token, data.firebaseToken, data.user);
      navigate("/");
    } catch (error: any) {
      console.error("Google login error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 transition-all shadow-sm group"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Continue with Google</span>
    </button>
  );
};
