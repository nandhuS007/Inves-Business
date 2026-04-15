import React, { useEffect, useState } from "react";
import { collection, query, getDocs, doc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, Briefcase, CheckCircle2, XCircle, Eye, TrendingUp, DollarSign, MessageSquare, AlertCircle, CreditCard, Search } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "users" | "payments" | "enquiries" | "plans">("listings");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalBusinesses: 0,
    pendingApprovals: 0,
    totalRevenue: 0
  });

  // Chart Data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (profile?.role !== "admin") return;
      try {
        console.log("Admin fetching businesses...");
        const bizSnap = await getDocs(collection(db, "businesses"));
        const bizData = bizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBusinesses(bizData);
        console.log("Admin fetched businesses:", bizData.length);

        console.log("Admin fetching users...");
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        console.log("Admin fetched users:", usersData.length);

        console.log("Admin fetching payments...");
        const paymentsSnap = await getDocs(collection(db, "payments"));
        const paymentsData = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentsData);
        console.log("Admin fetched payments:", paymentsData.length);

        console.log("Admin fetching enquiries...");
        const enquiriesSnap = await getDocs(collection(db, "enquiries"));
        const enquiriesData = enquiriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEnquiries(enquiriesData);
        console.log("Admin fetched enquiries:", enquiriesData.length);

        console.log("Admin fetching plans...");
        const plansSnap = await getDocs(collection(db, "plans"));
        const plansData = plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlans(plansData);
        console.log("Admin fetched plans:", plansData.length);

        setStats({
          totalUsers: usersData.length,
          totalVendors: usersData.filter((u: any) => u.role === "vendor").length,
          totalBusinesses: bizData.length,
          pendingApprovals: bizData.filter((b: any) => b.status === "under_review").length,
          totalRevenue: paymentsData.reduce((acc, p: any) => acc + (p.amount || 0), 0)
        });

        // Prepare Chart Data
        const revByPlan = paymentsData.reduce((acc: any, p: any) => {
          acc[p.planId] = (acc[p.planId] || 0) + (p.amount || 0);
          return acc;
        }, {});
        setRevenueData(Object.keys(revByPlan).map(key => ({ name: key, value: revByPlan[key] })));

        setUserData([
          { name: 'Vendors', value: usersData.filter((u: any) => u.role === "vendor").length },
          { name: 'Buyers', value: usersData.filter((u: any) => u.role === "user").length },
        ]);

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      const biz = businesses.find(b => b.id === id);
      const vendor = users.find(u => u.uid === biz.ownerId);
      const currentFeedback = feedback[id] || "";

      await updateDoc(doc(db, "businesses", id), { 
        status,
        adminFeedback: currentFeedback 
      });

      // Send email notification via backend
      if (vendor?.email) {
        try {
          await fetch("/api/admin/notify-listing-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vendorEmail: vendor.email,
              businessTitle: biz.title,
              status,
              feedback: currentFeedback
            })
          });
        } catch (emailErr) {
          console.error("Failed to send notification email:", emailErr);
        }
      }

      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status, adminFeedback: currentFeedback } : b));
      setStats(prev => ({
        ...prev,
        pendingApprovals: status === "approved" || status === "rejected" ? prev.pendingApprovals - 1 : prev.pendingApprovals
      }));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUserAction = async (userId: string, action: "block" | "delete") => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      if (action === "block") {
        await updateDoc(doc(db, "users", userId), { isBlocked: true });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
      } else {
        // Delete logic would ideally happen via admin SDK on backend
        console.log("Delete user:", userId);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    }
  };

  if (profile?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-[#002366] p-4 rounded-2xl text-white shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#002366]">Admin Command Center</h1>
            <p className="text-gray-500">Oversee marketplace operations and approvals.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Users className="h-6 w-6 text-blue-600 mb-4" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Users</p>
            <p className="text-3xl font-black text-[#002366]">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Briefcase className="h-6 w-6 text-purple-600 mb-4" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Listings</p>
            <p className="text-3xl font-black text-[#002366]">{stats.totalBusinesses}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <TrendingUp className="h-6 w-6 text-yellow-600 mb-4" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pending Review</p>
            <p className="text-3xl font-black text-yellow-600">{stats.pendingApprovals}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <DollarSign className="h-6 w-6 text-green-600 mb-4" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Platform Revenue</p>
            <p className="text-3xl font-black text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#002366] mb-6">Revenue by Plan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="value" fill="#002366" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#002366] mb-6">User Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#002366" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-4 overflow-x-auto pb-2 w-full md:w-auto">
            {[
              { id: "listings", label: "Review Queue", icon: Briefcase },
              { id: "users", label: "User Management", icon: Users },
              { id: "payments", label: "Payments", icon: DollarSign },
              { id: "enquiries", label: "Enquiries", icon: MessageSquare },
              { id: "plans", label: "Plans", icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchTerm("");
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-[#002366] text-white shadow-lg" 
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#002366] text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {activeTab === "listings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Business</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Price</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-8 py-6 h-16 bg-gray-50/50"></td>
                      </tr>
                    ))
                  ) : businesses.filter(b => 
                    b.status === "under_review" && 
                    (b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     b.location.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).map(biz => (
                    <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={biz.images?.[0] || `https://picsum.photos/seed/${biz.id}/100/100`} 
                            className="h-12 w-12 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-gray-900">{biz.title}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500 font-medium">{biz.category}</td>
                      <td className="px-8 py-6 font-bold text-[#002366]">₹{biz.price.toLocaleString()}</td>
                      <td className="px-8 py-6 text-sm text-gray-500">{biz.location}</td>
                      <td className="px-8 py-6">
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">
                          UNDER REVIEW
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <textarea
                            placeholder="Feedback/Reason..."
                            className="text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#002366] w-48"
                            value={feedback[biz.id] || ""}
                            onChange={(e) => setFeedback({ ...feedback, [biz.id]: e.target.value })}
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(biz.id, "approved")}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(biz.id, "rejected")}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                            <Link 
                              to={`/business/${biz.id}`}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && businesses.filter(b => b.status === "under_review").length === 0 && (
                <div className="p-20 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Queue Clear!</h3>
                  <p className="text-gray-500">All business listings have been reviewed.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4">Plan</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.filter(u => 
                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{user.name || "Unnamed User"}</span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          user.role === "admin" ? "bg-purple-100 text-purple-700" : 
                          user.role === "vendor" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500">
                        {user.subscription?.planId || "None"}
                      </td>
                      <td className="px-8 py-6">
                        {user.isBlocked ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">BLOCKED</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTIVE</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUserAction(user.id, "block")}
                            className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                            title="Block User"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleUserAction(user.id, "delete")}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete User"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Plan</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Order ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments
                    .filter(p => {
                      const userName = users.find(u => u.id === p.userId)?.name || "";
                      return userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.planId?.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-gray-900">
                          {users.find(u => u.id === payment.userId)?.name || payment.userId}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-blue-50 text-[#002366] text-[10px] font-bold px-2 py-1 rounded-full">
                          {payment.planId}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold text-green-600">₹{payment.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-xs text-gray-400 font-mono">{payment.orderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="p-20 text-center text-gray-400">No payments recorded yet.</div>
              )}
            </div>
          )}

          {activeTab === "enquiries" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Buyer</th>
                    <th className="px-8 py-4">Business</th>
                    <th className="px-8 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enquiries
                    .filter(e => {
                      const userName = users.find(u => u.id === e.userId)?.name || "";
                      const bizTitle = businesses.find(b => b.id === e.businessId)?.title || "";
                      return userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             bizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             e.message?.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(enq => (
                    <tr key={enq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-500">
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {users.find(u => u.id === enq.userId)?.name || "Buyer"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-[#002366] font-medium">
                          {businesses.find(b => b.id === enq.businessId)?.title || "Business"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-600 line-clamp-1 italic">"{enq.message}"</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {enquiries.length === 0 && (
                <div className="p-20 text-center text-gray-400">No enquiries recorded yet.</div>
              )}
            </div>
          )}

          {activeTab === "plans" && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                  <div key={plan.id} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <CreditCard className="h-16 w-16" />
                    </div>
                    <h3 className="text-2xl font-black text-[#002366] mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-400 text-sm">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features?.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full py-3 bg-white border border-gray-200 text-[#002366] rounded-xl font-bold hover:bg-gray-100 transition-all">
                      Edit Plan
                    </button>
                  </div>
                ))}
              </div>
              {plans.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  No plans found in database.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
