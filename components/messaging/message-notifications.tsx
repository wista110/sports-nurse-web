"use client";

import { useEffect } from "react";
import { useUnreadCount } from "@/lib/hooks/use-unread-count";

interface MessageNotificationsProps {
  onUnreadCountChange?: (count: number) => void;
}

export function MessageNotifications({ onUnreadCountChange }: MessageNotificationsProps) {
  const { unreadCount } = useUnreadCount();

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    // Update document title with unread count
    const originalTitle = document.title;
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [unreadCount]);

  // This component doesn't render anything visible
  return null;
}