"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThreadList } from "./thread-list";
import { ThreadView } from "./thread-view";
import { MessageNotifications } from "./message-notifications";
import type { ThreadWithDetails } from "@/lib/services/messaging";

export function InboxInterface() {
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/threads");
      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }
      const data = await response.json();
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    router.push(`/inbox/${threadId}`);
  };

  const handleNewMessage = () => {
    // Refresh threads to update unread counts and last message
    fetchThreads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchThreads}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MessageNotifications />
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
        {/* Thread List */}
        <div className="lg:col-span-1 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
          </div>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onThreadSelect={handleThreadSelect}
          />
        </div>

        {/* Thread View */}
        <div className="lg:col-span-2">
          {selectedThreadId ? (
            <ThreadView
              threadId={selectedThreadId}
              onNewMessage={handleNewMessage}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No conversation selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the list to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}