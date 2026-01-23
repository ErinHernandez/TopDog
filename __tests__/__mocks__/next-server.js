/**
 * Mock for Next.js server modules (next/server)
 * 
 * Provides mock implementations of NextRequest and NextResponse
 * for Jest testing environment
 */

class MockHeaders extends Headers {
  constructor(init) {
    super(init);
    this._headers = new Map();
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  get(name) {
    return this._headers.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
    return this;
  }

  has(name) {
    return this._headers.has(name.toLowerCase());
  }

  delete(name) {
    this._headers.delete(name.toLowerCase());
  }

  forEach(callback) {
    this._headers.forEach((value, key) => {
      callback(value, key, this);
    });
  }
}

class MockNextRequest {
  constructor(input, init = {}) {
    // Handle URL input
    if (typeof input === 'string') {
      this.url = input;
      this._url = new URL(input);
    } else if (input instanceof URL) {
      this.url = input.href;
      this._url = input;
    } else {
      this.url = input.url || 'https://example.com/';
      this._url = new URL(this.url);
    }

    // Handle nextUrl
    this.nextUrl = {
      pathname: this._url.pathname,
      search: this._url.search,
      searchParams: this._url.searchParams,
      href: this._url.href,
      origin: this._url.origin,
      protocol: this._url.protocol,
      host: this._url.host,
      hostname: this._url.hostname,
      port: this._url.port,
    };

    // Handle headers
    if (init.headers) {
      this.headers = init.headers instanceof Headers 
        ? init.headers 
        : new MockHeaders(init.headers);
    } else {
      this.headers = new MockHeaders();
    }

    // Handle method
    this.method = init.method || 'GET';

    // Handle cookies
    if (init.cookies) {
      this.cookies = init.cookies;
    } else {
      this.cookies = {
        get: (name) => {
          const cookieHeader = this.headers.get('cookie');
          if (!cookieHeader) return undefined;
          
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) acc[key] = value;
            return acc;
          }, {});
          
          return cookies[name] ? { value: cookies[name] } : undefined;
        },
        set: (name, value) => {
          // Mock implementation
        },
        has: (name) => {
          const cookie = this.cookies.get(name);
          return cookie !== undefined;
        },
      };
    }

    // Handle body
    this.body = init.body || null;
  }
}

class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new MockHeaders(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
    this.redirected = false;
  }

  static next(init = {}) {
    return new MockNextResponse(null, { status: 200, ...init });
  }

  static redirect(url, init = {}) {
    const response = new MockNextResponse(null, {
      status: init.status || 307,
      ...init,
    });
    response.headers.set('location', url.toString());
    response.redirected = true;
    return response;
  }

  static rewrite(url, init = {}) {
    return new MockNextResponse(null, { status: 200, ...init });
  }

  static json(body, init = {}) {
    return new MockNextResponse(JSON.stringify(body), {
      status: init.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }
}

// Export for ESM
module.exports = {
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
};

// Also set as default export for compatibility
module.exports.default = {
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
};
