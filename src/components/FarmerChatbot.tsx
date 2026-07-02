import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw, Bot, User, HelpCircle } from "lucide-react";
import { ChatMessage, LanguageCode } from "../types";

interface FarmerChatbotProps {
  language: LanguageCode;
  onSaveReport: (report: ChatMessage[]) => void;
}

export default function FarmerChatbot({ language, onSaveReport }: FarmerChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! I am 'Kisan Mitra', your agricultural advisor. I can help you with crop diseases, weather questions, market prices, and government schemes. Feel free to ask me anything, or speak by clicking the microphone button!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Quick questions
  const sampleQueries = [
    { text: "What is PM-KISAN & eligibility?", hi: "पीएम-किसान योजना क्या है?", code: "hi" },
    { text: "How to apply for Soil Health Card?", hi: "सॉइल हेल्थ कार्ड कैसे बनवाएं?", code: "hi" },
    { text: "Organic pesticides for insects?", hi: "कीड़ों के लिए जैविक कीटनाशक?", code: "hi" },
    { text: "Crop insurance schemes info", hi: "फसल बीमा योजना की जानकारी", code: "hi" },
  ];

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "en" ? "en-US" : 
               language === "hi" ? "hi-IN" : 
               language === "mr" ? "mr-IN" : 
               language === "kn" ? "kn-IN" : 
               language === "ta" ? "ta-IN" : 
               language === "te" ? "te-IN" : "bn-IN";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMsg(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakText = (text: string, msgId: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking && activeVoiceId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveVoiceId(null);
      return;
    }

    // Stop current speech
    window.speechSynthesis.cancel();

    // Clean markdown formatting from text for better narration
    const cleanText = text.replace(/[*#`_\-]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = language === "en" ? "en-US" : 
                    language === "hi" ? "hi-IN" : 
                    language === "mr" ? "mr-IN" : 
                    language === "kn" ? "kn-IN" : 
                    language === "ta" ? "ta-IN" : 
                    language === "te" ? "te-IN" : "bn-IN";
    utterance.lang = langCode;

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveVoiceId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveVoiceId(null);
    };

    setIsSpeaking(true);
    setActiveVoiceId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please type your query.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          language: language === "hi" ? "Hindi" : 
                    language === "mr" ? "Marathi" : 
                    language === "kn" ? "Kannada" : 
                    language === "ta" ? "Tamil" : 
                    language === "te" ? "Telugu" : 
                    language === "bn" ? "Bengali" : "English"
        }),
      });

      const data = await response.json();
      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        onSaveReport(finalMessages);
        
        // Auto readout assistant response
        speakText(data.reply, assistantMsg.id);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "error",
            role: "assistant",
            content: `Error: ${data.error || "Failed to process chat message."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "assistant",
          content: "Sorry, I am having trouble connecting to Kisan Mitra servers. Please ensure your Gemini API key is configured.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="farmer-chatbot" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6 flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#F5F5F0] rounded-xl flex items-center justify-center border border-black/5">
            <Bot className="w-5 h-5 text-olive animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Kisan Mitra (AI Assistant)</h2>
            <p className="text-xs text-olive flex items-center gap-1">
              <span className="w-2 h-2 bg-olive rounded-full animate-ping" />
              Online • Realtime Advisory
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-8 h-8 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-olive" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed relative group shadow-sm ${
              msg.role === "user" 
                ? "bg-olive text-white rounded-tr-none font-medium" 
                : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200/60"
            }`}>
              <div className="whitespace-pre-line">{msg.content}</div>
              
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 text-[9px] text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.role === "assistant" && (
                  <button
                    id={`btn-read-${msg.id}`}
                    onClick={() => speakText(msg.content, msg.id)}
                    className="p-1 text-slate-400 hover:text-olive transition"
                    title="Listen to message"
                  >
                    {isSpeaking && activeVoiceId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-olive" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 bg-olive text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-olive animate-spin" />
            </div>
            <div className="bg-slate-50 text-slate-500 rounded-2xl rounded-tl-none border border-slate-200/60 px-4 py-3 text-xs">
              Kisan Mitra is typing a suggestion...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div className="mb-3 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Common Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                id={`btn-sample-query-${idx}`}
                onClick={() => handleSendMessage(language === "hi" && q.hi ? q.hi : q.text)}
                className="text-[10px] bg-[#F5F5F0] hover:bg-[#EAEAE0] border border-slate-200/80 text-slate-600 hover:text-olive font-bold px-2.5 py-1.5 rounded-full transition"
              >
                {language === "hi" && q.hi ? q.hi : q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="input-chat-query"
            type="text"
            placeholder="Type your farm inquiry or tap mic..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputMsg)}
            className="w-full pl-3 pr-10 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
          />
          <button
            id="btn-mic-chat"
            onClick={toggleRecording}
            className={`absolute right-2 top-2 p-1 rounded-lg transition ${
              isRecording ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:bg-slate-100"
            }`}
            title="Speak query"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          id="btn-send-chat"
          onClick={() => handleSendMessage(inputMsg)}
          disabled={!inputMsg.trim() || loading}
          className="bg-olive hover:bg-olive/90 text-white rounded-lg p-2.5 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
