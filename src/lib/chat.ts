import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  getDocs,
  increment
} from "firebase/firestore";
import { db } from "./firebase";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: any;
}

export interface Chat {
  id: string;
  businessId: string;
  businessTitle: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount: Record<string, number>;
  updatedAt: any;
}

export const chatService = {
  // Get or create a chat between two users for a specific business
  getOrCreateChat: async (businessId: string, businessTitle: string, buyerId: string, vendorId: string) => {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("businessId", "==", businessId),
      where("participants", "array-contains", buyerId)
    );
    
    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => doc.data().participants.includes(vendorId));
    
    if (existingChat) {
      return { id: existingChat.id, ...existingChat.data() } as Chat;
    }
    
    const newChatData = {
      businessId,
      businessTitle,
      participants: [buyerId, vendorId],
      unreadCount: { [buyerId]: 0, [vendorId]: 0 },
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(chatsRef, newChatData);
    return { id: docRef.id, ...newChatData } as Chat;
  },

  // Send a message
  sendMessage: async (chatId: string, senderId: string, recipientId: string, text: string) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);
    
    const messageData = {
      senderId,
      text,
      status: 'sent',
      createdAt: serverTimestamp()
    };
    
    await addDoc(messagesRef, messageData);
    
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: increment(1)
    });
  },

  // Mark messages as seen
  markAsSeen: async (chatId: string, userId: string) => {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0
    });
  },

  // Listen to user's chats
  subscribeToChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      callback(chats);
    });
  },

  // Listen to messages in a chat
  subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    });
  }
};
