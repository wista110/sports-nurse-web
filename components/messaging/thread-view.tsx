"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { JobOfferForm } from "@/components/contracts/job-offer-form";
import { JobOfferCard } from "@/components/contracts/job-offer-card";
import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import type { MessageWithSender } from "@/lib/services/messaging";
import type { JobOrder } from "@/types/domain";

interface ThreadViewProps {
  threadId: string;
  onNewMessage?: () => void;
}

export function ThreadView({ threadId, onNewMessage }: ThreadViewProps) {
  const [sending, setSending] = useState(false);
  const [showJobOfferForm, setShowJobOfferForm] = useState(false);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    thread,
    loading,
    error,
    addMessage,
    markMessagesAsRead,
  } = useRealtimeMessages({
    threadId,
    enabled: !!threadId,
  });

  const isOrganizer = session?.user?.role === "ORGANIZER";
  const canCreateJobOffer = isOrganizer && thread?.job.status === "APPLIED";

  useEffect(() => {
    // Mark messages as read when thread is viewed
    if (thread && session?.user?.id) {
      const unreadMessages = thread.messages.filter(
        (message) => !message.readBy.includes(session.user.id!)
      );
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages.map((m) => m.id));
      }
    }
  }, [thread, session?.user?.id, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages]);

  // Load job order when thread is loaded
  useEffect(() => {
    if (thread?.job.id) {
      loadJobOrder();
    }
  }, [thread?.job.id]);

  const loadJobOrder = async () => {
    if (!thread?.job.id) return;
    
    try {
      const response = await fetch(`/api/job-orders?jobId=${thread.job.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setJobOrder(data);
      }
    } catch (error) {
      console.error("Error loading job order:", error);
    }
  };

  const handleSendMessage = async (content: string, attachments: any[]) => {
    if (!thread || !session?.user?.id) return;

    try {
      setSending(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: thread.id,
          content,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage: MessageWithSender = await response.json();
      
      // Add message to real-time state
      addMessage(newMessage);
      onNewMessage?.();
    } catch (error) {
      console.error("Failed to send message:", error);
      // You might want to show a toast notification here
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJobOfferSuccess = () => {
    loadJobOrder();
    onNewMessage?.();
  };

  const handleJobOfferStatusUpdate = () => {
    loadJobOrder();
    onNewMessage?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Thread not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/inbox")}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900">
              {thread.job.title}
            </h2>
            <p className="text-sm text-gray-500">
              Job Status: {thread.job.status.toLowerCase().replace('_', ' ')}
            </p>
          </div>
          {canCreateJobOffer && !jobOrder && (
            <Button
              onClick={() => setShowJobOfferForm(true)}
              size="sm"
              className="ml-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Job Offer
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Job Offer Card */}
        {jobOrder && (
          <JobOfferCard 
            jobOrder={jobOrder} 
            onStatusUpdate={handleJobOfferStatusUpdate}
          />
        )}
        
        <MessageList messages={thread.messages} currentUserId={session?.user?.id} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sending}
          placeholder="Type your message..."
        />
      </div>

      {/* Job Offer Form Modal */}
      {thread && (
        <JobOfferForm
          job={thread.job as any}
          isOpen={showJobOfferForm}
          onClose={() => setShowJobOfferForm(false)}
          onSuccess={handleJobOfferSuccess}
        />
      )}
    </div>
  );
}