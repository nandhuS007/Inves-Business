import React, { useState, useEffect } from "react";
import { MapPin, IndianRupee, TrendingUp, Calendar, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

interface BusinessListing {
  id: string;
  title: string;
  category: string;
  price: number;
  location: string;
  description: string;
  images: string[];
  isFeatured?: boolean;
  status: string;
}

export const BusinessCard: React.FC<{ business: BusinessListing }> = ({ business }) => {
  const { user, profile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (profile?.favorites) {
      setIsFavorite(profile.favorites.includes(business.id));
    }
  }, [profile, business.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to save favorites");
    
    setFavLoading(true);
    try {
      const userRef = doc(db, "users", profile?.id || "");
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(business.id)
        });
        setIsFavorite(false);
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(business.id)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={business.images?.[0] || `https://picsum.photos/seed/${business.id}/800/600`}
          alt={business.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={toggleFavorite}
          disabled={favLoading}
          className={cn(
            "absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all",
            isFavorite ? "bg-red-500 text-white" : "bg-white/80 text-gray-600 hover:bg-white"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
        {business.isFeatured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            Featured
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-[#002366] text-white px-3 py-1 rounded-md text-xs font-medium">
          {business.category}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-[#002366] mb-2 line-clamp-1 group-hover:text-blue-700 transition-colors">
          {business.title}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{business.location}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Asking Price</span>
            <div className="flex items-center text-[#002366] font-bold">
              <IndianRupee className="h-4 w-4" />
              <span className="text-lg">{business.price.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Status</span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full mt-1",
              business.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            )}>
              {business.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <Link
          to={`/business/${business.id}`}
          className="block w-full text-center bg-[#002366] text-white py-2.5 rounded-lg font-semibold hover:bg-[#001a4d] transition-all shadow-sm"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
};
