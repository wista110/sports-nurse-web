"use client";

import { format } from "date-fns";
import { FileText, Image, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { MessageWithSender } from "@/lib/services/messaging";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showSender: boolean;
}

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "organizer":
        return "bg-blue-100 text-blue-800";
      case "nurse":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const parseMessageContent = (content: string) => {
    // Parse job references like [job:123] or [job:123:Job Title]
    const jobRegex = /\[job:([a-zA-Z0-9-]+)(?::([^\]]+))?\]/g;
    // Parse quote references like [quote:123] or [quote:123:¥50,000]
    const quoteRegex = /\[quote:([a-zA-Z0-9-]+)(?::([^\]]+))?\]/g;

    const parts: Array<{ type: 'text' | 'job' | 'quote'; content: string; id?: string; title?: string }> = [];
    let lastIndex = 0;

    // Find all matches
    const matches: Array<{ type: 'job' | 'quote'; match: RegExpExecArray; index: number }> = [];
    
    let jobMatch;
    while ((jobMatch = jobRegex.exec(content)) !== null) {
      matches.push({ type: 'job', match: jobMatch, index: jobMatch.index });
    }
    
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(content)) !== null) {
      matches.push({ type: 'quote', match: quoteMatch, index: quoteMatch.index });
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Process matches
    matches.forEach(({ type, match }) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add the reference
      const part: { type: 'job' | 'quote'; content: string; id?: string; title?: string } = {
        type,
        content: match[0],
      };
      
      if (match[1]) part.id = match[1];
      if (match[2]) part.title = match[2];
      
      parts.push(part);

      lastIndex = match.index + match[0].length;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const renderMessagePart = (part: { type: 'text' | 'job' | 'quote'; content: string; id?: string; title?: string }, index: number) => {
    if (part.type === 'text') {
      return <span key={index}>{part.content}</span>;
    }

    if (part.type === 'job') {
      return (
        <Link key={index} href={`/jobs/${part.id}`} className="inline-flex items-center">
          <Button
            variant="link"
            size="sm"
            className={`p-0 h-auto font-normal underline ${
              isOwn ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
            }`}
          >
            {part.title || `Job #${part.id?.slice(0, 8)}`}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      );
    }

    if (part.type === 'quote') {
      return (
        <span
          key={index}
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            isOwn
              ? "bg-blue-500 text-blue-100"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {part.title || `Quote #${part.id?.slice(0, 8)}`}
        </span>
      );
    }

    return null;
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
        {/* Sender info */}
        {showSender && !isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.sender.name || "Unknown"}
            </span>
            <Badge
              variant="secondary"
              className={`text-xs ${getRoleColor(message.sender.role)}`}
            >
              {message.sender.role.toLowerCase()}
            </Badge>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap">
            {parseMessageContent(message.content).map(renderMessagePart)}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-2 rounded border ${
                    isOwn
                      ? "bg-blue-500 border-blue-400"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isOwn ? "text-white" : "text-gray-900"
                    }`}>
                      {attachment.filename}
                    </p>
                    <p className={`text-xs ${
                      isOwn ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1 rounded hover:bg-opacity-80 ${
                      isOwn ? "hover:bg-blue-400" : "hover:bg-gray-100"
                    }`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`mt-1 ${isOwn ? "text-right" : "text-left"}`}>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}