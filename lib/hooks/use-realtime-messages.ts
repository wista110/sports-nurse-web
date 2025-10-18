"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ThreadWithDetails, MessageWithSender } from "@/lib/services/messaging";

interface UseRealtimeMessagesOptions {
  threadId?: string;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useRealtimeMessages({
  threadId,
  enabled = true,
  pollingInterval = 3000, // 3 seconds
}: UseRealtimeMessagesOptions = {}) {
  const [thread, setThread] = useState<ThreadWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchThread = useCallback(async () => {
    if (!threadId || !enabled) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/threads/${threadId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch thread");
      }

      const data: ThreadWithDetails = await response.json();
      
      // Check if there are new messages
      const latestMessage = data.messages[data.messages.length - 1];
      const hasNewMessages = latestMessage && 
        lastMessageIdRef.current && 
        latestMessage.id !== lastMessageIdRef.current;

      setThread(data);
      
      if (latestMessage) {
        lastMessageIdRef.current = latestMessage.id;
      }

      // Return whether there were new messages for notification purposes
      return hasNewMessages;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  }, [threadId, enabled]);

  const startPolling = useCallback(() => {
    if (!enabled || !threadId) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial fetch
    fetchThread();

    // Set up polling
    intervalRef.current = setInterval(fetchThread, pollingInterval);
  }, [fetchThread, enabled, threadId, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const addMessage = useCallback((message: MessageWithSender) => {
    setThread((prev) => {
      if (!prev) return prev;
      
      // Check if message already exists to avoid duplicates
      const messageExists = prev.messages.some(m => m.id === message.id);
      if (messageExists) return prev;

      return {
        ...prev,
        messages: [...prev.messages, message],
        lastMessageAt: new Date(message.createdAt),
      };
    });
    
    lastMessageIdRef.current = message.id;
  }, []);

  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageIds }),
      });

      // Update local state to reflect read status
      setThread((prev) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          messages: prev.messages.map((message) => {
            if (messageIds.includes(message.id)) {
              return {
                ...message,
                readBy: [...new Set([...message.readBy, "current-user"])], // This should be the actual user ID
              };
            }
            return message;
          }),
        };
      });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }, []);

  // Start/stop polling based on enabled state and threadId
  useEffect(() => {
    if (enabled && threadId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, threadId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    thread,
    loading,
    error,
    addMessage,
    markMessagesAsRead,
    refetch: fetchThread,
    startPolling,
    stopPolling,
  };
}