"use client";

import { format, isToday, isYesterday } from "date-fns";
import { MessageBubble } from "./message-bubble";
import type { MessageWithSender } from "@/lib/services/messaging";

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId?: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No messages yet.</p>
        <p className="text-sm mt-1">Start the conversation!</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateKey = format(date, "yyyy-MM-dd");
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    
    return groups;
  }, {} as Record<string, MessageWithSender[]>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-xs text-gray-600 font-medium">
                {formatDateHeader(dateKey)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {dayMessages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const prevMessage = index > 0 ? dayMessages[index - 1] : null;
              const showSender = !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showSender={showSender}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}