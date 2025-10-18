import { test, expect, Page } from '@playwright/test';
import { TestDatabase, testDataFactory } from '../setup/database';

let testDb: TestDatabase;

test.beforeAll(async () => {
  testDb = TestDatabase.getInstance();
  await testDb.setup();
});

test.afterAll(async () => {
  await testDb.teardown();
});

test.beforeEach(async () => {
  await testDb.cleanup();
});

// Helper function to create test users and job
async function setupTestData() {
  const prisma = testDb.getPrismaClient();
  
  // Create organizer
  const organizer = await prisma.user.create({
    data: testDataFactory.user.organizer({
      email: 'organizer@test.com',
    }),
  });

  // Create nurse
  const nurse = await prisma.user.create({
    data: testDataFactory.user.nurse({
      email: 'nurse@test.com',
    }),
  });

  // Create job
  const job = await prisma.job.create({
    data: testDataFactory.job(organizer.id, {
      title: 'Test Sports Event for Messaging',
      status: 'OPEN',
    }),
  });

  return { organizer, nurse, job };
}

// Helper function to login user
async function loginUser(page: Page, email: string, password: string = 'password123') {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

test.describe('Messaging System E2E Tests', () => {
  test.describe('Thread Management', () => {
    test('should create thread when nurse applies to job', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();

      // Login as nurse
      await loginUser(page, nurse.email);

      // Navigate to job and apply
      await page.goto(`/jobs/${job.id}`);
      await page.click('[data-testid="apply-button"]');
      
      // Fill application form
      await page.fill('[data-testid="application-message"]', 'I am interested in this position');
      await page.click('[data-testid="submit-application"]');

      // Should redirect to inbox with new thread
      await page.waitForURL('/inbox');
      
      // Verify thread exists
      await expect(page.locator('[data-testid="thread-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="thread-title"]')).toContainText(job.title);
    });

    test('should display thread list with job information', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread manually
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create a message
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: organizer.id,
          content: 'Hello, I would like to discuss the job requirements.',
        },
      });

      // Login as nurse
      await loginUser(page, nurse.email);

      // Navigate to inbox
      await page.goto('/inbox');

      // Verify thread information
      await expect(page.locator('[data-testid="thread-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="thread-title"]')).toContainText(job.title);
      await expect(page.locator('[data-testid="thread-preview"]')).toContainText('Hello, I would like to discuss');
      await expect(page.locator('[data-testid="unread-indicator"]')).toBeVisible();
    });

    test('should show unread message count', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create multiple unread messages
      await prisma.message.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'First message',
            readBy: [organizer.id],
          },
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'Second message',
            readBy: [organizer.id],
          },
        ],
      });

      // Login as nurse
      await loginUser(page, nurse.email);

      // Navigate to inbox
      await page.goto('/inbox');

      // Verify unread count
      await expect(page.locator('[data-testid="unread-count"]')).toContainText('2');
    });
  });

  test.describe('Message Sending and Receiving', () => {
    test('should send and receive text messages', async ({ browser }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create two browser contexts for organizer and nurse
      const organizerContext = await browser.newContext();
      const nurseContext = await browser.newContext();
      
      const organizerPage = await organizerContext.newPage();
      const nursePage = await nurseContext.newPage();

      // Login both users
      await loginUser(organizerPage, organizer.email);
      await loginUser(nursePage, nurse.email);

      // Navigate both to the thread
      await organizerPage.goto(`/inbox/${thread.id}`);
      await nursePage.goto(`/inbox/${thread.id}`);

      // Organizer sends a message
      await organizerPage.fill('[data-testid="message-input"]', 'Hello, thank you for applying!');
      await organizerPage.click('[data-testid="send-message"]');

      // Verify message appears for organizer
      await expect(organizerPage.locator('[data-testid="message-bubble"]').last()).toContainText('Hello, thank you for applying!');

      // Refresh nurse page and verify message appears
      await nursePage.reload();
      await expect(nursePage.locator('[data-testid="message-bubble"]').last()).toContainText('Hello, thank you for applying!');

      // Nurse replies
      await nursePage.fill('[data-testid="message-input"]', 'Thank you! I have some questions about the schedule.');
      await nursePage.click('[data-testid="send-message"]');

      // Verify reply appears for nurse
      await expect(nursePage.locator('[data-testid="message-bubble"]').last()).toContainText('Thank you! I have some questions');

      // Refresh organizer page and verify reply appears
      await organizerPage.reload();
      await expect(organizerPage.locator('[data-testid="message-bubble"]').last()).toContainText('Thank you! I have some questions');

      await organizerContext.close();
      await nurseContext.close();
    });

    test('should handle message validation errors', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Try to send empty message
      await page.click('[data-testid="send-message"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Message content is required');

      // Try to send message that's too long
      const longMessage = 'a'.repeat(2001);
      await page.fill('[data-testid="message-input"]', longMessage);
      await page.click('[data-testid="send-message"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Message is too long');
    });

    test('should display message timestamps and sender information', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create messages with different senders
      await prisma.message.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'Message from organizer',
            createdAt: new Date('2024-01-01T10:00:00Z'),
          },
          {
            threadId: thread.id,
            senderId: nurse.id,
            content: 'Message from nurse',
            createdAt: new Date('2024-01-01T10:05:00Z'),
          },
        ],
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Verify message display
      const messages = page.locator('[data-testid="message-bubble"]');
      await expect(messages).toHaveCount(2);

      // Check first message (from organizer)
      await expect(messages.first().locator('[data-testid="message-content"]')).toContainText('Message from organizer');
      await expect(messages.first().locator('[data-testid="message-sender"]')).toContainText('You');
      await expect(messages.first()).toHaveClass(/sent/);

      // Check second message (from nurse)
      await expect(messages.last().locator('[data-testid="message-content"]')).toContainText('Message from nurse');
      await expect(messages.last().locator('[data-testid="message-sender"]')).toContainText(nurse.profile.name);
      await expect(messages.last()).toHaveClass(/received/);
    });
  });

  test.describe('File Upload and Attachments', () => {
    test('should upload and send file attachments', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Create a test file
      const testFileContent = 'This is a test PDF content';
      const testFile = new File([testFileContent], 'contract.pdf', { type: 'application/pdf' });

      // Upload file
      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'contract.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(testFileContent),
      });

      // Verify file is selected
      await expect(page.locator('[data-testid="selected-file"]')).toContainText('contract.pdf');

      // Add message and send
      await page.fill('[data-testid="message-input"]', 'Please review the attached contract.');
      await page.click('[data-testid="send-message"]');

      // Verify message with attachment appears
      const messageWithAttachment = page.locator('[data-testid="message-bubble"]').last();
      await expect(messageWithAttachment.locator('[data-testid="message-content"]')).toContainText('Please review the attached contract.');
      await expect(messageWithAttachment.locator('[data-testid="attachment-item"]')).toBeVisible();
      await expect(messageWithAttachment.locator('[data-testid="attachment-name"]')).toContainText('contract.pdf');
    });

    test('should validate file types and sizes', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Try to upload disallowed file type
      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'script.js',
        mimeType: 'application/javascript',
        buffer: Buffer.from('console.log("test");'),
      });

      await expect(page.locator('[data-testid="file-error"]')).toContainText('File type not allowed');

      // Try to upload oversized file (simulate large file)
      const largeContent = 'x'.repeat(15 * 1024 * 1024); // 15MB
      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'large.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(largeContent),
      });

      await expect(page.locator('[data-testid="file-error"]')).toContainText('File size exceeds maximum allowed size');
    });

    test('should handle multiple attachments', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Upload multiple files
      await page.setInputFiles('[data-testid="file-input"]', [
        {
          name: 'contract.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('PDF content'),
        },
        {
          name: 'schedule.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('JPEG content'),
        },
      ]);

      // Verify both files are selected
      await expect(page.locator('[data-testid="selected-file"]')).toHaveCount(2);
      await expect(page.locator('[data-testid="selected-file"]').first()).toContainText('contract.pdf');
      await expect(page.locator('[data-testid="selected-file"]').last()).toContainText('schedule.jpg');

      // Send message with attachments
      await page.fill('[data-testid="message-input"]', 'Please find the contract and schedule attached.');
      await page.click('[data-testid="send-message"]');

      // Verify message with multiple attachments
      const messageWithAttachments = page.locator('[data-testid="message-bubble"]').last();
      await expect(messageWithAttachments.locator('[data-testid="attachment-item"]')).toHaveCount(2);
    });

    test('should prevent uploading too many attachments', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Try to upload 6 files (exceeds limit of 5)
      const files = Array(6).fill(null).map((_, i) => ({
        name: `file${i + 1}.pdf`,
        mimeType: 'application/pdf',
        buffer: Buffer.from(`Content ${i + 1}`),
      }));

      await page.setInputFiles('[data-testid="file-input"]', files);

      await expect(page.locator('[data-testid="file-error"]')).toContainText('Maximum 5 attachments allowed');
    });
  });

  test.describe('Read Status and Notifications', () => {
    test('should mark messages as read when viewing thread', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create unread messages
      await prisma.message.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'First unread message',
            readBy: [organizer.id],
          },
          {
            threadId: thread.id,
            senderId: organizer.id,
            content: 'Second unread message',
            readBy: [organizer.id],
          },
        ],
      });

      // Login as nurse
      await loginUser(page, nurse.email);

      // Check inbox shows unread count
      await page.goto('/inbox');
      await expect(page.locator('[data-testid="unread-count"]')).toContainText('2');

      // Open thread
      await page.click('[data-testid="thread-item"]');

      // Wait for messages to load and be marked as read
      await page.waitForTimeout(1000);

      // Go back to inbox and verify unread count is cleared
      await page.goto('/inbox');
      await expect(page.locator('[data-testid="unread-count"]')).not.toBeVisible();
    });

    test('should show read status for sent messages', async ({ browser }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Create two browser contexts
      const organizerContext = await browser.newContext();
      const nurseContext = await browser.newContext();
      
      const organizerPage = await organizerContext.newPage();
      const nursePage = await nurseContext.newPage();

      // Login both users
      await loginUser(organizerPage, organizer.email);
      await loginUser(nursePage, nurse.email);

      // Organizer sends message
      await organizerPage.goto(`/inbox/${thread.id}`);
      await organizerPage.fill('[data-testid="message-input"]', 'Test message for read status');
      await organizerPage.click('[data-testid="send-message"]');

      // Message should show as unread initially
      await expect(organizerPage.locator('[data-testid="message-status"]').last()).toContainText('Sent');

      // Nurse opens thread and reads message
      await nursePage.goto(`/inbox/${thread.id}`);
      await nursePage.waitForTimeout(1000); // Wait for read status to update

      // Refresh organizer page and check read status
      await organizerPage.reload();
      await expect(organizerPage.locator('[data-testid="message-status"]').last()).toContainText('Read');

      await organizerContext.close();
      await nurseContext.close();
    });
  });

  test.describe('Security and Access Control', () => {
    test('should prevent unauthorized access to threads', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create another user not involved in the thread
      const unauthorizedUser = await prisma.user.create({
        data: testDataFactory.user.nurse({
          email: 'unauthorized@test.com',
        }),
      });

      // Create thread between organizer and nurse
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as unauthorized user
      await loginUser(page, unauthorizedUser.email);

      // Try to access thread directly
      await page.goto(`/inbox/${thread.id}`);

      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('should prevent sending messages to threads user is not part of', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create another user
      const unauthorizedUser = await prisma.user.create({
        data: testDataFactory.user.nurse({
          email: 'unauthorized@test.com',
        }),
      });

      // Create thread between organizer and nurse
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as unauthorized user
      await loginUser(page, unauthorizedUser.email);

      // Try to send message via API (simulate direct API call)
      const response = await page.request.post('/api/messages', {
        data: {
          threadId: thread.id,
          content: 'Unauthorized message',
          attachments: [],
        },
      });

      expect(response.status()).toBe(403);
      const responseData = await response.json();
      expect(responseData.error).toBe('Access denied');
    });

    test('should validate user authentication for all messaging endpoints', async ({ page }) => {
      // Test without authentication
      const endpoints = [
        { method: 'GET', url: '/api/threads' },
        { method: 'POST', url: '/api/threads' },
        { method: 'GET', url: '/api/threads/test-thread-id' },
        { method: 'POST', url: '/api/messages' },
        { method: 'POST', url: '/api/messages/read' },
        { method: 'GET', url: '/api/messages/unread-count' },
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.fetch(endpoint.url, {
          method: endpoint.method,
          data: endpoint.method === 'POST' ? {} : undefined,
        });

        expect(response.status()).toBe(401);
        const responseData = await response.json();
        expect(responseData.error).toBe('Unauthorized');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Simulate network failure
      await page.route('/api/messages', route => route.abort());

      // Try to send message
      await page.fill('[data-testid="message-input"]', 'Test message');
      await page.click('[data-testid="send-message"]');

      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toContainText('Failed to send message');
    });

    test('should handle empty thread list', async ({ page }) => {
      const { nurse } = await setupTestData();

      // Login as nurse (no threads created)
      await loginUser(page, nurse.email);
      await page.goto('/inbox');

      // Should show empty state
      await expect(page.locator('[data-testid="empty-inbox"]')).toContainText('No messages yet');
    });

    test('should handle thread with no messages', async ({ page }) => {
      const { organizer, nurse, job } = await setupTestData();
      const prisma = testDb.getPrismaClient();

      // Create thread without messages
      const thread = await prisma.thread.create({
        data: {
          jobId: job.id,
          participants: [organizer.id, nurse.id],
        },
      });

      // Login as organizer
      await loginUser(page, organizer.email);
      await page.goto(`/inbox/${thread.id}`);

      // Should show empty conversation state
      await expect(page.locator('[data-testid="empty-conversation"]')).toContainText('Start the conversation');
    });
  });
});