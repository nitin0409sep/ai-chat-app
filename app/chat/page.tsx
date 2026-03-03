"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
}

const GREETING: Message = {
  role: "assistant",
  content: "Hello! How can I help you today?",
};

export default function ChatPage() {
  const { user, fetchUser, logout, isLoading: authLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch chat list for sidebar
  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.get("/api/chats").then((res) => res.data),
    enabled: !authLoading,
  });
  const chatList: Chat[] = chatsData?.chats ?? [];

  // Send message mutation
  const { mutate: sendChat, isPending } = useMutation({
    mutationFn: (payload: { message: string; chatId: string | null }) =>
      api
        .post("/api/chat", {
          message: payload.message,
          chatId: payload.chatId,
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: data.role, content: data.content },
      ]);
      // Set chatId from server response (important for first message)
      if (data.chatId && !activeChatId) {
        setActiveChatId(data.chatId);
      }
      // Refresh sidebar chat list
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const sendMessage = () => {
    if (!input.trim() || isPending) return;

    const message = input;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    sendChat({ message, chatId: activeChatId });
    inputRef.current?.focus();
  };

  // Load messages when switching to an existing chat
  const loadChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    try {
      const { data } = await api.get(`/api/chats/${chatId}/messages`);
      setMessages(data.messages);
    } catch {
      setMessages([GREETING]);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([GREETING]);
    inputRef.current?.focus();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const userInitials = user
    ? `${(user.firstName?.[0] ?? "").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}`
    : "U";

  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "User";

  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#0b0f1a] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0e1425]/80 backdrop-blur-xl border-r border-white/[0.06] hidden md:flex flex-col">
        {/* Sidebar header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight">
              AI Chat
            </span>
          </div>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors text-sm text-gray-300 hover:text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Recent section */}
        <div className="flex-1 px-3 overflow-y-auto scrollbar-hide">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium px-3 mb-2 mt-2">
            Recent
          </p>
          <div className="space-y-0.5">
            {chatList.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-600">
                No conversations yet
              </p>
            )}
            {chatList.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  activeChatId === chat.id
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-300"
                }`}
              >
                {chat.title || "New conversation"}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {userInitials}
            </div>
            <span className="text-sm text-gray-400 truncate flex-1">
              {userName}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0e1425]/60 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">AI Chat</span>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-message-in ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  {msg.role === "assistant" ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold">
                      {userInitials}
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed max-w-[75%] ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm shadow-lg shadow-indigo-600/10"
                      : "bg-white/[0.06] text-gray-200 rounded-tl-sm border border-white/[0.06]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isPending && (
              <div className="flex gap-3 animate-message-in">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white/[0.06] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-xl px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2 focus-within:border-indigo-500/40 focus-within:bg-white/[0.07] transition-all">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent outline-none text-[14px] placeholder-gray-500 py-1"
                placeholder="Message AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isPending}
              />
              <button
                onClick={sendMessage}
                disabled={isPending || !input.trim()}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center flex-shrink-0"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-[11px] text-gray-600 text-center mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
