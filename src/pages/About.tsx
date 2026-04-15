import React from "react";
import { Navbar } from "../components/Navbar";
import { Briefcase, ShieldCheck, Users, Globe, Award, Heart } from "lucide-react";
import { motion } from "motion/react";

export const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="bg-[#002366] text-white py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-extrabold mb-6"
            >
              Our Mission
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 max-w-3xl mx-auto font-light"
            >
              To empower entrepreneurs and investors by providing the most transparent, 
              secure, and efficient marketplace for business transitions.
            </motion.p>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-8 w-8 text-[#002366]" />
              </div>
              <h3 className="text-xl font-bold text-[#002366] mb-4">Trust & Security</h3>
              <p className="text-gray-500 leading-relaxed">
                Every listing is manually reviewed by our expert team to ensure data integrity and seller legitimacy.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[#002366] mb-4">Pan-India Reach</h3>
              <p className="text-gray-500 leading-relaxed">
                Connecting buyers and sellers across every state, from micro-startups to established enterprises.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[#002366] mb-4">Expert Guidance</h3>
              <p className="text-gray-500 leading-relaxed">
                Our platform provides the tools and insights needed to make informed investment decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-[#002366] mb-6">The Inves4Business Story</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Founded in 2026, Inves4Business was born out of a simple observation: the process of buying and selling businesses in India was fragmented, opaque, and difficult to navigate.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We set out to build a platform that combines modern technology with rigorous verification standards. Today, we are proud to be the preferred destination for serious investors looking for their next venture.
              </p>
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <Heart className="h-6 w-6 text-red-500" />
                <p className="text-sm font-bold text-[#002366]">Trusted by 10,000+ Entrepreneurs Nationwide</p>
              </div>
            </div>
            <div className="flex-1">
              <img 
                src="https://picsum.photos/seed/office/800/1000" 
                alt="Our Office" 
                className="rounded-3xl shadow-2xl rotate-2"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
