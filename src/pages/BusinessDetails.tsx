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
      const docRef = doc(db, "businesses", id);
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
        collection(db, "businesses"),
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#002366] mb-2">{business.title}</h1>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{business.location}</span>
                  </div>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Asking Price</span>
                  <div className="flex items-center text-2xl font-black text-[#002366]">
                    <IndianRupee className="h-6 w-6" />
                    <span>{business.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img 
                  src={business.images?.[0] || `https://picsum.photos/seed/${business.id}/1200/800`} 
                  alt={business.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <TrendingUp className="h-5 w-5 text-blue-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Revenue</p>
                  <p className="font-bold text-gray-900">₹{business.revenue?.toLocaleString("en-IN") || "N/A"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Profit</p>
                  <p className="font-bold text-gray-900">₹{business.profit?.toLocaleString("en-IN") || "N/A"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <Calendar className="h-5 w-5 text-purple-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Years Active</p>
                  <p className="font-bold text-gray-900">{business.yearsOfOperation || "N/A"} Years</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <ShieldCheck className="h-5 w-5 text-orange-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Category</p>
                  <p className="font-bold text-gray-900">{business.category}</p>
                </div>
              </div>

              <div className="prose max-w-none mb-10">
                <h3 className="text-xl font-bold text-[#002366] mb-4">Business Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{business.description}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center text-[#002366] shadow-sm">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Seller</p>
                    <p className="font-bold text-gray-900">{business.ownerName || "Verified Vendor"}</p>
                  </div>
                </div>
                <Link 
                  to={`/vendor-profile/${business.ownerId}`}
                  className="text-sm font-bold text-[#002366] hover:underline"
                >
                  View Vendor Profile
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
