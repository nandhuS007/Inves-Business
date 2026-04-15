import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, User, Building2 } from "lucide-react";
import { chatService, Message, Chat } from "../../lib/chat";
import { useAuth } from "../../context/AuthContext";
import { motion } from "motion/react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface ChatWindowProps {
  chat: Chat;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientId = chat.participants.find(id => id !== profile?.uid) || "";

  const { data: recipientProfile } = useQuery({
    queryKey: ["public-profile", recipientId],
    queryFn: async () => {
      if (!recipientId) return null;
      const docRef = doc(db, "public_profiles", recipientId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!recipientId
  });

  useEffect(() => {
    if (!chat.id) return;

    const unsubscribe = chatService.subscribeToMessages(chat.id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      // Mark as seen when messages are received and window is open
      if (profile?.uid) {
        chatService.markAsSeen(chat.id, profile.uid);
      }
    });

    return () => unsubscribe();
  }, [chat.id, profile?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile?.uid) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      await chatService.sendMessage(chat.id, profile.uid, recipientId, text);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full lg:hidden">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
        )}
        <div className="h-10 w-10 rounded-full bg-[#002366]/10 flex items-center justify-center">
          <User className="h-6 w-6 text-[#002366]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">
            {recipientProfile?.name || "User"}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{chat.businessTitle}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002366]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Send className="h-8 w-8 opacity-20" />
            </div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === profile?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? "bg-[#002366] text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1 flex items-center gap-1 ${
                      isMe ? "text-blue-100/70" : "text-gray-400"
                    }`}
                  >
                    {msg.createdAt && format(msg.createdAt.toDate(), "HH:mm")}
                    {isMe && (
                      <span className="ml-1">
                        {msg.status === 'seen' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#002366]/20 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#002366] text-white p-2 rounded-xl hover:bg-[#001a4d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
