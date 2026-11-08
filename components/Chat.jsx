"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { StorechatAction, getChatAction, deleteChatAction } from "../app/actions/users";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export default function Chat({ receiverId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  
  const { userId, loading } = useAuth();
  const currentUserId = userId !== null && userId !== undefined ? Number(userId) : null;

  useEffect(() => {
    const normalizedReceiverId = Number(receiverId);
    if (loading || !Number.isInteger(currentUserId) || !Number.isInteger(normalizedReceiverId)) {
      return;
    }

    // 1. Ensure socket is actually connected
    if (!socket.connected) {
      socket.connect();
    }

    // 2. Load initial chat history from MongoDB
    const loadChat = async () => {
      try {
        const history = await getChatAction(normalizedReceiverId);
        setMessages(history);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };
    loadChat();

    // 3. Join the personal room on connect and whenever active
    const joinPersonalRoom = () => {
      socket.emit("join", String(currentUserId));
    };

    if (socket.connected) {
      joinPersonalRoom();
    }
    socket.on("connect", joinPersonalRoom);

    // 4. Listen for incoming messages routed to our room
    const handleReceiveMessage = (data) => {
      // Only show the message if it's from the person we are currently looking at
      if (String(data.senderId) === String(normalizedReceiverId)) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (data._id && prev.some((m) => m._id === data._id)) {
            return prev;
          }
          return [...prev, { _id: data._id, type: "received", message: data.message }];
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // 5. Cleanup listeners on unmount
    return () => {
      socket.off("connect", joinPersonalRoom);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [currentUserId, loading, receiverId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText(""); // Clear UI immediately for smooth UX

    try {
      const normalizedReceiverId = Number(receiverId);
      const res = await StorechatAction(normalizedReceiverId, msgText);
      const messageId = res.messageId;

      setMessages((prev) => [...prev, { _id: messageId, type: "sent", message: msgText }]);

      socket.emit("sendMessage", {
        _id: messageId,
        senderId: String(currentUserId),
        receiverId: String(normalizedReceiverId),
        message: msgText,
      });
    } catch (error) {
      setText(msgText); // Restore input if failed
      console.error("Failed to send message:", error);
    }
  };

  const handleDelete = async (messageId) => {
    if (!messageId) return;
    
    try {
      await deleteChatAction(Number(receiverId), messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-[#071126] border border-white/10 rounded-3xl p-5">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((m, i) => (
          <div key={m._id || i} className={`group flex flex-col ${m.type === 'sent' ? 'items-end' : 'items-start'}`}>
            <div className={`relative p-3 rounded-2xl max-w-[80%] text-sm ${m.type === 'sent' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-[#111827] border border-white/10 text-gray-300 rounded-bl-sm'}`}>
              {m.message}
            </div>
            {m.type === 'sent' && (
              <button 
                onClick={() => handleDelete(m._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-500 mt-1 cursor-pointer"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex gap-3 mt-auto">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="bg-violet-600 hover:bg-violet-500 transition px-5 py-3 rounded-xl text-white font-bold">
          Send
        </button>
      </div>
    </div>
  );
}
