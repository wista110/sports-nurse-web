import { prisma } from "@/lib/prisma";
import { auditService } from "./audit";
import type { CreateThreadInput, SendMessageInput, MarkAsReadInput } from "@/lib/validations/messaging";

export interface ThreadWithDetails {
  id: string;
  jobId: string;
  participants: string[];
  lastMessageAt: Date;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    description?: string;
    categories?: string[];
    location?: any;
    startAt?: Date;
    endAt?: Date;
    headcount?: number;
    compensation?: any;
    deadline?: Date;
    status: string;
    organizerId?: string;
  };
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    attachments: any[];
    readBy: string[];
    createdAt: Date;
    sender: {
      id: string;
      name: string | null;
      role: string;
    };
  }>;
  unreadCount?: number;
}

export interface MessageWithSender {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  attachments: any[];
  readBy: string[];
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    role: string;
  };
}

class MessagingService {
  async createThread(data: CreateThreadInput, actorId: string) {
    try {
      // Check if thread already exists for this job
      const existingThread = await prisma.thread.findFirst({
        where: {
          jobId: data.jobId,
        },
      });

      if (existingThread) {
        // Update participants if needed
        const updatedParticipants = Array.from(
          new Set([...existingThread.participants, ...data.participants])
        );

        const thread = await prisma.thread.update({
          where: { id: existingThread.id },
          data: {
            participants: updatedParticipants,
          },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        await auditService.logAction({
          actorId,
          action: 'THREAD_UPDATED',
          target: `thread:${thread.id}`,
          metadata: {
            jobId: data.jobId,
            participants: updatedParticipants,
          },
        });

        return thread;
      }

      // Create new thread
      const thread = await prisma.thread.create({
        data: {
          jobId: data.jobId,
          participants: data.participants,
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      await auditService.logAction({
        actorId,
        action: 'THREAD_CREATED',
        target: `thread:${thread.id}`,
        metadata: {
          jobId: data.jobId,
          participants: data.participants,
        },
      });

      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create thread');
    }
  }

  async sendMessage(data: SendMessageInput, senderId: string) {
    try {
      // Verify sender is participant in thread
      const thread = await prisma.thread.findUnique({
        where: { id: data.threadId },
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      if (!thread.participants.includes(senderId)) {
        throw new Error('User is not a participant in this thread');
      }

      const message = await prisma.message.create({
        data: {
          threadId: data.threadId,
          senderId,
          content: data.content,
          attachments: data.attachments || [],
          readBy: [senderId], // Sender automatically reads their own message
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Update thread's lastMessageAt
      await prisma.thread.update({
        where: { id: data.threadId },
        data: {
          lastMessageAt: new Date(),
        },
      });

      await auditService.logAction({
        actorId: senderId,
        action: 'MESSAGE_SENT',
        target: `message:${message.id}`,
        metadata: {
          threadId: data.threadId,
          hasAttachments: data.attachments && data.attachments.length > 0,
        },
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error && (
        error.message === 'Thread not found' || 
        error.message === 'User is not a participant in this thread'
      )) {
        throw error;
      }
      throw new Error('Failed to send message');
    }
  }

  async getThreads(userId: string): Promise<ThreadWithDetails[]> {
    try {
      const threads = await prisma.thread.findMany({
        where: {
          participants: {
            has: userId,
          },
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Only get the latest message for thread list
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      // Calculate unread count for each thread
      const threadsWithUnread = await Promise.all(
        threads.map(async (thread) => {
          const unreadCount = await prisma.message.count({
            where: {
              threadId: thread.id,
              NOT: {
                readBy: {
                  has: userId,
                },
              },
            },
          });

          return {
            ...thread,
            unreadCount,
          };
        })
      );

      return threadsWithUnread;
    } catch (error) {
      console.error('Error getting threads:', error);
      throw new Error('Failed to get threads');
    }
  }

  async getThread(threadId: string, userId: string): Promise<ThreadWithDetails | null> {
    try {
      const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              description: true,
              categories: true,
              location: true,
              startAt: true,
              endAt: true,
              headcount: true,
              compensation: true,
              deadline: true,
              status: true,
              organizerId: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!thread) {
        return null;
      }

      // Verify user is participant
      if (!thread.participants.includes(userId)) {
        throw new Error('User is not a participant in this thread');
      }

      return thread;
    } catch (error) {
      console.error('Error getting thread:', error);
      if (error instanceof Error && error.message === 'User is not a participant in this thread') {
        throw error;
      }
      throw new Error('Failed to get thread');
    }
  }

  async markAsRead(data: MarkAsReadInput, userId: string) {
    try {
      // Update all specified messages to include userId in readBy array
      await prisma.message.updateMany({
        where: {
          id: {
            in: data.messageIds,
          },
          thread: {
            participants: {
              has: userId,
            },
          },
        },
        data: {
          readBy: {
            push: userId,
          },
        },
      });

      await auditService.logAction({
        actorId: userId,
        action: 'MESSAGES_READ',
        target: `messages:${data.messageIds.join(',')}`,
        metadata: {
          messageCount: data.messageIds.length,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.message.count({
        where: {
          thread: {
            participants: {
              has: userId,
            },
          },
          NOT: {
            readBy: {
              has: userId,
            },
          },
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async createThreadForApplication(jobId: string, organizerId: string, nurseId: string) {
    try {
      return await this.createThread(
        {
          jobId,
          participants: [organizerId, nurseId],
        },
        organizerId
      );
    } catch (error) {
      console.error('Error creating thread for application:', error);
      throw new Error('Failed to create thread for application');
    }
  }
}

export const messagingService = new MessagingService();