import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Briefcase, MapPin, IndianRupee, FileText, Image as ImageIcon, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const AddListing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Full Business",
    price: "",
    location: "",
    description: "",
    revenue: "",
    profit: "",
    yearsOfOperation: "",
    images: [] as string[],
    documents: [] as string[],
  });

  const subscriptionActive = profile?.subscription?.active && new Date(profile.subscription.expiryDate) > new Date();

  if (!subscriptionActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
            <div className="bg-yellow-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#002366] mb-4">Subscription Required</h2>
            <p className="text-gray-500 mb-8">You need an active subscription plan to list businesses on our marketplace.</p>
            <button 
              onClick={() => navigate("/pricing")}
              className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-[#001a4d] transition-all"
            >
              View Pricing Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "businesses"), {
        ...formData,
        price: Number(formData.price),
        revenue: Number(formData.revenue),
        profit: Number(formData.profit),
        yearsOfOperation: Number(formData.yearsOfOperation),
        status: "under_review",
        ownerId: user.uid,
        ownerName: profile?.name || "Verified Vendor",
        createdAt: new Date().toISOString(),
        isFeatured: profile?.subscription?.planId === "Platinum",
        views: 0,
      });
      navigate("/vendor");
    } catch (error) {
      console.error("Error adding listing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-[#002366] mb-4">List Your Business</h1>
          
          {/* Progress Bar */}
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-[#002366] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
            {[1, 2, 3].map(i => (
              <div 
                key={i}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center relative z-10 font-bold transition-all duration-300",
                  step >= i ? "bg-[#002366] text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                )}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Documents</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="h-6 w-6 text-[#002366]" />
                  <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Business Title</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                      placeholder="e.g. Profitable Tech Startup in Bangalore"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <select 
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option>Micro Business</option>
                        <option>Partnership Sale</option>
                        <option>Full Business</option>
                        <option>Investment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Asking Price (₹)</label>
                      <input 
                        type="number" 
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                        placeholder="5000000"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                        placeholder="e.g. Mumbai, Maharashtra"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-6 w-6 text-[#002366]" />
                  <h2 className="text-xl font-bold text-gray-900">Business Details</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      rows={6}
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] resize-none"
                      placeholder="Describe your business, its operations, and potential..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Annual Revenue</label>
                      <input 
                        type="number" 
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                        placeholder="₹"
                        value={formData.revenue}
                        onChange={e => setFormData({...formData, revenue: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Annual Profit</label>
                      <input 
                        type="number" 
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                        placeholder="₹"
                        value={formData.profit}
                        onChange={e => setFormData({...formData, profit: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Years Active</label>
                      <input 
                        type="number" 
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366]"
                        placeholder="Years"
                        value={formData.yearsOfOperation}
                        onChange={e => setFormData({...formData, yearsOfOperation: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <ImageIcon className="h-6 w-6 text-[#002366]" />
                  <h2 className="text-xl font-bold text-gray-900">Media & Documents</h2>
                </div>

                <div className="space-y-8">
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-[#002366] transition-all cursor-pointer group">
                    <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-8 w-8 text-[#002366]" />
                    </div>
                    <p className="text-gray-600 font-bold">Upload Business Images</p>
                    <p className="text-xs text-gray-400 mt-1">Drag and drop or click to upload</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-[#002366] transition-all cursor-pointer group">
                    <div className="bg-purple-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 font-bold">Upload Proof of Business / Licenses</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG accepted</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#002366] transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            ) : <div></div>}

            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#002366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all shadow-lg"
              >
                Next Step
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Listing"}
                {!loading && <CheckCircle2 className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
