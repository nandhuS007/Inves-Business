import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Navbar } from "../components/Navbar";
import { User, Phone, Mail, Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export const Profile = () => {
  const { user, profile, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        phone
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-[#002366] p-4 rounded-2xl text-white shadow-lg">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#002366]">My Profile</h1>
            <p className="text-gray-500">Manage your personal information and account settings.</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[#002366] flex items-center justify-center text-white text-3xl font-bold">
                {profile?.name?.[0] || user.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile?.name || "User"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-widest">
                    {profile?.role}
                  </span>
                  {user.emailVerified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase tracking-widest">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                <p className="text-sm text-green-700">Profile updated successfully!</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-[#002366] sm:text-sm transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-[#002366] sm:text-sm transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    disabled
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-500 sm:text-sm"
                    value={user.email || ""}
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-500 sm:text-sm capitalize"
                    value={profile?.role || ""}
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">Contact support to change role.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#002366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
                {!loading && <Save className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
