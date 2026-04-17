import React, { useEffect, useState } from "react";
import { onSnapshot, collection, query, doc, updateDoc, deleteDoc, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, Briefcase, CheckCircle2, XCircle, Eye, TrendingUp, DollarSign, MessageSquare, AlertCircle, CreditCard, Search, Settings } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { EnvSettingsModal } from "../components/EnvSettingsModal";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "users" | "orders" | "documents" | "enquiries">("listings");
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);

  // Real-time Listeners
  useEffect(() => {
    if (profile?.role !== "admin") return;

    const unsubListings = onSnapshot(collection(db, "listings"), (snap) => {
      setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubEnquiries = onSnapshot(collection(db, "enquiries"), (snap) => {
      setEnquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDocs = onSnapshot(collection(db, "documents"), (snap) => {
      setDocuments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);

    return () => {
      unsubListings();
      unsubUsers();
      unsubOrders();
      unsubEnquiries();
      unsubDocs();
    };
  }, [profile]);

  // Metrics
  const stats = {
    totalUsers: users.length,
    totalListings: listings.length,
    activeListings: listings.filter(l => l.status === "approved").length,
    pendingListings: listings.filter(l => l.status === "under_review").length,
    totalRevenue: orders.filter(o => o.paymentStatus === "paid").reduce((acc, o) => acc + (o.amount || 0), 0),
    totalSellers: users.filter(u => u.role === "seller").length
  };

  // Chart Data
  const revenueByPlan = orders
    .filter(o => o.paymentStatus === "paid")
    .reduce((acc: any, o: any) => {
      acc[o.plan] = (acc[o.plan] || 0) + (o.amount || 0);
      return acc;
    }, {});

  const revenueData = Object.keys(revenueByPlan).map(key => ({ name: key, value: revenueByPlan[key] }));

  const userData = [
    { name: 'Sellers', value: stats.totalSellers },
    { name: 'Investors', value: users.filter((u: any) => u.role === "user").length },
  ];

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      const listing = listings.find(l => l.id === id);
      const seller = users.find(u => u.uid === listing.ownerId);
      const currentFeedback = feedback[id] || "";

      await updateDoc(doc(db, "listings", id), { 
        status,
        adminFeedback: currentFeedback,
        updatedAt: new Date().toISOString()
      });

      // Notify seller (backend call for email)
      if (seller?.email) {
        fetch("/api/admin/notify-listing-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorEmail: seller.email,
            businessTitle: listing.title,
            status,
            feedback: currentFeedback
          })
        }).catch(err => console.error("Notification failed", err));
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUserAction = async (userId: string, action: "block" | "activate" | "make_seller" | "make_user") => {
    try {
      if (action === "block") {
        await updateDoc(doc(db, "users", userId), { status: "blocked" });
      } else if (action === "activate") {
        await updateDoc(doc(db, "users", userId), { status: "active" });
      } else if (action === "make_seller") {
        await updateDoc(doc(db, "users", userId), { role: "seller" });
      } else if (action === "make_user") {
        await updateDoc(doc(db, "users", userId), { role: "user" });
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Permanently delete this listing?")) return;
    try {
      await deleteDoc(doc(db, "listings", listingId));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const handleDocumentAction = async (docId: string, status: "verified" | "rejected") => {
    try {
      await updateDoc(doc(db, "documents", docId), { status });
    } catch (error) {
      console.error("Error verifying document:", error);
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
          <div className="ml-auto">
            <button 
              onClick={() => setIsEnvModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 text-[#002366]" />
              Platform Settings
            </button>
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
            <p className="text-3xl font-black text-[#002366]">{stats.totalListings}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <TrendingUp className="h-6 w-6 text-yellow-600 mb-4" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pending Review</p>
            <p className="text-3xl font-black text-yellow-600">{stats.pendingListings}</p>
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
              { id: "orders", label: "Revenue", icon: DollarSign },
              { id: "enquiries", label: "Enquiries", icon: MessageSquare },
              { id: "documents", label: "Verification", icon: ShieldCheck }
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
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listings.filter(b => 
                    b.title.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(listing => (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/100/100`} className="h-12 w-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{listing.title}</span>
                            <span className="text-xs text-gray-400">{listing.category} | ₹{listing.price?.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase",
                          listing.status === "approved" ? "bg-green-100 text-green-700" :
                          listing.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        )}>
                          {listing.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {listing.status === "under_review" && (
                            <>
                              <button onClick={() => handleStatusUpdate(listing.id, "approved")} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle2 className="h-4 w-4" /></button>
                              <button onClick={() => handleStatusUpdate(listing.id, "rejected")} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle className="h-4 w-4" /></button>
                            </>
                          )}
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                          <Link to={`/business/${listing.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Eye className="h-4 w-4" /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Role</th>
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
                          <span className="font-bold text-gray-900">{user.name}</span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-full uppercase">{user.role}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          user.status === "blocked" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                          {user.status || "active"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {user.status !== "blocked" ? (
                            <button onClick={() => handleUserAction(user.id, "block")} className="text-xs font-bold text-red-600 hover:underline">Block</button>
                          ) : (
                            <button onClick={() => handleUserAction(user.id, "activate")} className="text-xs font-bold text-green-600 hover:underline">Unblock</button>
                          )}
                          {user.role === "user" ? (
                            <button onClick={() => handleUserAction(user.id, "make_seller")} className="text-xs font-bold text-blue-600 hover:underline">Promote to Seller</button>
                          ) : user.role === "seller" && (
                            <button onClick={() => handleUserAction(user.id, "make_user")} className="text-xs font-bold text-gray-600 hover:underline">Demote to Buyer</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Plan</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-sm font-bold text-gray-900">{users.find(u => u.uid === order.userId)?.name || "User"}</td>
                      <td className="px-8 py-6 text-xs font-bold text-blue-600">{order.plan}</td>
                      <td className="px-8 py-6 font-bold text-green-600">₹{order.amount?.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className="p-20 text-center text-gray-400">No transactions yet.</div>}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Document</th>
                    <th className="px-8 py-4">Linked Listing</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          View {doc.type?.replace("_", " ")}
                        </a>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500">
                        {listings.find(l => l.id === doc.listingId)?.title || "Unknown Listing"}
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          doc.status === "verified" ? "bg-green-100 text-green-700" :
                          doc.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {doc.status || "pending"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleDocumentAction(doc.id, "verified")} className="text-xs font-bold text-green-600 hover:underline">Verify</button>
                          <button onClick={() => handleDocumentAction(doc.id, "rejected")} className="text-xs font-bold text-red-600 hover:underline">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length === 0 && <div className="p-20 text-center text-gray-400">No documents for review.</div>}
            </div>
          )}

          {activeTab === "enquiries" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Investor</th>
                    <th className="px-8 py-4">Business</th>
                    <th className="px-8 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enquiries.map(enq => (
                    <tr key={enq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-500">{new Date(enq.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-6 font-bold text-gray-900">{users.find(u => u.uid === enq.userId)?.name || "Investor"}</td>
                      <td className="px-8 py-6 text-[#002366] font-medium">{listings.find(l => l.id === enq.businessId)?.title || "Listing"}</td>
                      <td className="px-8 py-6 text-sm text-gray-500 italic line-clamp-1">"{enq.message}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <EnvSettingsModal 
        isOpen={isEnvModalOpen} 
        onClose={() => setIsEnvModalOpen(false)} 
      />
    </div>
  );
};
