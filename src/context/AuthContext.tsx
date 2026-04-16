import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "seller" | "admin";
  status: "active" | "blocked" | "Unverified";
  favorites?: string[];
  subscription?: {
    planId: string;
    active: boolean;
    expiryDate: string;
    listingCount: number;
  };
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (token: string, firebaseToken: string, userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!auth.currentUser) {
      console.warn("refreshUser called but no auth.currentUser");
      return;
    }
    try {
      console.log("Refreshing user profile for UID:", auth.currentUser.uid);
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        console.log("Profile refreshed successfully:", userData.role);
        setProfile(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        console.warn("User document not found for UID:", auth.currentUser.uid);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const firebaseToken = localStorage.getItem("firebaseToken");
    
    const initAuth = async () => {
      if (token && savedUser && firebaseToken) {
        try {
          console.log("Attempting re-authentication with Firebase...");
          const userCredential = await signInWithCustomToken(auth, firebaseToken);
          console.log("Re-authentication successful for UID:", userCredential.user.uid);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          if (userCredential.user) {
            // Fetch fresh profile data
            console.log("Fetching fresh profile data for UID:", userCredential.user.uid);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            if (userDoc.exists()) {
              const freshData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
              console.log("Fresh profile data fetched successfully");
              setProfile(freshData);
              localStorage.setItem("user", JSON.stringify(freshData));
            } else {
              console.warn("User document not found in Firestore for UID:", userCredential.user.uid);
              setProfile(parsedUser);
            }
          }
        } catch (error: any) {
          console.error("Failed to re-authenticate with Firebase:", error);
          if (error.code === 'permission-denied') {
            console.error("Firestore permission denied. Check security rules for /users/{userId}");
          }
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (token: string, firebaseToken: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("firebaseToken", firebaseToken);
    localStorage.setItem("user", JSON.stringify(userData));
    
    await signInWithCustomToken(auth, firebaseToken);
    
    setUser(userData);
    setProfile(userData);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firebaseToken");
    localStorage.removeItem("user");
    signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
