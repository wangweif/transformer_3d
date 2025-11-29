import React, { useState, useEffect, useRef } from 'react';
import { TransformerBlockData, ChatMessage } from '../types';
import { getComponentExplanation, sendChatMessage } from '../services/geminiService';

interface InfoPanelProps {
  selectedBlock: TransformerBlockData | null;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ selectedBlock, onClose }) => {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBlock) {
      setLoading(true);
      getComponentExplanation(selectedBlock.label)
        .then((text) => setExplanation(text))
        .finally(() => setLoading(false));
    }
  }, [selectedBlock]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    const modelMsg: ChatMessage = { role: 'model', text: "", isStreaming: true };
    setMessages(prev => [...prev, modelMsg]);

    let fullResponse = "";

    await sendChatMessage(userMsg.text, (chunk) => {
      fullResponse += chunk;
      setMessages(prev => {
        const newArr = [...prev];
        const last = newArr[newArr.length - 1];
        if (last.role === 'model') {
            last.text = fullResponse;
        }
        return newArr;
      });
    });

    setIsChatting(false);
  };

  if (!selectedBlock) {
    return (
      <div className="absolute top-4 left-4 z-10 w-80 bg-slate-900/90 text-white p-6 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2">Transformer 3D</h1>
        <p className="text-slate-300 text-sm mb-4">
          Transformer 神经网络架构的交互式 3D 可视化。
        </p>
        <p className="text-xs text-slate-400">
          点击 3D 模型中的任意模块，查看由 AI 生成的详细中文解释。
        </p>
      </div>
    );
  }

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-slate-950/95 text-slate-200 border-l border-slate-800 shadow-2xl flex flex-col z-20 backdrop-blur-sm transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
        <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedBlock.color }}></div>
            <h2 className="text-xl font-bold text-white">{selectedBlock.label}</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Explanation Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-3">深度解析</h3>
          {loading ? (
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
              <span className="text-slate-400 text-sm">Gemini 正在思考...</span>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              {explanation.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 leading-relaxed">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="border-t border-slate-800 pt-6">
             <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4">AI 导师对话</h3>
             <div className="flex flex-col space-y-4 mb-20">
                {messages.length === 0 && (
                    <p className="text-xs text-slate-500 italic">关于 {selectedBlock.label} 有什么问题吗？...</p>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            msg.role === 'user' 
                            ? 'bg-cyan-900/50 text-cyan-100 border border-cyan-800' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
             </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="输入您的问题..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                disabled={isChatting}
            />
            <button 
                type="submit"
                disabled={isChatting || !chatInput.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
                发送
            </button>
        </form>
      </div>
    </div>
  );
};