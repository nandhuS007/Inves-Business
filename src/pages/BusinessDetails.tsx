import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, addDoc, collection, updateDoc, increment, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { MapPin, IndianRupee, TrendingUp, Calendar, MessageSquare, ShieldCheck, ArrowLeft, Info, FileText, User, AlertCircle, Send } from "lucide-react";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEO } from "../components/SEO";
import { Skeleton } from "../components/Skeleton";
import { chatService } from "../lib/chat";

export const BusinessDetails = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enquiry, setEnquiry] = useState("");
  const [sent, setSent] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch Business Details
  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const docRef = doc(db, "listings", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Business not found");
      
      const data = { id: docSnap.id, ...docSnap.data() } as any;
      
      // Increment view count (only if not the owner)
      if (user?.uid !== data.ownerId) {
        updateDoc(docRef, { views: increment(1) }).catch(console.error);
      }
      
      return data;
    },
    enabled: !!id
  });

  // Fetch Similar Listings
  const { data: similarListings = [] } = useQuery({
    queryKey: ["similar-listings", business?.category, id],
    queryFn: async () => {
      if (!business?.category) return [];
      const q = query(
        collection(db, "listings"),
        where("category", "==", business.category),
        where("status", "==", "approved"),
        limit(4)
      );
      const simSnap = await getDocs(q);
      return simSnap.docs
        .filter(d => d.id !== id)
        .slice(0, 3)
        .map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!business?.category
  });

  // Send Enquiry Mutation
  const enquiryMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !business) return;
      return addDoc(collection(db, "enquiries"), {
        userId: user.uid,
        businessId: business.id,
        vendorId: business.ownerId,
        message,
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setSent(true);
      setEnquiry("");
    }
  });

  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    enquiryMutation.mutate(enquiry);
  };

  const handleStartChat = async () => {
    if (!user || !business || chatLoading) return;
    
    setChatLoading(true);
    try {
      const chat = await chatService.getOrCreateChat(
        business.id,
        business.title,
        user.uid,
        business.ownerId
      );
      navigate("/messages", { state: { selectedChatId: chat.id } });
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-[500px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );

  if (error || !business) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h1>
      <button onClick={() => navigate("/")} className="text-blue-600 font-bold hover:underline">Return Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={business.title} 
        description={business.description.substring(0, 160)} 
        image={business.images?.[0]}
      />
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#002366] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="flex flex-wrap justify-between items-start gap-8 mb-10">
                <div className="flex-1 min-w-[300px]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-bold tracking-widest uppercase mb-4 text-brand-primary">
                    Verified Asset
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-primary mb-4 leading-tight tracking-tight">{business.title}</h1>
                  <div className="flex items-center gap-3 text-gray-400 font-medium">
                    <MapPin className="h-4 w-4 text-brand-primary/60" />
                    <span>{business.location}</span>
                  </div>
                </div>
                <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-gray-100 min-w-[200px] shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">Acquisition Value</span>
                  <div className="flex items-baseline text-brand-primary font-serif italic">
                    <span className="text-xl mr-1 italic">₹</span>
                    <span className="text-4xl font-bold leading-none">{business.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl relative group">
                <img 
                  src={business.images?.[0] || `https://picsum.photos/seed/${business.id}/1200/800`} 
                  alt={business.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-brand-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-blue-600 mb-3" />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Revenue</p>
                  <p className="font-serif font-bold text-brand-primary text-lg italic">₹{business.revenue?.toLocaleString("en-IN") || "N/A"}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-brand-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-green-600 mb-3" />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Net Profit</p>
                  <p className="font-serif font-bold text-brand-primary text-lg italic">₹{business.profit?.toLocaleString("en-IN") || "N/A"}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-brand-primary/20 transition-colors">
                  <Calendar className="h-5 w-5 text-purple-600 mb-3" />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tenure</p>
                  <p className="font-serif font-bold text-brand-primary text-lg italic">{business.yearsOfOperation || "N/A"} Years</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-brand-primary/20 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-orange-600 mb-3" />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Industry</p>
                  <p className="font-serif font-bold text-brand-primary text-lg italic">{business.category}</p>
                </div>
              </div>

              <div className="prose max-w-none mb-12">
                <h3 className="text-xl font-serif font-bold text-brand-primary mb-6 flex items-center gap-3">
                  <div className="w-8 h-px bg-brand-primary/20"></div>
                  Asset Portfolio Details
                </h3>
                <p className="text-gray-600 leading-[1.8] font-sans text-lg whitespace-pre-wrap">{business.description}</p>
              </div>

              <div className="bg-[#f8f9fa] rounded-2xl p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center gap-6">
                  <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center text-brand-primary shadow-xl border border-gray-100">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Representative</p>
                    <p className="text-xl font-serif font-bold text-brand-primary italic">{business.ownerName || "Accredited Vendor"}</p>
                  </div>
                </div>
                <Link 
                  to={`/vendor-profile/${business.ownerId}`}
                  className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  View Dossier
                </Link>
              </div>

              {/* Admin Only: Documents Section */}
              {profile?.role === "admin" && (
                <div className="mt-12 pt-12 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="h-6 w-6 text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">Admin: Business Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {business.documents && business.documents.length > 0 ? (
                      business.documents.map((doc: string, index: number) => (
                        <a 
                          key={index}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group"
                        >
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <FileText className="h-5 w-5 text-gray-400 group-hover:text-[#002366]" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">Document {index + 1}</p>
                            <p className="text-[10px] text-gray-400 uppercase">Click to view</p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 p-8 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-400">No documents uploaded for this listing.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Enquiry Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 sticky top-28">
              <h3 className="text-xl font-bold text-[#002366] mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Seller
              </h3>

              {user ? (
                <div className="space-y-4">
                  <button
                    onClick={handleStartChat}
                    disabled={chatLoading || user.uid === business.ownerId}
                    className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-[#001a4d] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {chatLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    {user.uid === business.ownerId ? "Your Listing" : "Chat with Vendor"}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-400 font-bold">Or send enquiry</span>
                    </div>
                  </div>

                  {sent ? (
                  <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center">
                    <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-green-800 mb-2">Enquiry Sent!</h4>
                    <p className="text-sm text-green-600">The seller will get back to you shortly via email or phone.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendEnquiry} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Your Message</label>
                      <textarea
                        required
                        rows={5}
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] transition-all resize-none"
                        placeholder="I'm interested in this business. Please provide more details..."
                        value={enquiry}
                        onChange={(e) => setEnquiry(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={enquiryMutation.isPending}
                      className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-[#001a4d] transition-all shadow-lg disabled:opacity-50"
                    >
                      {enquiryMutation.isPending ? "Sending..." : "Send Enquiry"}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">
                      By sending, you agree to our Terms and Privacy Policy.
                    </p>
                  </form>
                )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                    <Info className="h-8 w-8 text-[#002366] mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Please login to contact the seller and view documents.</p>
                  </div>
                  <Link
                    to="/login"
                    className="block w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-[#001a4d] transition-all"
                  >
                    Login to Contact
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[#002366] mb-8">Similar Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarListings.map((biz: any) => (
                <div key={biz.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={biz.images?.[0] || `https://picsum.photos/seed/${biz.id}/400/300`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{biz.title}</h4>
                    <p className="text-xs text-gray-500 mb-3">{biz.location}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#002366]">₹{biz.price.toLocaleString("en-IN")}</span>
                      <Link 
                        to={`/business/${biz.id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
