/**
 * Firebase and Next.js API route mocks for testing TopDog Studio
 */
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock Firebase Admin Auth
 */
export class MockFirebaseAuth {
  private validTokens: Map<string, any> = new Map();

  /**
   * Register a token that will be considered valid
   */
  registerToken(token: string, decodedData: any): void {
    this.validTokens.set(token, decodedData);
  }

  /**
   * Verify an ID token (mock)
   */
  async verifyIdToken(token: string): Promise<any> {
    if (this.validTokens.has(token)) {
      return this.validTokens.get(token);
    }
    throw new Error('auth/id-token-expired');
  }

  /**
   * Reset all registered tokens
   */
  reset(): void {
    this.validTokens.clear();
  }
}

/**
 * Mock Firestore document
 */
export class MockDocumentSnapshot {
  private _data: Record<string, any> | null;
  readonly id: string;

  constructor(id: string, data: Record<string, any> | null) {
    this.id = id;
    this._data = data;
  }

  exists(): boolean {
    return this._data !== null;
  }

  data(): Record<string, any> | undefined {
    return this._data || undefined;
  }
}

/**
 * Create a mock Next.js API request
 */
export function createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    cookies: {},
    env: {},
    url: '/api/test',
    ...overrides,
  } as unknown as NextApiRequest;
}

/**
 * Create a mock Next.js API response with tracking
 */
export function createMockResponse(): NextApiResponse & {
  _status: number;
  _json: any;
  _sent: boolean;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _sent: false,
    _headers: {},

    status(code: number) {
      res._status = code;
      return res;
    },

    json(data: any) {
      res._json = data;
      res._sent = true;
      return res;
    },

    send(data: any) {
      res._json = data;
      res._sent = true;
      return res;
    },

    end() {
      res._sent = true;
      return res;
    },

    setHeader(name: string, value: string) {
      res._headers[name] = value;
      return res;
    },

    getHeader(name: string) {
      return res._headers[name];
    },
  };

  return res;
}

/**
 * Create a mock authenticated request with Bearer token
 */
export function createAuthenticatedRequest(
  uid: string,
  token: string = 'valid-test-token',
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return createMockRequest({
    headers: {
      authorization: `Bearer ${token}`,
      ...overrides.headers,
    },
    ...overrides,
  });
}

/**
 * Create mock Firestore reference
 */
export function createMockDocRef(id: string): any {
  return { id, path: `collection/${id}` };
}

/**
 * Mock getDoc that returns controlled data
 */
export function createMockGetDoc(documents: Map<string, Record<string, any> | null>) {
  return async (ref: any): Promise<MockDocumentSnapshot> => {
    const data = documents.get(ref.id) ?? null;
    return new MockDocumentSnapshot(ref.id, data);
  };
}
