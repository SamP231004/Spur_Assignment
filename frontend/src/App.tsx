import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Bot,
  Headset,
  Loader2,
  MoreVertical,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
};

// Helper to get formatted timestamps (e.g., "9:41 AM")
const getTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Welcome! Ask me anything about our products, shipping, returns, or support.",
      sender: "ai",
      timestamp: getTimestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();

    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Only clear input if we didn't use a suggestion override
    if (!textOverride) setInput("");
    setIsLoading(true);

    try {
      // Use Vite environment variable with a fallback to localhost
      const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      
      const response = await axios.post(`${apiUrl}/api/chat/message`, {
        message: userMessage.text,
        sessionId: sessionId,
      });

      if (response.data.sessionId && !sessionId) {
        setSessionId(response.data.sessionId);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: "ai",
        timestamp: getTimestamp(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to connect to the server.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Error: ${errorMessage}`,
          sender: "ai",
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to handle clicking a suggested prompt
  const handleSuggestion = (text: string) => {
    sendMessage(undefined, text);
  };

  const suggestions = [
    "What is your return policy?",
    "Do you ship internationally?",
    "How long does delivery take?",
    "How can I track my order?",
  ];

  return (
    <div className="bg-white text-neutral-950 min-h-screen w-screen overflow-visible">
      <div className="bg-neutral-100/40 flex justify-center items-center w-full min-h-screen">
        {/* Reduced width from 860px to 760px, and height from 800px to 720px */}
        <div className="max-w-[760px] shadow-2xl rounded-3xl bg-white border-neutral-200 border border-solid flex flex-col w-full h-[720px] overflow-hidden">

          {/* Header */}
          <div className="bg-white border-neutral-200 border-b border-solid flex px-8 py-6 justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="size-12 shadow-sm rounded-2xl bg-neutral-900 text-neutral-50 flex justify-center items-center shrink-0">
                <Headset className="size-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-semibold text-lg leading-7 tracking-tight">
                  AI Customer Support Agent
                </h1>
                <div className="flex items-center gap-2">
                  <span className="relative size-2 flex">
                    <span className="inline-flex animate-ping opacity-75 rounded-full bg-emerald-500 absolute w-full h-full" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-medium text-neutral-500 text-xs leading-4">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                className="size-9 text-neutral-500 hover:text-neutral-900 transition-colors"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setMessages([{
                    id: "welcome",
                    text: "👋 Welcome! Ask me anything about our products, shipping, returns, or support.",
                    sender: "ai",
                    timestamp: getTimestamp(),
                  }]);
                  setSessionId(null);
                }}
                title="Reset Chat"
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                className="size-9 text-neutral-500 hover:text-neutral-900 transition-colors"
                size="icon"
                variant="ghost"
              >
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </div>

          {/* Chat Log */}
          <div className="overflow-y-auto bg-neutral-100/20 flex px-8 py-6 flex-col flex-1 gap-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-start gap-3 ${m.sender === "user" ? "justify-end" : ""
                  }`}
              >
                {m.sender === "ai" && (
                  <div className="size-8 shrink-0 rounded-full bg-neutral-900 text-neutral-50 flex mt-1 justify-center items-center">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] flex flex-col gap-1 ${m.sender === "user" ? "items-end" : ""
                    }`}
                >
                  <div
                    className={`shadow-sm px-4 py-3 ${m.sender === "user"
                        ? "rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl bg-neutral-900 text-neutral-50"
                        : "rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl bg-white border-neutral-200 border border-solid text-neutral-900"
                      }`}
                  >
                    <p className="leading-relaxed text-sm whitespace-pre-wrap">
                      {m.text}
                    </p>
                  </div>
                  <span className="text-neutral-500 text-[11px] px-1">
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === "user" && (
                  <div className="size-8 shrink-0 rounded-full bg-neutral-200 text-neutral-900 flex mt-1 justify-center items-center">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-start gap-3">
                <div className="size-8 shrink-0 rounded-full bg-neutral-900 text-neutral-50 flex mt-1 justify-center items-center">
                  <Bot className="size-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="shadow-sm rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl bg-white border-neutral-200 border border-solid flex px-4 py-3 items-center gap-2">
                    <span className="text-neutral-500 text-xs leading-4">
                      Agent is typing
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-neutral-500" />
                      <span className="size-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: "0.15s" }} />
                      <span className="size-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: "0.3s" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Tray */}
          <div className="bg-white border-neutral-200 border-t border-solid flex px-8 pt-4 pb-2 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="font-medium text-neutral-500 text-xs leading-4 flex mr-1 items-center gap-1">
                <Sparkles className="size-3.5" />
                Suggested
              </span>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  disabled={isLoading}
                  className="transition-colors font-normal rounded-full text-neutral-950 text-xs leading-4 h-8"
                  size="sm"
                  variant="outline"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white px-8 py-5 pb-6">
            <form onSubmit={sendMessage} className="flex items-end gap-3">
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  maxLength={1000}
                  className="rounded-2xl bg-neutral-100/50 text-sm leading-5 border-transparent focus-visible:ring-neutral-300 pl-4 pr-10 h-12"
                  placeholder="Ask about returns, shipping, refunds, products..."
                />
                {isLoading && (
                  <Loader2 className="size-4 animate-spin top-1/2 -translate-y-1/2 text-neutral-500 absolute right-4" />
                )}
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="size-12 transition-colors shadow-sm shrink-0 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizontal className="size-5" />
              </Button>
            </form>
            <p className="text-center text-neutral-500 text-[11px] mt-3">
              Press Enter to send · AI responses may take a moment
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}