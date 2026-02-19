// Stub for @upstash/ratelimit
export class Ratelimit {
  static slidingWindow = () => new Ratelimit();
  static fixedWindow = () => new Ratelimit();
  static tokenBucket = () => new Ratelimit();
  limit = async () => ({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000, pending: Promise.resolve() });
}
export default { Ratelimit };
