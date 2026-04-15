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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-[#002366] mb-4 tracking-tight">Choose Your Growth Plan</h1>
          <p className="text-xl text-gray-500 font-light">
            Select the perfect plan to showcase your business to thousands of potential investors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={cn(
                "bg-white rounded-3xl p-8 shadow-xl border-2 transition-all relative overflow-hidden flex flex-col",
                plan.popular ? "border-[#002366] scale-105 z-10" : "border-transparent"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#002366] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                  Most Popular
                </div>
              )}

              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6", plan.color)}>
                <plan.icon className={cn("h-8 w-8", plan.textColor)} />
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-[#002366]">₹{plan.price}</span>
                <span className="text-gray-400 font-bold">/month</span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePayment(plan)}
                disabled={loading !== null}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                  plan.popular 
                    ? "bg-[#002366] text-white hover:bg-[#001a4d]" 
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                )}
              >
                {loading === plan.id ? "Processing..." : `Get Started with ${plan.name}`}
                {loading !== plan.id && <ArrowRight className="h-4 w-4" />}
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
