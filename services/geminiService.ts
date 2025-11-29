import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

let aiInstance: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const getComponentExplanation = async (componentLabel: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    请用中文为初学者解释 Transformer 架构（深度学习）中的 "${componentLabel}" 组件。
    
    请按以下结构回答：
    1. 一个简单的比喻（1-2句话）。
    2. 技术功能（输入是什么，数学操作大概是什么，输出是什么）。
    3. 为什么它对模型至关重要。
    
    保持简洁（最多 200 字）。使用 Markdown 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "你是一位友善且专业的 AI 研究员，正在向学生讲解大语言模型（LLM）的原理。请始终使用中文回答。",
      }
    });
    return response.text || "暂无解释。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "无法加载解释。请检查您的 API 密钥。";
  }
};

export const initChat = () => {
  const ai = getAI();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "你是 Transformer 架构（Attention is All You Need）的专家。请用中文回答用户关于他们正在查看的 3D 模型的问题。回答要简短且概念清晰。",
    },
  });
};

export const sendChatMessage = async (
  message: string, 
  onChunk: (text: string) => void
): Promise<void> => {
  if (!chatSession) initChat();
  if (!chatSession) throw new Error("Chat session failed to initialize");

  try {
    const result = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }
  } catch (error) {
    console.error("Chat Error:", error);
    onChunk("\n\n(错误：无法处理消息。请重试。)");
  }
};