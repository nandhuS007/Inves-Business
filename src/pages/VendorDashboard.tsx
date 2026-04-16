import React from "react";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router-dom";
import { Plus, Briefcase, MessageSquare, CreditCard, AlertCircle, CheckCircle2, Edit3, Trash2, TrendingUp, User, Send, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/Skeleton";
import { chatService } from "../lib/chat";
import { useNavigate } from "react-router-dom";

export const VendorDashboard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch Vendor Listings
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["vendor-listings", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "listings"), where("ownerId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user
  });

  // Fetch Vendor Enquiries
  const { data: enquiries = [], isLoading: enquiriesLoading } = useQuery({
    queryKey: ["vendor-enquiries", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "enquiries"), where("vendorId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user
  });

  // Delete Listing Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "listings", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-listings"] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStartChat = async (businessId: string, businessTitle: string, buyerId: string) => {
    if (!user) return;
    try {
      const chat = await chatService.getOrCreateChat(
        businessId,
        businessTitle,
        buyerId,
        user.uid
      );
      navigate("/messages", { state: { selectedChatId: chat.id } });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const subscriptionActive = profile?.subscription?.active && new Date(profile.subscription.expiryDate) > new Date();
  const loading = listingsLoading || enquiriesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-16">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-bold tracking-widest uppercase mb-4 text-brand-primary"
            >
              Professional Interface
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-primary mb-4 leading-tight tracking-tight">Vendor Management <span className="italic text-gray-400">Hub</span></h1>
            <p className="text-gray-500 font-sans max-w-xl text-lg leading-relaxed">Oversee your assets, monitor potential acquisitions, and coordinate through our secure communication channel.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/profile"
              className="group flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-xl font-bold border border-gray-200 shadow-sm hover:border-brand-primary/20 transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary/5 transition-colors">
                <User className="h-4 w-4 text-gray-500 group-hover:text-brand-primary" />
              </div>
              <span className="text-sm">Account Matrix</span>
            </Link>
            <Link
              to="/add-listing"
              className="flex items-center gap-3 bg-brand-primary text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-brand-primary/10 hover:bg-black transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm uppercase tracking-widest font-bold">New Asset</span>
            </Link>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs group hover:border-brand-primary/10 transition-colors">
             <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-blue-50 text-brand-primary group-hover:scale-110 transition-transform">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded">HEALTHY</div>
             </div>
             <div className="text-3xl font-serif font-bold text-brand-primary mb-1">{listings.length}</div>
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Listings</div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs group hover:border-brand-primary/10 transition-colors">
             <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">PENDING</div>
             </div>
             <div className="text-3xl font-serif font-bold text-brand-primary mb-1">{enquiries.length}</div>
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Inquiries</div>
          </div>

          <div className="md:col-span-2 bg-brand-primary text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">Member Tier</div>
                <h3 className="text-2xl font-serif font-bold mb-4">{profile?.subscription?.planId || 'Standard'} Intelligence</h3>
                <div className="flex items-center gap-4 text-xs font-medium text-white/70">
                   <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded">
                      <CreditCard className="h-3 w-3" />
                      {subscriptionActive ? 'Subscription Active' : 'No Active Plan'}
                   </div>
                   {subscriptionActive && (
                     <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded">
                       <Calendar className="h-3 w-3" />
                       Renew: {new Date(profile.subscription.expiryDate).toLocaleDateString()}
                     </div>
                   )}
                </div>
              </div>
              {!subscriptionActive && (
                <Link
                  to="/pricing"
                  className="bg-white text-brand-primary px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-brand-primary/20"
                >
                  Acquire Access
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* My Listings */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002366] flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Listings
              </h2>
              <Link to="/vendor/listings" className="text-sm font-bold text-[#002366] hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : listings.length > 0 ? (
                listings.slice(0, 3).map((biz: any) => (
                  <div key={biz.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                    <img 
                      src={biz.images?.[0] || `https://picsum.photos/seed/${biz.id}/200/200`} 
                      className="h-16 w-16 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{biz.title}</h4>
                      <p className="text-xs text-gray-500">{biz.location} • ₹{biz.price.toLocaleString("en-IN")}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                          <TrendingUp className="h-3 w-3" />
                          {biz.views || 0} Views
                        </div>
                        {biz.adminFeedback && (
                          <p className="text-[10px] text-red-500 italic">Feedback: {biz.adminFeedback}</p>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full",
                      biz.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {biz.status.replace("_", " ")}
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        to={`/edit-listing/${biz.id}`}
                        className="p-2 text-gray-400 hover:text-[#002366] transition-colors"
                        title="Edit Listing"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(biz.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 font-medium">No listings yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Enquiries */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#002366] flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Enquiries
              </h2>
              <Link to="/vendor/enquiries" className="text-sm font-bold text-[#002366] hover:underline">View All</Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : enquiries.length > 0 ? (
                enquiries.slice(0, 3).map((enq: any) => {
                  const businessTitle = (listings as any[]).find((l: any) => l.id === enq.businessId)?.title || "Business";
                  return (
                    <div key={enq.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">Enquiry for {businessTitle}</h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleStartChat(enq.businessId, businessTitle, enq.userId)}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            <Send className="h-3 w-3" />
                            Chat
                          </button>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(enq.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 italic">"{enq.message}"</p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 font-medium">No enquiries yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
