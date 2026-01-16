/**
 * Tests for /api/user/update-contact endpoint
 *
 * Tests cover:
 * - Authentication
 * - Authorization (user can only update own contact)
 * - Input validation
 * - Email/phone format validation
 * - Successful updates
 * - Error handling
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../../lib/apiErrorHandler', () => ({
  withErrorHandling: jest.fn((req, res, handler) => handler(req, res, {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock('../../../lib/apiAuth', () => ({
  verifyAuthToken: jest.fn(),
  verifyUserAccess: jest.fn(),
}));

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const { verifyAuthToken, verifyUserAccess } = require('../../../lib/apiAuth');
const { getDb } = require('../../../lib/firebase-utils');
const { doc, updateDoc } = require('firebase/firestore');

describe('/api/user/update-contact', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    getDb.mockReturnValue({});
    doc.mockImplementation((db, collection, id) => ({ db, collection, id }));
    
    // Import handler after mocks are set up
    handler = require('../../../pages/api/user/update-contact').default;
  });

  describe('Authentication', () => {
    it('rejects requests without authorization header', async () => {
      verifyAuthToken.mockResolvedValue({ uid: null, error: 'Missing authorization header' });

      const req = createMockRequest({
        method: 'POST',
        body: { userId: 'user123', email: 'test@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authorization header',
        },
      });
    });

    it('rejects requests with invalid token', async () => {
      verifyAuthToken.mockResolvedValue({ uid: null, error: 'Invalid token' });

      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer invalid-token' },
        body: { userId: 'user123', email: 'test@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Authorization', () => {
    it('rejects when user tries to update another user\'s contact info', async () => {
      verifyAuthToken.mockResolvedValue({ uid: 'user123' });
      verifyUserAccess.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user456', email: 'test@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied - can only update your own contact information',
        },
      });
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      verifyAuthToken.mockResolvedValue({ uid: 'user123' });
      verifyUserAccess.mockReturnValue(true);
    });

    it('rejects missing userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { email: 'test@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
          }),
        })
      );
    });

    it('rejects when neither email nor phone is provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Either email or phone is required'),
          }),
        })
      );
    });

    it('rejects invalid email format', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123', email: 'invalid-email' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Invalid email format'),
          }),
        })
      );
    });

    it('rejects invalid phone format', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123', phone: '123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Invalid phone format'),
          }),
        })
      );
    });
  });

  describe('Successful Updates', () => {
    beforeEach(() => {
      verifyAuthToken.mockResolvedValue({ uid: 'user123' });
      verifyUserAccess.mockReturnValue(true);
      updateDoc.mockResolvedValue(undefined);
    });

    it('updates email successfully', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123', email: 'newemail@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: {
          userId: 'user123',
          email: 'newemail@example.com',
        },
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'newemail@example.com',
          emailVerified: false,
        })
      );
    });

    it('updates phone successfully', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123', phone: '+1234567890' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: {
          userId: 'user123',
          phone: '+1234567890',
        },
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          phone: '+1234567890',
          phoneVerified: false,
        })
      );
    });

    it('updates both email and phone', async () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: {
          userId: 'user123',
          email: 'newemail@example.com',
          phone: '+1234567890',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'newemail@example.com',
          phone: '+1234567890',
          emailVerified: false,
          phoneVerified: false,
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      verifyAuthToken.mockResolvedValue({ uid: 'user123' });
      verifyUserAccess.mockReturnValue(true);
    });

    it('handles Firestore errors gracefully', async () => {
      updateDoc.mockRejectedValue(new Error('Firestore error'));

      const req = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { userId: 'user123', email: 'test@example.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update contact information',
        },
      });
    });
  });

  describe('Method Validation', () => {
    it('rejects non-POST methods', async () => {
      const req = createMockRequest({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'METHOD_NOT_ALLOWED',
          }),
        })
      );
    });
  });
});
