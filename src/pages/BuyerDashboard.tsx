import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { MessageSquare, Calendar, ArrowRight, ExternalLink, Heart, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BusinessCard } from "../components/BusinessCard";
import { chatService } from "../lib/chat";

export const BuyerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        console.log("Fetching buyer dashboard data for UID:", user.uid);
        // Fetch Enquiries
        const q = query(
          collection(db, "enquiries"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        console.log("Found enquiries:", querySnapshot.size);
        const enquiriesData = await Promise.all(querySnapshot.docs.map(async (enqDoc) => {
          const data = enqDoc.data();
          let businessTitle = "Loading...";
          try {
            const bizDoc = await getDoc(doc(db, "listings", data.businessId));
            if (bizDoc.exists()) {
              businessTitle = bizDoc.data().title;
            } else {
              businessTitle = "Business No Longer Available";
            }
          } catch (e) {
            businessTitle = "Error loading title";
          }
          return {
            id: enqDoc.id,
            ...data,
            businessTitle
          };
        }));
        setEnquiries(enquiriesData);

        // Fetch Favorites
        if (profile?.favorites && profile.favorites.length > 0) {
          console.log("Fetching favorites:", profile.favorites.length);
          const favsData = await Promise.all(profile.favorites.map(async (id: string) => {
            const bizDoc = await getDoc(doc(db, "listings", id));
            return bizDoc.exists() ? { id: bizDoc.id, ...bizDoc.data() } : null;
          }));
          setFavorites(favsData.filter(f => f !== null));
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.message?.includes("permission")) {
          console.warn("Permission denied. Check if userId matches user.uid and rules are correct.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile?.favorites]);

  const handleStartChat = async (businessId: string, businessTitle: string, sellerId: string) => {
    if (!user) return;
    try {
      const chat = await chatService.getOrCreateChat(
        businessId,
        businessTitle,
        user.uid,
        sellerId
      );
      navigate("/messages", { state: { selectedChatId: chat.id } });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  if (profile?.role !== "user") {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-[#002366] p-4 rounded-2xl text-white shadow-lg">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#002366]">My Enquiries</h1>
            <p className="text-gray-500">Track your conversations with business sellers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            ))
          ) : enquiries.length > 0 ? (
            enquiries.map((enquiry) => (
              <motion.div
                key={enquiry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{enquiry.businessTitle}</h3>
                    <p className="text-sm text-gray-500 mb-2">Business ID: {enquiry.businessId}</p>
                    <p className="text-gray-600 line-clamp-2 italic">"{enquiry.message}"</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleStartChat(enquiry.businessId, enquiry.businessTitle, enquiry.vendorId)}
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                    >
                      <Send className="h-4 w-4" />
                      Chat
                    </button>
                    <Link 
                      to={`/business/${enquiry.businessId}`}
                      className="flex items-center gap-2 text-sm font-bold text-[#002366] hover:underline"
                    >
                      View Business
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-gray-100">
              <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No enquiries yet</h3>
              <p className="text-gray-500 mb-8">Start browsing businesses and contact sellers to see your enquiries here.</p>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 bg-[#002366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all shadow-lg"
              >
                Browse Businesses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Saved Favorites Section */}
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-red-500 p-4 rounded-2xl text-white shadow-lg">
              <Heart className="h-8 w-8 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#002366]">Saved Favorites</h1>
              <p className="text-gray-500">Businesses you've bookmarked for later.</p>
            </div>
          </div>

          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.map(biz => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 border-dashed">
              <p className="text-gray-400 font-medium">No saved favorites yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
