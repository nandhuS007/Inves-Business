import React from "react";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router-dom";
import { Plus, Briefcase, MessageSquare, CreditCard, AlertCircle, CheckCircle2, Edit3, Trash2, TrendingUp, User, Send } from "lucide-react";
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
      const q = query(collection(db, "businesses"), where("ownerId", "==", user.uid));
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
      await deleteDoc(doc(db, "businesses", id));
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002366] mb-2">Vendor Dashboard</h1>
            <p className="text-gray-500">Manage your business listings and track enquiries.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-white text-[#002366] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
            >
              <User className="h-5 w-5" />
              Edit Profile
            </Link>
            <Link
              to="/add-listing"
              className="flex items-center gap-2 bg-[#002366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add New Listing
            </Link>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-blue-50 p-4 rounded-2xl">
                <CreditCard className="h-8 w-8 text-[#002366]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Subscription Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  {subscriptionActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-bold text-green-600">Active - {profile?.subscription?.planId} Plan</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-bold text-yellow-600">No Active Subscription</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!subscriptionActive && (
              <Link
                to="/pricing"
                className="bg-[#002366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all"
              >
                Upgrade Plan
              </Link>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Total Enquiries</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-[#002366]">{enquiries.length}</span>
              <span className="text-sm text-green-500 font-bold mb-1">+12%</span>
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
