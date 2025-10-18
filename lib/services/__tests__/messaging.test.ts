import { messagingService } from '../messaging';
import { prisma } from '@/lib/prisma';
import { auditService } from '../audit';
import type { CreateThreadInput, SendMessageInput, MarkAsReadInput } from '@/lib/validations/messaging';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    thread: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../audit', () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('MessagingService', () => {
  const mockUserId = 'user-123';
  const mockJobId = 'job-123';
  const mockThreadId = 'thread-123';
  const mockMessageId = 'message-123';
  const mockOrganizerId = 'organizer-123';
  const mockNurseId = 'nurse-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createThread', () => {
    const validThreadData: CreateThreadInput = {
      jobId: mockJobId,
      participants: [mockOrganizerId, mockNurseId],
    };

    it('should create new thread when none exists', async () => {
      const mockCreatedThread = {
        id: mockThreadId,
        jobId: mockJobId,
        participants: [mockOrganizerId, mockNurseId],
        lastMessageAt: new Date(),
        createdAt: new Date(),
        job: {
          id: mockJobId,
          title: 'Test Job',
          status: 'OPEN',
        },
        messages: [],
      };

      mockPrisma.thread.findFirst.mockResolvedValue(null);
      mockPrisma.thread.create.mockResolvedValue(mockCreatedThread);

      const result = await messagingService.createThread(validThreadData, mockUserId);

      expect(mockPrisma.thread.findFirst).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
      });

      expect(mockPrisma.thread.create).toHaveBeenCalledWith({
        data: {
          jobId: mockJobId,
          participants: [mockOrganizerId, mockNurseId],
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

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockUserId,
        action: 'THREAD_CREATED',
        target: `thread:${mockThreadId}`,
        metadata: {
          jobId: mockJobId,
          participants: [mockOrganizerId, mockNurseId],
        },
      });

      expect(result.id).toBe(mockThreadId);
    });

    it('should update existing thread with new participants', async () => {
      const existingThread = {
        id: mockThreadId,
        jobId: mockJobId,
        participants: [mockOrganizerId],
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };

      const updatedThread = {
        ...existingThread,
        participants: [mockOrganizerId, mockNurseId],
        job: {
          id: mockJobId,
          title: 'Test Job',
          status: 'OPEN',
        },
        messages: [],
      };

      mockPrisma.thread.findFirst.mockResolvedValue(existingThread);
      mockPrisma.thread.update.mockResolvedValue(updatedThread);

      const result = await messagingService.createThread(validThreadData, mockUserId);

      expect(mockPrisma.thread.update).toHaveBeenCalledWith({
        where: { id: mockThreadId },
        data: {
          participants: [mockOrganizerId, mockNurseId],
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

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockUserId,
        action: 'THREAD_UPDATED',
        target: `thread:${mockThreadId}`,
        metadata: {
          jobId: mockJobId,
          participants: [mockOrganizerId, mockNurseId],
        },
      });

      expect(result.participants).toEqual([mockOrganizerId, mockNurseId]);
    });

    it('should handle database errors during thread creation', async () => {
      mockPrisma.thread.findFirst.mockResolvedValue(null);
      mockPrisma.thread.create.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.createThread(validThreadData, mockUserId)
      ).rejects.toThrow('Failed to create thread');

      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should deduplicate participants when updating existing thread', async () => {
      const existingThread = {
        id: mockThreadId,
        jobId: mockJobId,
        participants: [mockOrganizerId, mockNurseId],
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };

      const threadDataWithDuplicates: CreateThreadInput = {
        jobId: mockJobId,
        participants: [mockOrganizerId, mockNurseId, mockOrganizerId], // Duplicate organizer
      };

      mockPrisma.thread.findFirst.mockResolvedValue(existingThread);
      mockPrisma.thread.update.mockResolvedValue({
        ...existingThread,
        job: { id: mockJobId, title: 'Test Job', status: 'OPEN' },
        messages: [],
      });

      await messagingService.createThread(threadDataWithDuplicates, mockUserId);

      expect(mockPrisma.thread.update).toHaveBeenCalledWith({
        where: { id: mockThreadId },
        data: {
          participants: [mockOrganizerId, mockNurseId], // No duplicates
        },
        include: expect.any(Object),
      });
    });
  });

  describe('sendMessage', () => {
    const validMessageData: SendMessageInput = {
      threadId: mockThreadId,
      content: 'Hello, this is a test message',
      attachments: [
        {
          filename: 'test.pdf',
          url: 'https://example.com/test.pdf',
          type: 'application/pdf',
          size: 1024,
        },
      ],
    };

    const mockThread = {
      id: mockThreadId,
      participants: [mockOrganizerId, mockNurseId, mockUserId],
    };

    const mockCreatedMessage = {
      id: mockMessageId,
      threadId: mockThreadId,
      senderId: mockUserId,
      content: validMessageData.content,
      attachments: validMessageData.attachments,
      readBy: [mockUserId],
      createdAt: new Date(),
      sender: {
        id: mockUserId,
        name: 'Test User',
        role: 'NURSE',
      },
    };

    it('should send message when user is participant', async () => {
      mockPrisma.thread.findUnique.mockResolvedValue(mockThread);
      mockPrisma.message.create.mockResolvedValue(mockCreatedMessage);
      mockPrisma.thread.update.mockResolvedValue({} as any);

      const result = await messagingService.sendMessage(validMessageData, mockUserId);

      expect(mockPrisma.thread.findUnique).toHaveBeenCalledWith({
        where: { id: mockThreadId },
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          threadId: mockThreadId,
          senderId: mockUserId,
          content: validMessageData.content,
          attachments: validMessageData.attachments,
          readBy: [mockUserId],
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

      expect(mockPrisma.thread.update).toHaveBeenCalledWith({
        where: { id: mockThreadId },
        data: {
          lastMessageAt: expect.any(Date),
        },
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockUserId,
        action: 'MESSAGE_SENT',
        target: `message:${mockMessageId}`,
        metadata: {
          threadId: mockThreadId,
          hasAttachments: true,
        },
      });

      expect(result.id).toBe(mockMessageId);
      expect(result.content).toBe(validMessageData.content);
    });

    it('should reject message when user is not participant', async () => {
      const threadWithoutUser = {
        id: mockThreadId,
        participants: [mockOrganizerId], // User not in participants
      };

      mockPrisma.thread.findUnique.mockResolvedValue(threadWithoutUser);

      await expect(
        messagingService.sendMessage(validMessageData, mockUserId)
      ).rejects.toThrow('User is not a participant in this thread');

      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should reject message when thread not found', async () => {
      mockPrisma.thread.findUnique.mockResolvedValue(null);

      await expect(
        messagingService.sendMessage(validMessageData, mockUserId)
      ).rejects.toThrow('Thread not found');

      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should handle message without attachments', async () => {
      const messageWithoutAttachments: SendMessageInput = {
        threadId: mockThreadId,
        content: 'Simple message without attachments',
        attachments: [],
      };

      mockPrisma.thread.findUnique.mockResolvedValue(mockThread);
      mockPrisma.message.create.mockResolvedValue({
        ...mockCreatedMessage,
        attachments: [],
      });
      mockPrisma.thread.update.mockResolvedValue({} as any);

      await messagingService.sendMessage(messageWithoutAttachments, mockUserId);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockUserId,
        action: 'MESSAGE_SENT',
        target: `message:${mockMessageId}`,
        metadata: {
          threadId: mockThreadId,
          hasAttachments: false,
        },
      });
    });

    it('should handle database errors during message sending', async () => {
      mockPrisma.thread.findUnique.mockResolvedValue({
        id: mockThreadId,
        participants: [mockUserId, mockOrganizerId], // Include user in participants
      });
      mockPrisma.message.create.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.sendMessage(validMessageData, mockUserId)
      ).rejects.toThrow('Failed to send message');

      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });
  });

  describe('getThreads', () => {
    const mockThreadsData = [
      {
        id: 'thread-1',
        jobId: 'job-1',
        participants: [mockUserId, 'other-user-1'],
        lastMessageAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-01'),
        job: {
          id: 'job-1',
          title: 'Job 1',
          status: 'OPEN',
        },
        messages: [
          {
            id: 'msg-1',
            senderId: 'other-user-1',
            content: 'Latest message',
            attachments: [],
            readBy: ['other-user-1'],
            createdAt: new Date('2024-01-02'),
            sender: {
              id: 'other-user-1',
              name: 'Other User',
              role: 'ORGANIZER',
            },
          },
        ],
      },
      {
        id: 'thread-2',
        jobId: 'job-2',
        participants: [mockUserId, 'other-user-2'],
        lastMessageAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        job: {
          id: 'job-2',
          title: 'Job 2',
          status: 'APPLIED',
        },
        messages: [
          {
            id: 'msg-2',
            senderId: mockUserId,
            content: 'My message',
            attachments: [],
            readBy: [mockUserId],
            createdAt: new Date('2024-01-01'),
            sender: {
              id: mockUserId,
              name: 'Test User',
              role: 'NURSE',
            },
          },
        ],
      },
    ];

    it('should return threads for user with unread counts', async () => {
      mockPrisma.thread.findMany.mockResolvedValue(mockThreadsData);
      mockPrisma.message.count
        .mockResolvedValueOnce(1) // 1 unread message in thread-1
        .mockResolvedValueOnce(0); // 0 unread messages in thread-2

      const result = await messagingService.getThreads(mockUserId);

      expect(mockPrisma.thread.findMany).toHaveBeenCalledWith({
        where: {
          participants: {
            has: mockUserId,
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
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      expect(mockPrisma.message.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.message.count).toHaveBeenNthCalledWith(1, {
        where: {
          threadId: 'thread-1',
          NOT: {
            readBy: {
              has: mockUserId,
            },
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].unreadCount).toBe(1);
      expect(result[1].unreadCount).toBe(0);
      expect(result[0].lastMessageAt > result[1].lastMessageAt).toBe(true);
    });

    it('should handle database errors during thread retrieval', async () => {
      mockPrisma.thread.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.getThreads(mockUserId)
      ).rejects.toThrow('Failed to get threads');
    });

    it('should return empty array when user has no threads', async () => {
      mockPrisma.thread.findMany.mockResolvedValue([]);

      const result = await messagingService.getThreads(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getThread', () => {
    const mockThreadData = {
      id: mockThreadId,
      jobId: mockJobId,
      participants: [mockUserId, 'other-user'],
      lastMessageAt: new Date(),
      createdAt: new Date(),
      job: {
        id: mockJobId,
        title: 'Test Job',
        status: 'OPEN',
      },
      messages: [
        {
          id: 'msg-1',
          senderId: mockUserId,
          content: 'First message',
          attachments: [],
          readBy: [mockUserId],
          createdAt: new Date('2024-01-01'),
          sender: {
            id: mockUserId,
            name: 'Test User',
            role: 'NURSE',
          },
        },
        {
          id: 'msg-2',
          senderId: 'other-user',
          content: 'Second message',
          attachments: [],
          readBy: ['other-user'],
          createdAt: new Date('2024-01-02'),
          sender: {
            id: 'other-user',
            name: 'Other User',
            role: 'ORGANIZER',
          },
        },
      ],
    };

    it('should return thread when user is participant', async () => {
      mockPrisma.thread.findUnique.mockResolvedValue(mockThreadData);

      const result = await messagingService.getThread(mockThreadId, mockUserId);

      expect(mockPrisma.thread.findUnique).toHaveBeenCalledWith({
        where: { id: mockThreadId },
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

      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockThreadId);
      expect(result?.messages).toHaveLength(2);
    });

    it('should return null when thread not found', async () => {
      mockPrisma.thread.findUnique.mockResolvedValue(null);

      const result = await messagingService.getThread(mockThreadId, mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error when user is not participant', async () => {
      const threadWithoutUser = {
        ...mockThreadData,
        participants: ['other-user-1', 'other-user-2'], // User not in participants
      };

      mockPrisma.thread.findUnique.mockResolvedValue(threadWithoutUser);

      await expect(
        messagingService.getThread(mockThreadId, mockUserId)
      ).rejects.toThrow('User is not a participant in this thread');
    });

    it('should handle database errors during thread retrieval', async () => {
      mockPrisma.thread.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.getThread(mockThreadId, mockUserId)
      ).rejects.toThrow('Failed to get thread');
    });
  });

  describe('markAsRead', () => {
    const markAsReadData: MarkAsReadInput = {
      messageIds: ['msg-1', 'msg-2', 'msg-3'],
    };

    it('should mark messages as read for participant', async () => {
      mockPrisma.message.updateMany.mockResolvedValue({ count: 3 });

      const result = await messagingService.markAsRead(markAsReadData, mockUserId);

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['msg-1', 'msg-2', 'msg-3'],
          },
          thread: {
            participants: {
              has: mockUserId,
            },
          },
        },
        data: {
          readBy: {
            push: mockUserId,
          },
        },
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockUserId,
        action: 'MESSAGES_READ',
        target: 'messages:msg-1,msg-2,msg-3',
        metadata: {
          messageCount: 3,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle database errors during mark as read', async () => {
      mockPrisma.message.updateMany.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.markAsRead(markAsReadData, mockUserId)
      ).rejects.toThrow('Failed to mark messages as read');

      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should handle empty message IDs array', async () => {
      const emptyData: MarkAsReadInput = {
        messageIds: [],
      };

      mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

      const result = await messagingService.markAsRead(emptyData, mockUserId);

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [],
          },
          thread: {
            participants: {
              has: mockUserId,
            },
          },
        },
        data: {
          readBy: {
            push: mockUserId,
          },
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count for user', async () => {
      mockPrisma.message.count.mockResolvedValue(5);

      const result = await messagingService.getUnreadCount(mockUserId);

      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: {
          thread: {
            participants: {
              has: mockUserId,
            },
          },
          NOT: {
            readBy: {
              has: mockUserId,
            },
          },
        },
      });

      expect(result).toBe(5);
    });

    it('should return 0 when database error occurs', async () => {
      mockPrisma.message.count.mockRejectedValue(new Error('Database error'));

      const result = await messagingService.getUnreadCount(mockUserId);

      expect(result).toBe(0);
    });

    it('should return 0 when user has no unread messages', async () => {
      mockPrisma.message.count.mockResolvedValue(0);

      const result = await messagingService.getUnreadCount(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('createThreadForApplication', () => {
    it('should create thread for job application', async () => {
      const mockThread = {
        id: mockThreadId,
        jobId: mockJobId,
        participants: [mockOrganizerId, mockNurseId],
        lastMessageAt: new Date(),
        createdAt: new Date(),
        job: {
          id: mockJobId,
          title: 'Test Job',
          status: 'OPEN',
        },
        messages: [],
      };

      mockPrisma.thread.findFirst.mockResolvedValue(null);
      mockPrisma.thread.create.mockResolvedValue(mockThread);

      const result = await messagingService.createThreadForApplication(
        mockJobId,
        mockOrganizerId,
        mockNurseId
      );

      expect(result.jobId).toBe(mockJobId);
      expect(result.participants).toEqual([mockOrganizerId, mockNurseId]);
    });

    it('should handle errors during thread creation for application', async () => {
      mockPrisma.thread.findFirst.mockResolvedValue(null);
      mockPrisma.thread.create.mockRejectedValue(new Error('Database error'));

      await expect(
        messagingService.createThreadForApplication(mockJobId, mockOrganizerId, mockNurseId)
      ).rejects.toThrow('Failed to create thread for application');
    });
  });
});