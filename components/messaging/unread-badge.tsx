"use client";

import { useUnreadCount } from "@/lib/hooks/use-unread-count";
import { Badge } from "@/components/ui/badge";

interface UnreadBadgeProps {
  className?: string;
}

export function UnreadBadge({ className }: UnreadBadgeProps) {
  const { unreadCount } = useUnreadCount();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}