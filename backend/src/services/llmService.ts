import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful, concise support agent for 'Spur Store', a fictional e-commerce store.
Here is your domain knowledge:
- Shipping Policy: We offer free standard shipping on orders over $50. Standard shipping takes 3-5 business days. We currently only ship within the USA and Canada.
- Return Policy: Customers can return items within 30 days of receipt for a full refund. Items must be in original condition.
- Support Hours: Our human support team is available Monday to Friday, 9 AM to 5 PM EST.

Rules:
1. Answer clearly and concisely.
2. If a user asks something completely unrelated to the store, politely redirect them.
3. If you don't know the answer, say "I don't have that information right now, but our human team can help you during business hours."`;

export const generateReply = async (history: { role: 'user' | 'assistant', content: string }[], newMessage: string) => {
  try {
    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: newMessage }
    ];

    const response = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // Extract the text content safely
    const replyContent = response.content.find(block => block.type === 'text');
    return replyContent?.text || "I'm sorry, I couldn't process that.";

  } catch (error) {
    console.error("LLM API Error:", error);
    throw new Error("API_FAILURE");
  }
};