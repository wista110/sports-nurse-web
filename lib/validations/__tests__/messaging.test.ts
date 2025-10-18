import {
  sendMessageSchema,
  createThreadSchema,
  markAsReadSchema,
  fileUploadSchema,
  messageAttachmentSchema,
} from '../messaging';
import { ZodError } from 'zod';

describe('Messaging Validation Schemas', () => {
  describe('messageAttachmentSchema', () => {
    const validAttachment = {
      filename: 'test-document.pdf',
      url: 'https://example.com/files/test-document.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    it('should validate valid attachment data', () => {
      const result = messageAttachmentSchema.parse(validAttachment);
      expect(result).toEqual(validAttachment);
    });

    it('should reject attachment with empty filename', () => {
      const invalidAttachment = {
        ...validAttachment,
        filename: '',
      };

      expect(() => messageAttachmentSchema.parse(invalidAttachment)).toThrow(ZodError);
      
      try {
        messageAttachmentSchema.parse(invalidAttachment);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Filename is required');
      }
    });

    it('should reject attachment with invalid URL', () => {
      const invalidAttachment = {
        ...validAttachment,
        url: 'not-a-valid-url',
      };

      expect(() => messageAttachmentSchema.parse(invalidAttachment)).toThrow(ZodError);
      
      try {
        messageAttachmentSchema.parse(invalidAttachment);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Invalid URL');
      }
    });

    it('should reject attachment with empty type', () => {
      const invalidAttachment = {
        ...validAttachment,
        type: '',
      };

      expect(() => messageAttachmentSchema.parse(invalidAttachment)).toThrow(ZodError);
      
      try {
        messageAttachmentSchema.parse(invalidAttachment);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('File type is required');
      }
    });

    it('should reject attachment with zero or negative size', () => {
      const invalidAttachment = {
        ...validAttachment,
        size: 0,
      };

      expect(() => messageAttachmentSchema.parse(invalidAttachment)).toThrow(ZodError);
      
      try {
        messageAttachmentSchema.parse(invalidAttachment);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('File size must be positive');
      }
    });

    it('should validate different file types', () => {
      const imageAttachment = {
        ...validAttachment,
        filename: 'image.jpg',
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      };

      const result = messageAttachmentSchema.parse(imageAttachment);
      expect(result.type).toBe('image/jpeg');
    });
  });

  describe('sendMessageSchema', () => {
    const validMessageData = {
      threadId: 'thread-123',
      content: 'This is a valid message content',
      attachments: [
        {
          filename: 'document.pdf',
          url: 'https://example.com/document.pdf',
          type: 'application/pdf',
          size: 2048,
        },
      ],
    };

    it('should validate valid message data', () => {
      const result = sendMessageSchema.parse(validMessageData);
      expect(result).toEqual(validMessageData);
    });

    it('should validate message without attachments', () => {
      const messageWithoutAttachments = {
        threadId: 'thread-123',
        content: 'Message without attachments',
      };

      const result = sendMessageSchema.parse(messageWithoutAttachments);
      expect(result.attachments).toEqual([]);
    });

    it('should reject message with empty thread ID', () => {
      const invalidMessage = {
        ...validMessageData,
        threadId: '',
      };

      expect(() => sendMessageSchema.parse(invalidMessage)).toThrow(ZodError);
      
      try {
        sendMessageSchema.parse(invalidMessage);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Thread ID is required');
      }
    });

    it('should reject message with empty content', () => {
      const invalidMessage = {
        ...validMessageData,
        content: '',
      };

      expect(() => sendMessageSchema.parse(invalidMessage)).toThrow(ZodError);
      
      try {
        sendMessageSchema.parse(invalidMessage);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Message content is required');
      }
    });

    it('should reject message with content too long', () => {
      const invalidMessage = {
        ...validMessageData,
        content: 'a'.repeat(2001), // Exceeds 2000 character limit
      };

      expect(() => sendMessageSchema.parse(invalidMessage)).toThrow(ZodError);
      
      try {
        sendMessageSchema.parse(invalidMessage);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Message is too long');
      }
    });

    it('should reject message with too many attachments', () => {
      const invalidMessage = {
        ...validMessageData,
        attachments: Array(6).fill({
          filename: 'file.pdf',
          url: 'https://example.com/file.pdf',
          type: 'application/pdf',
          size: 1024,
        }),
      };

      expect(() => sendMessageSchema.parse(invalidMessage)).toThrow(ZodError);
      
      try {
        sendMessageSchema.parse(invalidMessage);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Maximum 5 attachments allowed');
      }
    });

    it('should validate message at maximum content length', () => {
      const messageAtLimit = {
        ...validMessageData,
        content: 'a'.repeat(2000), // Exactly at 2000 character limit
      };

      const result = sendMessageSchema.parse(messageAtLimit);
      expect(result.content.length).toBe(2000);
    });

    it('should validate message with maximum attachments', () => {
      const messageWithMaxAttachments = {
        ...validMessageData,
        attachments: Array(5).fill({
          filename: 'file.pdf',
          url: 'https://example.com/file.pdf',
          type: 'application/pdf',
          size: 1024,
        }),
      };

      const result = sendMessageSchema.parse(messageWithMaxAttachments);
      expect(result.attachments).toHaveLength(5);
    });
  });

  describe('createThreadSchema', () => {
    const validThreadData = {
      jobId: 'job-123',
      participants: ['user-1', 'user-2'],
    };

    it('should validate valid thread data', () => {
      const result = createThreadSchema.parse(validThreadData);
      expect(result).toEqual(validThreadData);
    });

    it('should reject thread with empty job ID', () => {
      const invalidThread = {
        ...validThreadData,
        jobId: '',
      };

      expect(() => createThreadSchema.parse(invalidThread)).toThrow(ZodError);
      
      try {
        createThreadSchema.parse(invalidThread);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Job ID is required');
      }
    });

    it('should reject thread with insufficient participants', () => {
      const invalidThread = {
        ...validThreadData,
        participants: ['user-1'], // Only one participant
      };

      expect(() => createThreadSchema.parse(invalidThread)).toThrow(ZodError);
      
      try {
        createThreadSchema.parse(invalidThread);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('At least 2 participants required');
      }
    });

    it('should reject thread with too many participants', () => {
      const invalidThread = {
        ...validThreadData,
        participants: Array(11).fill('user').map((_, i) => `user-${i}`), // 11 participants
      };

      expect(() => createThreadSchema.parse(invalidThread)).toThrow(ZodError);
      
      try {
        createThreadSchema.parse(invalidThread);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('Maximum 10 participants allowed');
      }
    });

    it('should validate thread with maximum participants', () => {
      const threadWithMaxParticipants = {
        ...validThreadData,
        participants: Array(10).fill('user').map((_, i) => `user-${i}`), // Exactly 10 participants
      };

      const result = createThreadSchema.parse(threadWithMaxParticipants);
      expect(result.participants).toHaveLength(10);
    });

    it('should validate thread with minimum participants', () => {
      const threadWithMinParticipants = {
        ...validThreadData,
        participants: ['user-1', 'user-2'], // Exactly 2 participants
      };

      const result = createThreadSchema.parse(threadWithMinParticipants);
      expect(result.participants).toHaveLength(2);
    });
  });

  describe('markAsReadSchema', () => {
    const validMarkAsReadData = {
      messageIds: ['msg-1', 'msg-2', 'msg-3'],
    };

    it('should validate valid mark as read data', () => {
      const result = markAsReadSchema.parse(validMarkAsReadData);
      expect(result).toEqual(validMarkAsReadData);
    });

    it('should reject empty message IDs array', () => {
      const invalidData = {
        messageIds: [],
      };

      expect(() => markAsReadSchema.parse(invalidData)).toThrow(ZodError);
      
      try {
        markAsReadSchema.parse(invalidData);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('At least one message ID required');
      }
    });

    it('should validate single message ID', () => {
      const singleMessageData = {
        messageIds: ['msg-1'],
      };

      const result = markAsReadSchema.parse(singleMessageData);
      expect(result.messageIds).toHaveLength(1);
    });

    it('should validate multiple message IDs', () => {
      const multipleMessageData = {
        messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5'],
      };

      const result = markAsReadSchema.parse(multipleMessageData);
      expect(result.messageIds).toHaveLength(5);
    });
  });

  describe('fileUploadSchema', () => {
    // Mock File object for testing
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File(['content'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    const validFileData = {
      file: createMockFile('document.pdf', 'application/pdf', 1024 * 1024), // 1MB
    };

    it('should validate valid file upload data with defaults', () => {
      const result = fileUploadSchema.parse(validFileData);
      expect(result.file).toBe(validFileData.file);
      expect(result.maxSize).toBe(10 * 1024 * 1024); // 10MB default
      expect(result.allowedTypes).toContain('application/pdf');
    });

    it('should validate file upload with custom settings', () => {
      const customFileData = {
        file: createMockFile('image.jpg', 'image/jpeg', 2 * 1024 * 1024), // 2MB
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png'],
      };

      const result = fileUploadSchema.parse(customFileData);
      expect(result.maxSize).toBe(5 * 1024 * 1024);
      expect(result.allowedTypes).toEqual(['image/jpeg', 'image/png']);
    });

    it('should reject file exceeding size limit', () => {
      const oversizedFileData = {
        file: createMockFile('large.pdf', 'application/pdf', 15 * 1024 * 1024), // 15MB
        maxSize: 10 * 1024 * 1024, // 10MB limit
      };

      expect(() => fileUploadSchema.parse(oversizedFileData)).toThrow(ZodError);
      
      try {
        fileUploadSchema.parse(oversizedFileData);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('File size exceeds maximum allowed size');
      }
    });

    it('should reject file with disallowed type', () => {
      const disallowedFileData = {
        file: createMockFile('script.js', 'application/javascript', 1024),
        allowedTypes: ['application/pdf', 'image/jpeg'],
      };

      expect(() => fileUploadSchema.parse(disallowedFileData)).toThrow(ZodError);
      
      try {
        fileUploadSchema.parse(disallowedFileData);
      } catch (error) {
        expect((error as ZodError).errors[0].message).toBe('File type not allowed');
      }
    });

    it('should validate allowed image types', () => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      
      imageTypes.forEach(type => {
        const fileData = {
          file: createMockFile(`image.${type.split('/')[1]}`, type, 1024),
        };
        
        const result = fileUploadSchema.parse(fileData);
        expect(result.file.type).toBe(type);
      });
    });

    it('should validate allowed document types', () => {
      const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      
      documentTypes.forEach(type => {
        const extension = type === 'application/pdf' ? 'pdf' : 
                         type === 'application/msword' ? 'doc' : 'docx';
        const fileData = {
          file: createMockFile(`document.${extension}`, type, 1024),
        };
        
        const result = fileUploadSchema.parse(fileData);
        expect(result.file.type).toBe(type);
      });
    });

    it('should validate file at exact size limit', () => {
      const fileAtLimit = {
        file: createMockFile('document.pdf', 'application/pdf', 10 * 1024 * 1024), // Exactly 10MB
        maxSize: 10 * 1024 * 1024,
      };

      const result = fileUploadSchema.parse(fileAtLimit);
      expect(result.file.size).toBe(10 * 1024 * 1024);
    });

    it('should handle custom max size smaller than default', () => {
      const smallFileData = {
        file: createMockFile('small.pdf', 'application/pdf', 1024), // 1KB
        maxSize: 2048, // 2KB limit
      };

      const result = fileUploadSchema.parse(smallFileData);
      expect(result.maxSize).toBe(2048);
    });
  });

  describe('Schema Integration', () => {
    it('should work together in a complete message flow', () => {
      // Create thread
      const threadData = {
        jobId: 'job-123',
        participants: ['organizer-1', 'nurse-1'],
      };
      const validThread = createThreadSchema.parse(threadData);
      expect(validThread.participants).toHaveLength(2);

      // Send message with attachment
      const messageData = {
        threadId: 'thread-123',
        content: 'Please find the contract attached.',
        attachments: [
          {
            filename: 'contract.pdf',
            url: 'https://example.com/contract.pdf',
            type: 'application/pdf',
            size: 1024 * 500, // 500KB
          },
        ],
      };
      const validMessage = sendMessageSchema.parse(messageData);
      expect(validMessage.attachments).toHaveLength(1);

      // Mark messages as read
      const markReadData = {
        messageIds: ['msg-1', 'msg-2'],
      };
      const validMarkRead = markAsReadSchema.parse(markReadData);
      expect(validMarkRead.messageIds).toHaveLength(2);
    });

    it('should handle edge cases in combined validation', () => {
      // Maximum content with maximum attachments
      const maxMessageData = {
        threadId: 'thread-123',
        content: 'a'.repeat(2000),
        attachments: Array(5).fill({
          filename: 'file.pdf',
          url: 'https://example.com/file.pdf',
          type: 'application/pdf',
          size: 1024,
        }),
      };

      const result = sendMessageSchema.parse(maxMessageData);
      expect(result.content.length).toBe(2000);
      expect(result.attachments).toHaveLength(5);
    });
  });
});