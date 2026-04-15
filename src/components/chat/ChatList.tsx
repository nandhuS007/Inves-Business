import React from "react";
import { MessageSquare, User, Clock } from "lucide-react";
import { Chat } from "../../lib/chat";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat }) => {
  const { profile } = useAuth();

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">No messages yet</h3>
        <p className="text-sm">When you contact vendors, your conversations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto h-full">
      {chats.map((chat) => {
        const isSelected = chat.id === selectedChatId;
        const unreadCount = profile?.uid ? chat.unreadCount[profile.uid] || 0 : 0;
        
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full p-4 flex gap-3 transition-all text-left hover:bg-gray-50 ${
              isSelected ? "bg-blue-50/50 border-r-4 border-[#002366]" : ""
            }`}
          >
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-900 truncate text-sm">
                  {chat.businessTitle}
                </h4>
                {chat.lastMessageAt && (
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(chat.lastMessageAt.toDate(), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${unreadCount > 0 ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                {chat.lastMessage || "No messages yet"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
