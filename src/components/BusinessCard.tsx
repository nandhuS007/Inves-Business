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
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 italic">
            {business.category}
          </span>
          <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
            <MapPin className="h-3 w-3" />
            {business.location}
          </div>
        </div>

        <h3 className="text-xl font-serif font-bold text-brand-primary mb-4 line-clamp-1 group-hover:text-blue-700 transition-colors leading-tight">
          {business.title}
        </h3>
        
        <div className="h-px bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 mb-5"></div>

        <div className="flex items-end justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-1">Valuation</span>
            <div className="flex items-baseline text-brand-primary font-serif italic">
              <span className="text-sm mr-1 mt-0.5">₹</span>
              <span className="text-2xl font-bold leading-none tracking-tight">{business.price.toLocaleString("en-IN")}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-1">Security</span>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-sm border border-green-100">
               <TrendingUp className="h-3 w-3" />
               <span className="text-[10px] font-bold uppercase">Verified</span>
            </div>
          </div>
        </div>

        <Link
          to={`/business/${business.id}`}
          className="group/btn relative block w-full text-center py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all overflow-hidden border border-brand-primary/10 hover:border-brand-primary/30"
        >
          <span className="relative z-10 text-brand-primary group-hover/btn:text-white transition-colors">Analyze Asset</span>
          <div className="absolute inset-0 bg-brand-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </div>
    </motion.div>
  );
};
