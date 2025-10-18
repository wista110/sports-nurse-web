"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, MessageCircle } from "lucide-react";

interface MessageNotificationToastProps {
  message: {
    id: string;
    threadId: string;
    senderName: string;
    content: string;
    jobTitle?: string;
  };
  onDismiss: () => void;
  autoHideDuration?: number;
}

export function MessageNotificationToast({
  message,
  onDismiss,
  autoHideDuration = 5000,
}: MessageNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Allow fade out animation
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [autoHideDuration, onDismiss]);

  const handleClick = () => {
    router.push(`/inbox/${message.threadId}`);
    onDismiss();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg cursor-pointer transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                New message from {message.senderName}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {message.jobTitle && (
              <p className="text-xs text-gray-500 mb-1">
                Re: {message.jobTitle}
              </p>
            )}
            <p className="text-sm text-gray-600 truncate">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}