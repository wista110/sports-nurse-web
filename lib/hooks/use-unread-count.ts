"use client";

import { useState, useEffect, useCallback } from "react";

export function useUnreadCount(pollingInterval: number = 30000) { // 30 seconds
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages/unread-count");
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  const incrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount((prev) => prev + amount);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Set up polling
    const interval = setInterval(fetchUnreadCount, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount, pollingInterval]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount,
  };
}