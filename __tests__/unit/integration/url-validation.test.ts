import { describe, it, expect } from 'vitest';
import { validateEndpointURL, buildSafeFetchURL, URLValidationError } from '@/lib/studio/integration/url-validation';

describe('URL Validation — SSRF Protection', () => {
  describe('validateEndpointURL', () => {
    describe('Valid HTTPS URLs', () => {
      it('accepts valid HTTPS URLs', () => {
        const url = validateEndpointURL('https://api.topdog.studio/v1');
        expect(url).toBeInstanceOf(URL);
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe('api.topdog.studio');
      });

      it('accepts HTTPS URLs with trailing slash', () => {
        const url = validateEndpointURL('https://api.example.com/');
        expect(url).toBeInstanceOf(URL);
        expect(url.pathname).toBe('/');
      });

      it('accepts HTTPS URLs with port 443 (normalized away by URL constructor)', () => {
        const url = validateEndpointURL('https://api.example.com:443/v1');
        expect(url).toBeInstanceOf(URL);
        // URL constructor normalizes default port 443 for HTTPS to empty string
        expect(url.port).toBe('');
      });

      it('accepts HTTPS URLs with custom ports (non-blocked)', () => {
        const url = validateEndpointURL('https://api.example.com:8443/v1');
        expect(url).toBeInstanceOf(URL);
        expect(url.port).toBe('8443');
      });
    });

    describe('HTTP URL handling', () => {
      it('rejects HTTP URLs when allowHTTPInDev is false', () => {
        expect(() => {
          validateEndpointURL('http://api.example.com', false);
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('http://api.example.com', false);
        } catch (e) {
          expect(e).toBeInstanceOf(URLValidationError);
          if (e instanceof URLValidationError) {
            expect(e.url).toBe('http://api.example.com');
            expect(e.message).toContain('Unsafe URL scheme');
          }
        }
      });

      it('allows HTTP URLs when allowHTTPInDev is true', () => {
        const url = validateEndpointURL('http://api.example.com', true);
        expect(url).toBeInstanceOf(URL);
        expect(url.protocol).toBe('http:');
      });

      it('rejects non-http/https schemes', () => {
        expect(() => {
          validateEndpointURL('ftp://api.example.com');
        }).toThrow(URLValidationError);

        expect(() => {
          validateEndpointURL('file:///etc/passwd');
        }).toThrow(URLValidationError);
      });
    });

    describe('Private IPv4 ranges (Class A, B, C)', () => {
      it('rejects 127.0.0.1 (loopback)', () => {
        expect(() => {
          validateEndpointURL('https://127.0.0.1/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://127.0.0.1/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked private IP');
          }
        }
      });

      it('rejects 127.x.x.x range', () => {
        expect(() => validateEndpointURL('https://127.1.1.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://127.255.255.255')).toThrow(URLValidationError);
      });

      it('rejects 10.x.x.x range (Class A private)', () => {
        expect(() => {
          validateEndpointURL('https://10.0.0.1/api');
        }).toThrow(URLValidationError);

        expect(() => validateEndpointURL('https://10.255.255.255')).toThrow(URLValidationError);
      });

      it('rejects 172.16.0.0 to 172.31.255.255 range (Class B private)', () => {
        expect(() => {
          validateEndpointURL('https://172.16.0.1/api');
        }).toThrow(URLValidationError);

        expect(() => validateEndpointURL('https://172.20.0.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://172.31.255.255')).toThrow(URLValidationError);
      });

      it('accepts 172.15.x.x (outside private range)', () => {
        const url = validateEndpointURL('https://172.15.0.1');
        expect(url).toBeInstanceOf(URL);
      });

      it('accepts 172.32.x.x (outside private range)', () => {
        const url = validateEndpointURL('https://172.32.0.1');
        expect(url).toBeInstanceOf(URL);
      });

      it('rejects 192.168.x.x range (Class C private)', () => {
        expect(() => {
          validateEndpointURL('https://192.168.1.1/api');
        }).toThrow(URLValidationError);

        expect(() => validateEndpointURL('https://192.168.0.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://192.168.255.255')).toThrow(URLValidationError);
      });

      it('accepts 192.167.x.x (outside private range)', () => {
        const url = validateEndpointURL('https://192.167.1.1');
        expect(url).toBeInstanceOf(URL);
      });

      it('accepts 192.169.x.x (outside private range)', () => {
        const url = validateEndpointURL('https://192.169.1.1');
        expect(url).toBeInstanceOf(URL);
      });
    });

    describe('Link-local and AWS metadata', () => {
      it('rejects 169.254.x.x (link-local / AWS metadata)', () => {
        expect(() => {
          validateEndpointURL('https://169.254.169.254/api');
        }).toThrow(URLValidationError);

        expect(() => validateEndpointURL('https://169.254.0.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://169.254.255.255')).toThrow(URLValidationError);
      });

      it('accepts 169.253.x.x (outside link-local range)', () => {
        const url = validateEndpointURL('https://169.253.0.1');
        expect(url).toBeInstanceOf(URL);
      });

      it('accepts 169.255.x.x (outside link-local range)', () => {
        const url = validateEndpointURL('https://169.255.0.1');
        expect(url).toBeInstanceOf(URL);
      });
    });

    describe('Current network and shared address space', () => {
      it('rejects 0.x.x.x (current network)', () => {
        expect(() => validateEndpointURL('https://0.0.0.0')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://0.255.255.255')).toThrow(URLValidationError);
      });

      it('rejects 100.64.x.x to 100.127.x.x (RFC 6598 shared address space)', () => {
        expect(() => validateEndpointURL('https://100.64.0.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://100.100.0.1')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://100.127.255.255')).toThrow(URLValidationError);
      });

      it('accepts 100.63.x.x (outside shared address space)', () => {
        const url = validateEndpointURL('https://100.63.0.1');
        expect(url).toBeInstanceOf(URL);
      });

      it('accepts 100.128.x.x (outside shared address space)', () => {
        const url = validateEndpointURL('https://100.128.0.1');
        expect(url).toBeInstanceOf(URL);
      });
    });

    describe('Blocked hostnames', () => {
      it('rejects localhost', () => {
        expect(() => {
          validateEndpointURL('https://localhost/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://localhost/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked hostname');
            expect(e.message).toContain('localhost');
          }
        }
      });

      it('rejects localhost with port', () => {
        expect(() => validateEndpointURL('https://localhost:8080')).toThrow(URLValidationError);
      });

      it('rejects metadata.google.internal', () => {
        expect(() => {
          validateEndpointURL('https://metadata.google.internal/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://metadata.google.internal/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked hostname');
          }
        }
      });

      it('rejects metadata.google', () => {
        expect(() => validateEndpointURL('https://metadata.google')).toThrow(URLValidationError);
      });

      it('rejects metadata', () => {
        expect(() => validateEndpointURL('https://metadata')).toThrow(URLValidationError);
      });

      it('rejects instance-data', () => {
        expect(() => validateEndpointURL('https://instance-data')).toThrow(URLValidationError);
      });

      it('is case-insensitive for hostname matching', () => {
        expect(() => validateEndpointURL('https://LOCALHOST')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://LocalHost')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://METADATA.GOOGLE.INTERNAL')).toThrow(URLValidationError);
      });

      it('accepts valid hostnames', () => {
        const url = validateEndpointURL('https://api.example.com');
        expect(url).toBeInstanceOf(URL);
        expect(url.hostname).toBe('api.example.com');
      });
    });

    describe('IPv6 addresses', () => {
      it('rejects IPv6 loopback [::1]', () => {
        expect(() => {
          validateEndpointURL('https://[::1]/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://[::1]/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked IPv6');
          }
        }
      });

      it('rejects IPv6 loopback ::1 (without brackets)', () => {
        expect(() => validateEndpointURL('https://::1')).toThrow(URLValidationError);
      });

      it('rejects IPv6 link-local fe80::', () => {
        expect(() => validateEndpointURL('https://[fe80::1]')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://fe80::1')).toThrow(URLValidationError);
      });

      it('accepts valid public IPv6 addresses', () => {
        const url = validateEndpointURL('https://[2001:db8::1]/api');
        expect(url).toBeInstanceOf(URL);
      });
    });

    describe('Blocked ports', () => {
      it('rejects Redis port 6379', () => {
        expect(() => {
          validateEndpointURL('https://api.example.com:6379/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://api.example.com:6379/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked port');
            expect(e.message).toContain('6379');
          }
        }
      });

      it('rejects Memcached port 11211', () => {
        expect(() => validateEndpointURL('https://api.example.com:11211')).toThrow(URLValidationError);
      });

      it('rejects MongoDB port 27017', () => {
        expect(() => {
          validateEndpointURL('https://api.example.com:27017/api');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('https://api.example.com:27017/api');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Blocked port');
          }
        }
      });

      it('rejects PostgreSQL port 5432', () => {
        expect(() => validateEndpointURL('https://api.example.com:5432')).toThrow(URLValidationError);
      });

      it('rejects MySQL port 3306', () => {
        expect(() => validateEndpointURL('https://api.example.com:3306')).toThrow(URLValidationError);
      });

      it('rejects Elasticsearch ports 9200 and 9300', () => {
        expect(() => validateEndpointURL('https://api.example.com:9200')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('https://api.example.com:9300')).toThrow(URLValidationError);
      });

      it('allows common HTTPS port 443 (normalized away by URL constructor)', () => {
        const url = validateEndpointURL('https://api.example.com:443');
        expect(url).toBeInstanceOf(URL);
        // URL constructor normalizes default port 443 for HTTPS to empty string
        expect(url.port).toBe('');
      });

      it('allows common HTTP port 80 when allowHTTPInDev is true (normalized away)', () => {
        const url = validateEndpointURL('http://api.example.com:80', true);
        expect(url).toBeInstanceOf(URL);
        // URL constructor normalizes default port 80 for HTTP to empty string
        expect(url.port).toBe('');
      });

      it('allows custom safe ports', () => {
        const url = validateEndpointURL('https://api.example.com:8443');
        expect(url).toBeInstanceOf(URL);
        expect(url.port).toBe('8443');
      });

      it('defaults to port 443 for HTTPS when not specified', () => {
        const url = validateEndpointURL('https://api.example.com');
        expect(url).toBeInstanceOf(URL);
      });

      it('defaults to port 80 for HTTP when not specified', () => {
        const url = validateEndpointURL('http://api.example.com', true);
        expect(url).toBeInstanceOf(URL);
      });
    });

    describe('Invalid URL format', () => {
      it('rejects invalid URL format', () => {
        expect(() => {
          validateEndpointURL('not a url');
        }).toThrow(URLValidationError);

        try {
          validateEndpointURL('not a url');
        } catch (e) {
          if (e instanceof URLValidationError) {
            expect(e.message).toContain('Invalid URL format');
            expect(e.url).toBe('not a url');
          }
        }
      });

      it('rejects malformed URLs with missing protocol', () => {
        expect(() => validateEndpointURL('api.example.com')).toThrow(URLValidationError);
      });

      it('rejects empty string', () => {
        expect(() => validateEndpointURL('')).toThrow(URLValidationError);
      });

      it('rejects null-like values', () => {
        expect(() => validateEndpointURL('null')).toThrow(URLValidationError);
        expect(() => validateEndpointURL('undefined')).toThrow(URLValidationError);
      });
    });

    describe('Error object properties', () => {
      it('returns URLValidationError with correct message and url', () => {
        try {
          validateEndpointURL('https://localhost');
        } catch (e) {
          expect(e).toBeInstanceOf(URLValidationError);
          if (e instanceof URLValidationError) {
            expect(e.name).toBe('URLValidationError');
            expect(e.url).toBe('https://localhost');
            expect(e.message).toBeDefined();
            expect(e.message.length).toBeGreaterThan(0);
          }
        }
      });
    });

    describe('Return value on success', () => {
      it('returns a valid URL object on success', () => {
        const url = validateEndpointURL('https://api.topdog.studio/v1');
        expect(url).toBeInstanceOf(URL);
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe('api.topdog.studio');
        expect(url.pathname).toBe('/v1');
      });

      it('returns URL with correct properties', () => {
        const url = validateEndpointURL('https://api.example.com:8443/path?query=value');
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe('api.example.com');
        expect(url.port).toBe('8443');
        expect(url.pathname).toBe('/path');
        expect(url.search).toBe('?query=value');
      });

      it('returns URL with origin property', () => {
        const url = validateEndpointURL('https://api.example.com/v1');
        expect(url.origin).toBe('https://api.example.com');
      });
    });
  });

  describe('buildSafeFetchURL', () => {
    describe('Successful URL building', () => {
      it('builds correct URL from endpoint + path', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users', false);
        expect(result).toBe('https://api.example.com/users');
      });

      it('builds URL with endpoint containing pathname', () => {
        const result = buildSafeFetchURL('https://api.example.com/v1', '/users', false);
        expect(result).toBe('https://api.example.com/v1/users');
      });

      it('handles endpoint with trailing slash', () => {
        const result = buildSafeFetchURL('https://api.example.com/', '/users', false);
        expect(result).toBe('https://api.example.com/users');
      });

      it('handles endpoint with trailing slash and pathname', () => {
        const result = buildSafeFetchURL('https://api.example.com/v1/', '/users', false);
        expect(result).toBe('https://api.example.com/v1/users');
      });
    });

    describe('Path handling', () => {
      it('handles paths with leading slash', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users', false);
        expect(result).toBe('https://api.example.com/users');
      });

      it('handles paths without leading slash', () => {
        const result = buildSafeFetchURL('https://api.example.com', 'users', false);
        expect(result).toBe('https://api.example.com/users');
      });

      it('handles complex paths', () => {
        const result = buildSafeFetchURL('https://api.example.com/v1', '/users/123/profile', false);
        expect(result).toBe('https://api.example.com/v1/users/123/profile');
      });

      it('preserves query strings in path', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users?limit=10', false);
        expect(result).toBe('https://api.example.com/users?limit=10');
      });

      it('handles empty path (prepends / to empty string)', () => {
        const result = buildSafeFetchURL('https://api.example.com', '', false);
        // Empty path gets '/' prepended by the safePath logic
        expect(result).toBe('https://api.example.com/');
      });

      it('handles path with only slash', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/', false);
        expect(result).toBe('https://api.example.com/');
      });
    });

    describe('Endpoint validation before building', () => {
      it('validates endpoint before building URL', () => {
        expect(() => {
          buildSafeFetchURL('https://localhost', '/users', false);
        }).toThrow(URLValidationError);
      });

      it('rejects private IP endpoints', () => {
        expect(() => {
          buildSafeFetchURL('https://192.168.1.1', '/users', false);
        }).toThrow(URLValidationError);
      });

      it('rejects blocked ports in endpoint', () => {
        expect(() => {
          buildSafeFetchURL('https://api.example.com:6379', '/users', false);
        }).toThrow(URLValidationError);
      });

      it('rejects HTTP endpoint when allowHTTPInDev is false', () => {
        expect(() => {
          buildSafeFetchURL('http://api.example.com', '/users', false);
        }).toThrow(URLValidationError);
      });

      it('allows HTTP endpoint when allowHTTPInDev is true', () => {
        const result = buildSafeFetchURL('http://api.example.com', '/users', true);
        expect(result).toBe('http://api.example.com/users');
      });

      it('rejects invalid endpoint format', () => {
        expect(() => {
          buildSafeFetchURL('invalid-url', '/users', false);
        }).toThrow(URLValidationError);
      });
    });

    describe('allowHTTPInDev parameter passing', () => {
      it('passes allowHTTPInDev to validateEndpointURL', () => {
        expect(() => {
          buildSafeFetchURL('http://api.example.com', '/users');
        }).toThrow(URLValidationError);

        expect(() => {
          buildSafeFetchURL('http://api.example.com', '/users', false);
        }).toThrow(URLValidationError);

        const result = buildSafeFetchURL('http://api.example.com', '/users', true);
        expect(result).toBe('http://api.example.com/users');
      });
    });

    describe('Double slash prevention', () => {
      it('does not create double slashes between endpoint and path', () => {
        const result = buildSafeFetchURL('https://api.example.com/', '/users', false);
        expect(result).not.toContain('//users');
      });

      it('correctly joins endpoint pathname with path', () => {
        const result = buildSafeFetchURL('https://api.example.com/v1', '/users', false);
        expect(result).toBe('https://api.example.com/v1/users');
        // 'https://api.example.com/v1/users'.split('/') → ['https:', '', 'api.example.com', 'v1', 'users']
        // Only 1 empty string (from the // in https://)
        expect(result.split('/').filter(p => p === '').length).toBe(1);
      });
    });

    describe('Complex real-world scenarios', () => {
      it('builds URL for API v1 endpoint with nested path', () => {
        const result = buildSafeFetchURL('https://api.topdog.studio/v1', '/users/me/settings', false);
        expect(result).toBe('https://api.topdog.studio/v1/users/me/settings');
      });

      it('builds URL with query parameters and fragments', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/search?q=test#results', false);
        expect(result).toBe('https://api.example.com/search?q=test#results');
      });

      it('handles deeply nested API paths', () => {
        const result = buildSafeFetchURL('https://api.example.com/api/v2', '/graphql', false);
        expect(result).toBe('https://api.example.com/api/v2/graphql');
      });

      it('preserves endpoint port in final URL', () => {
        const result = buildSafeFetchURL('https://api.example.com:8443', '/api', false);
        expect(result).toBe('https://api.example.com:8443/api');
      });

      it('normalizes default HTTPS port 443 in output', () => {
        const result = buildSafeFetchURL('https://api.example.com:443/v1', '/data', false);
        // URL constructor normalizes :443 away for HTTPS, so origin omits port
        expect(result).toBe('https://api.example.com/v1/data');
      });
    });

    describe('Return type and format', () => {
      it('returns a string', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users', false);
        expect(typeof result).toBe('string');
      });

      it('returns a valid URL string', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users', false);
        expect(() => new URL(result)).not.toThrow();
      });

      it('returned string is absolute URL', () => {
        const result = buildSafeFetchURL('https://api.example.com', '/users', false);
        expect(result.startsWith('https://')).toBe(true);
      });
    });
  });
});
