import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatService, Chat } from "../lib/chat";
import { ChatList } from "../components/chat/ChatList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { MessageSquare, Search } from "lucide-react";

const MessagesPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = chatService.subscribeToChats(profile.uid, (userChats) => {
      setChats(userChats);
      setLoading(false);
      
      // Handle navigation state for selected chat
      const stateId = location.state?.selectedChatId;
      if (stateId && !selectedChat) {
        const chatToSelect = userChats.find(c => c.id === stateId);
        if (chatToSelect) {
          setSelectedChat(chatToSelect);
        }
      }
    });

    return () => unsubscribe();
  }, [profile?.uid, location.state, selectedChat]);

  const filteredChats = chats.filter(chat => 
    chat.businessTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto h-[700px] flex gap-6">
        {/* Sidebar */}
        <div className={`w-full lg:w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${selectedChat ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#002366]" />
              Messages
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#002366]/20 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002366]"></div>
              </div>
            ) : (
              <ChatList 
                chats={filteredChats} 
                selectedChatId={selectedChat?.id}
                onSelectChat={setSelectedChat}
              />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 ${!selectedChat ? "hidden lg:flex" : "flex"}`}>
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat} 
              onBack={() => setSelectedChat(null)} 
            />
          ) : (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <MessageSquare className="h-12 w-12 opacity-20" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h2>
              <p className="max-w-xs">
                Choose a chat from the list to view messages and communicate with vendors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
