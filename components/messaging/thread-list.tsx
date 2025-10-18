"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { ThreadWithDetails } from "@/lib/services/messaging";

interface ThreadListProps {
  threads: ThreadWithDetails[];
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onThreadSelect,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet.</p>
        <p className="text-sm mt-1">
          Apply to jobs to start conversations with organizers.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {threads.map((thread) => {
        const lastMessage = thread.messages[0];
        const isSelected = thread.id === selectedThreadId;

        return (
          <div
            key={thread.id}
            onClick={() => onThreadSelect(thread.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? "bg-blue-50 border-blue-200" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {thread.job.title}
                  </h3>
                  {thread.unreadCount && thread.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <span className="capitalize">{thread.job.status.toLowerCase().replace('_', ' ')}</span>
                  <span className="mx-1">•</span>
                  <span>{thread.participants.length} participants</span>
                </div>

                {lastMessage && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 truncate">
                      <span className="font-medium">
                        {lastMessage.sender.name || "Unknown"}:
                      </span>{" "}
                      {lastMessage.content}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}