import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Navbar } from "../components/Navbar";
import { BusinessCard } from "../components/BusinessCard";
import { User, Briefcase, MapPin, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import { motion } from "motion/react";

export const VendorProfile = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!id) return;
      try {
        // Fetch Vendor Public Profile
        const publicDoc = await getDoc(doc(db, "public_profiles", id));
        if (publicDoc.exists()) {
          setVendor({ id: publicDoc.id, ...publicDoc.data() });
        }

        // Fetch Vendor Listings
        const q = query(
          collection(db, "businesses"),
          where("ownerId", "==", id),
          where("status", "==", "approved")
        );
        const snapshot = await getDocs(q);
        const listingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(listingData);

        // Fallback vendor name if public profile doesn't exist yet
        if (!publicDoc.exists() && listingData.length > 0) {
          const firstListing = listingData[0] as any;
          setVendor({
            id,
            name: firstListing.ownerName || "Verified Vendor",
            role: "vendor",
            createdAt: firstListing.createdAt
          });
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!vendor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Vendor not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <header className="bg-[#002366] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white/10 p-1 rounded-full backdrop-blur-md">
              <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center text-[#002366]">
                <User className="h-16 w-16" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-extrabold">{vendor.name}</h1>
                <ShieldCheck className="h-6 w-6 text-blue-300" />
              </div>
              <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                Professional Business Vendor on Inves4Business since {new Date(vendor.createdAt || Date.now()).getFullYear()}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-300" />
                  <span>{listings.length} Active Listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-300" />
                  <span>Verified Seller</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#002366] mb-6">Vendor Information</h3>
              <div className="space-y-4">
                {vendor.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span>Joined {new Date(vendor.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="w-full mt-8 bg-[#002366] text-white py-3 rounded-xl font-bold hover:bg-[#001a4d] transition-all">
                Contact Vendor
              </button>
            </div>
          </div>

          {/* Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#002366] mb-8">Listings by {vendor.name}</h2>
            
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {listings.map(biz => (
                  <BusinessCard key={biz.id} business={biz} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-medium">No active listings at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
