import React, { useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocsFromServer } from "firebase/firestore";
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
        collection(db, "businesses"),
        where("status", "==", "approved")
      );
      const snapshot = await getDocsFromServer(q);
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
      <section className="bg-[#002366] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
            >
              The Premium Marketplace for <span className="text-blue-300">Business Investments</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 mb-10 font-light"
            >
              Connect with verified sellers and find your next profitable venture.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by title, location or category..."
                  className="w-full pl-12 pr-4 py-4 text-gray-900 outline-none rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-[#002366] rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>
              <button className="bg-[#002366] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#001a4d] transition-all shadow-lg">
                Search
              </button>
            </motion.div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-white rounded-2xl shadow-xl overflow-hidden text-gray-900 text-left"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <select 
                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#002366] bg-white"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option>Micro Business</option>
                        <option>Partnership Sale</option>
                        <option>Full Business</option>
                        <option>Investment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                      <input 
                        type="text"
                        placeholder="e.g. Mumbai"
                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#002366]"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Price Range (Min)</label>
                      <input 
                        type="number"
                        placeholder="Min Price"
                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#002366]"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Price Range (Max)</label>
                      <input 
                        type="number"
                        placeholder="Max Price"
                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#002366]"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-between items-center">
                    <button 
                      onClick={clearFilters}
                      className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X className="h-4 w-4" /> Clear All
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="bg-[#002366] text-white px-6 py-2 rounded-lg text-sm font-bold"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            <p className="text-red-600">Please try refreshing the page.</p>
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
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-[#002366]" />
              <span className="text-lg font-bold text-[#002366]">Inves4Business</span>
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
