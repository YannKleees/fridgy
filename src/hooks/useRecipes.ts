import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/types/recipe';
import { FridgeItem } from '@/types/item';

const MESSAGES_STORAGE_KEY = 'recipe-chat-messages';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  recipes?: Recipe[];
  timestamp: Date;
}

// Load messages from localStorage
const loadMessages = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: Omit<ChatMessage, 'timestamp'> & { timestamp: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load messages from localStorage:', e);
  }
  return [];
};

export function useRecipes() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: string, fridgeItems: FridgeItem[]) => {
    // Add user message
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userChatMessage]);
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-recipes', {
        body: {
          prompt: userMessage,
          items: fridgeItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
          })),
        },
      });

      if (error) throw error;

      const recipes = data.recipes || [];
      
      // Add assistant message with recipes
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: recipes.length > 0 
          ? `Here are some recipes based on "${userMessage}":`
          : "I couldn't find any recipes matching your request. Try describing something else!",
        recipes: recipes.length > 0 ? recipes : undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error fetching recipes:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
