import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { CheckCircle2, ShieldCheck, Zap, Star, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const plans = [
  {
    id: "Silver",
    name: "Silver",
    price: 999,
    listings: 5,
    features: ["5 Business Listings", "Basic Support", "Dashboard Access", "Standard Visibility"],
    color: "bg-gray-100",
    textColor: "text-gray-600",
    icon: Zap
  },
  {
    id: "Gold",
    name: "Gold",
    price: 2499,
    listings: 15,
    features: ["15 Business Listings", "Priority Support", "Dashboard Access", "Enhanced Visibility", "Document Verification"],
    color: "bg-yellow-50",
    textColor: "text-yellow-700",
    icon: Star,
    popular: true
  },
  {
    id: "Platinum",
    name: "Platinum",
    price: 4999,
    listings: 999,
    features: ["Unlimited Listings", "24/7 VIP Support", "Featured Placement", "Social Media Promotion", "Verified Badge"],
    color: "bg-blue-50",
    textColor: "text-[#002366]",
    icon: ShieldCheck
  }
];

export const Pricing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(plan.id);
    try {
      // 1. Create Order on Backend
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price }),
      });
      const order = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: (window as any).RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY", // Should be passed from env
        amount: order.amount,
        currency: order.currency,
        name: "Inves4Business",
        description: `${plan.name} Subscription`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment on Backend
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              userId: user.uid,
              planId: plan.id
            }),
          });
          const result = await verifyRes.json();
          if (result.status === "success") {
            navigate("/vendor");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: profile?.name || "",
          email: user.email || "",
          contact: profile?.phone || ""
        },
        theme: { color: "#002366" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong with the payment process.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 text-brand-primary"
          >
            Transparent Tiering
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-6 leading-tight">Elevate Your <span className="italic text-gray-400">Market Presence</span></h1>
          <p className="text-xl text-gray-500 font-sans leading-relaxed">
            Professional-grade tools and visibility for serious business transactions. Choose the tier that matches your objective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className={cn(
                "bg-white rounded-3xl p-10 border transition-all relative overflow-hidden flex flex-col h-full",
                plan.popular ? "border-brand-primary shadow-2xl scale-[1.02] z-10" : "border-gray-100 shadow-sm hover:shadow-xl"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-brand-primary text-white px-5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                  Most Requested
                </div>
              )}

              <div className="mb-10">
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm", plan.color)}>
                  <plan.icon className={cn("h-8 w-8", plan.textColor)} />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-serif font-bold text-brand-primary leading-none tracking-tighter">₹{plan.price}</span>
                  <span className="text-gray-400 font-bold text-sm tracking-wider uppercase ml-2">/ month</span>
                </div>
              </div>

              <div className="h-px bg-linear-to-r from-gray-50 via-gray-200 to-gray-50 mb-10"></div>

              <ul className="space-y-5 mb-12 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-[13px] text-gray-600 font-medium leading-relaxed">
                    <div className="mt-1">
                      <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePayment(plan)}
                disabled={loading !== null}
                className={cn(
                  "group relative w-full py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all overflow-hidden border",
                  plan.popular 
                    ? "bg-brand-primary text-white border-brand-primary hover:bg-black" 
                    : "bg-white text-brand-primary border-brand-primary/20 hover:border-brand-primary/40"
                )}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading === plan.id ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      Secure {plan.name}
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
          <h3 className="text-2xl font-bold text-[#002366] mb-4">Need a Custom Enterprise Solution?</h3>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            For large brokerage firms or investment groups with more than 50 listings, we offer tailored enterprise packages with dedicated account managers.
          </p>
          <button className="text-[#002366] font-bold hover:underline">Contact Sales Team</button>
        </div>
      </main>
    </div>
  );
};
