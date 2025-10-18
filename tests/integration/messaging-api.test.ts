import { NextRequest } from 'next/server';
import { GET as getThreads, POST as createThread } from '@/app/api/threads/route';
import { GET as getThread } from '@/app/api/threads/[threadId]/route';
import { POST as sendMessage } from '@/app/api/messages/route';
import { POST as markAsRead } from '@/app/api/messages/read/route';
import { GET as getUnreadCount } from '@/app/api/messages/unread-count/route';
import { POST as uploadFile } from '@/app/api/upload/route';
import { TestDatabase, testDataFactory } from '../setup/database';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = TestDatabase.getInstance();
  await testDb.setup();
});

afterAll(async () => {
  await testDb.teardown();
});

beforeEach(async () => {
  await testDb.cleanup();
  jest.clearAllMocks();
});

describe('Messaging API Integration Tests', () => {
  let organizer: any;
  let nurse: any;
  let job: any;

  beforeEach(async () => {
    const prisma = testDb.getPrismaClient();
    
    // Create test users
    organizer = await prisma.user.create({
      data: testDataFactory.user.organizer({
        email: 'organizer@test.com',
      }),
    });

    nurse = await prisma.user.create({
      data: testDataFactory.user.nurse({
        email: 'nurse@test.com',
      }),
    });

    // Create test job
    job = await prisma.job.create({
      data: testDataFactory.job(organizer.id, {
        title: 'Test Job for Messaging',
        status: 'OPEN',
      }),
    });
  });

  describe('Thread Management API', () => {
    it('should create thread via API', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/threads', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        }),
      });

      const response = await createThread(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobId).toBe(job.id);
      expect(data.data.participants).toEqual([organizer.id, nurse.id]);
    });

    it('should get threads via API', async () => {
      const prisma = testDb.getPrismaClient();
      
      // Create a thread first
      await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/threads');
      const response = await getThreads(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].jobId).toBe(job.id);
    });

    it('should get specific thread via API', async () => {
      const prisma = testDb.getPrismaClient();
      
      // Create a thread first
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/threads/${thread.id}`);
      const response = await getThread(request, { params: { threadId: thread.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(thread.id);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/threads');
      const response = await getThreads(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate thread creation data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/threads', {
        method: 'POST',
        body: JSON.stringify({
          jobId: '', // Invalid empty jobId
          participants: [organizer.id], // Too few participants
        }),
      });

      const response = await createThread(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('Message Management API', () => {
    let thread: any;

    beforeEach(async () => {
      const prisma = testDb.getPrismaClient();
      thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });
    });

    it('should send message via API', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          content: 'Hello, this is a test message',
          attachments: [],
        }),
      });

      const response = await sendMessage(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('Hello, this is a test message');
      expect(data.data.senderId).toBe(organizer.id);
    });

    it('should mark messages as read via API', async () => {
      const prisma = testDb.getPrismaClient();
      
      // Create a message first
      const message = await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: organizer.id,
          content: 'Test message',
          readBy: [organizer.id],
        },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: nurse.id, role: 'NURSE' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/messages/read', {
        method: 'POST',
        body: JSON.stringify({
          messageIds: [message.id],
        }),
      });

      const response = await markAsRead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should get unread count via API', async () => {
      const prisma = testDb.getPrismaClient();
      
      // Create unread messages
      await prisma.message.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'Unread message 1',
            readBy: [organizer.id],
          },
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'Unread message 2',
            readBy: [organizer.id],
          },
        ],
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: nurse.id, role: 'NURSE' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/messages/unread-count');
      const response = await getUnreadCount(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.unreadCount).toBe(2);
    });

    it('should validate message data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          content: '', // Empty content should fail validation
          attachments: [],
        }),
      });

      const response = await sendMessage(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should prevent access to threads user is not part of', async () => {
      const prisma = testDb.getPrismaClient();
      
      // Create another user not in the thread
      const otherUser = await prisma.user.create({
        data: testDataFactory.user.nurse({
          email: 'other@test.com',
        }),
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: otherUser.id, role: 'NURSE' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          content: 'Unauthorized message',
          attachments: [],
        }),
      });

      const response = await sendMessage(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied');
    });
  });

  describe('File Upload API', () => {
    it('should upload file via API', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const formData = new FormData();
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', testFile);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadFile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filename).toBe('test.pdf');
      expect(data.data.type).toBe('application/pdf');
      expect(data.data.url).toContain('mock-storage.example.com');
    });

    it('should validate file type', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const formData = new FormData();
      const testFile = new File(['test content'], 'test.js', { type: 'application/javascript' });
      formData.append('file', testFile);
      formData.append('allowedTypes', JSON.stringify(['application/pdf']));

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadFile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File type not allowed');
    });

    it('should validate file size', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const formData = new FormData();
      // Create a large file content
      const largeContent = 'x'.repeat(15 * 1024 * 1024); // 15MB
      const testFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      formData.append('file', testFile);
      formData.append('maxSize', '10485760'); // 10MB limit

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadFile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File size exceeds maximum allowed size');
    });

    it('should require authentication for file upload', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const formData = new FormData();
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', testFile);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadFile(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: organizer.id, role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/threads', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await createThread(request);
      
      expect(response.status).toBe(500);
    });

    it('should handle database connection errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'non-existent-user', role: 'ORGANIZER' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/threads');
      const response = await getThreads(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch threads');
    });
  });
});