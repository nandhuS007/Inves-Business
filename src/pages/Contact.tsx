import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { motion } from "motion/react";

export const Contact = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-[#002366] mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-500 font-light">We're here to help you navigate your business journey.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-8">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Mail className="h-6 w-6 text-[#002366]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Email Us</h4>
                  <p className="text-sm text-gray-500">support@inves4business.com</p>
                  <p className="text-sm text-gray-500">sales@inves4business.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-8">
                <div className="bg-green-50 p-3 rounded-xl">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Call Us</h4>
                  <p className="text-sm text-gray-500">+91 1800 123 4567</p>
                  <p className="text-sm text-gray-500">Mon-Sat, 9am - 6pm</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-50 p-3 rounded-xl">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Visit Us</h4>
                  <p className="text-sm text-gray-500">Level 5, Corporate Tower</p>
                  <p className="text-sm text-gray-500">MG Road, Bangalore, 560001</p>
                </div>
              </div>
            </div>

            <div className="bg-[#002366] p-8 rounded-3xl text-white shadow-xl">
              <Clock className="h-8 w-8 mb-4 text-blue-300" />
              <h4 className="text-xl font-bold mb-2">Response Time</h4>
              <p className="text-blue-100 text-sm leading-relaxed">
                Our team typically responds to all enquiries within 24 business hours. For urgent subscription issues, please use our priority support line.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
              {sent ? (
                <div className="text-center py-20">
                  <div className="bg-green-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button 
                    onClick={() => setSent(false)}
                    className="mt-8 text-[#002366] font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        required
                        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] transition-all"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#002366] transition-all resize-none"
                      placeholder="Tell us more about your enquiry..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#002366] text-white py-4 rounded-2xl font-bold hover:bg-[#001a4d] transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Send className="h-5 w-5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
