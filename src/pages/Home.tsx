import React, { useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Navbar } from "../components/Navbar";
import { BusinessCard } from "../components/BusinessCard";
import { Search, Filter, Briefcase, TrendingUp, ShieldCheck, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { BusinessCardSkeleton } from "../components/Skeleton";
import { SEO } from "../components/SEO";

export const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      console.log("Fetching listings. Auth State:", auth.currentUser ? `Logged in as ${auth.currentUser.uid}` : "Not logged in");
      const q = query(
        collection(db, "listings"),
        where("status", "==", "approved")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  });

  const filteredListings = listings.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category ? item.category === category : true;
    const matchesLocation = location ? item.location.toLowerCase().includes(location.toLowerCase()) : true;
    const matchesMinPrice = minPrice ? item.price >= Number(minPrice) : true;
    const matchesMaxPrice = maxPrice ? item.price <= Number(maxPrice) : true;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setLocation("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO />
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-brand-primary text-white pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-widest uppercase mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                The Standard in High-Value Asset Exchange
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-[1.1] tracking-tight"
              >
                Acquire Your Next <span className="italic text-blue-300">Legacy Business</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-blue-100/80 mb-12 font-sans max-w-xl leading-relaxed"
              >
                A curated marketplace for verified, high-performing businesses. Secure, confidential, and professional brokerage for the modern entrepreneur.
              </motion.p>

              {/* Search Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-morphism p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search industry or location..."
                    className="w-full pl-12 pr-4 py-4 text-gray-900 outline-none rounded-xl font-sans"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100/80 hover:bg-gray-200 text-brand-primary rounded-xl font-bold transition-all border border-gray-200"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                  Search
                </button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-1 hidden lg:block"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-[40px] blur-2xl group-hover:blur-3xl transition-all"></div>
                <img 
                  src="https://picsum.photos/seed/business/800/1000?grayscale" 
                  alt="Modern Business" 
                  referrerPolicy="no-referrer"
                  className="rounded-[32px] shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute -bottom-6 -left-6 glass-morphism p-6 rounded-2xl shadow-xl z-20 border border-white/40">
                  <div className="text-brand-primary font-serif italic text-2xl mb-1">₹10Cr+</div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Quarterly Volume</div>
                </div>
                <div className="absolute -top-6 -right-6 glass-morphism p-6 rounded-2xl shadow-xl z-20 border border-white/40">
                  <div className="text-brand-primary font-serif italic text-2xl mb-1">100%</div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Verified Sellers</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-12 glass-morphism rounded-3xl overflow-hidden text-gray-900 shadow-2xl border border-white/20"
              >
                <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3">Asset Intelligence</label>
                    <select 
                      className="w-full p-4 bg-white/10 text-white border border-white/10 rounded-xl outline-none focus:border-white/30 transition-all font-sans"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="" className="bg-brand-primary">All Jurisdictions</option>
                      <option className="bg-brand-primary">Micro Business</option>
                      <option className="bg-brand-primary">Partnership Sale</option>
                      <option className="bg-brand-primary">Full Business</option>
                      <option className="bg-brand-primary">Investment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3">Geographic Scope</label>
                    <input 
                      type="text"
                      placeholder="e.g. Mumbai"
                      className="w-full p-4 bg-white/10 text-white border border-white/10 rounded-xl outline-none focus:border-white/30 transition-all placeholder:text-blue-100/30 font-sans"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3">Capital Minimum</label>
                    <input 
                      type="number"
                      placeholder="Min Price"
                      className="w-full p-4 bg-white/10 text-white border border-white/10 rounded-xl outline-none focus:border-white/30 transition-all placeholder:text-blue-100/30 font-sans"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3">Capital Maximum</label>
                    <input 
                      type="number"
                      placeholder="Max Price"
                      className="w-full p-4 bg-white/10 text-white border border-white/10 rounded-xl outline-none focus:border-white/30 transition-all placeholder:text-blue-100/30 font-sans"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-white/5 p-6 flex justify-between items-center border-t border-white/10">
                  <button 
                    onClick={clearFilters}
                    className="text-[10px] font-bold text-blue-300 hover:text-white flex items-center gap-1 uppercase tracking-widest transition-colors"
                  >
                    <X className="h-4 w-4" /> Reset Filters
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="bg-white text-brand-primary hover:bg-black hover:text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Apply Matrix
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-blue-50">
              <div className="bg-[#002366] p-3 rounded-xl text-white">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#002366]">500+</h3>
                <p className="text-sm text-gray-500 font-medium">Active Listings</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-green-50">
              <div className="bg-green-600 p-3 rounded-xl text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-700">₹10Cr+</h3>
                <p className="text-sm text-gray-500 font-medium">Capital Invested</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-purple-50">
              <div className="bg-purple-600 p-3 rounded-xl text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-purple-700">100%</h3>
                <p className="text-sm text-gray-500 font-medium">Verified Sellers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#002366] mb-2">Featured Opportunities</h2>
            <p className="text-gray-500">Hand-picked premium businesses for sale</p>
          </div>
          <div className="text-sm font-medium text-gray-400">
            Showing {filteredListings.length} results
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Error loading listings</h3>
            <p className="text-red-600 mb-4">{(error as any).message || "Please try refreshing the page."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold active:scale-95"
            >
              Retry
            </button>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((biz: any) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center gap-1 group">
              <div className="relative flex items-center justify-center">
                <div className="bg-[#002366] p-2 rounded-xl shadow-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-white stroke-[2.5]" />
                </div>
                <Briefcase className="h-2.5 w-2.5 text-white absolute -top-0.5 -right-0.5 bg-[#002366] rounded-full p-0.5" />
              </div>
              <span className="text-xl font-serif font-black text-[#002366] tracking-tight leading-none uppercase italic">Inves4Business</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500 font-medium">
              <Link to="/about" className="hover:text-[#002366] transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-[#002366] transition-colors">Contact</Link>
              <a href="#" className="hover:text-[#002366] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#002366] transition-colors">Terms</a>
            </div>
            <div className="text-sm text-gray-400">
              © 2026 Inves4Business. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
