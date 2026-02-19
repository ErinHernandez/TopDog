// Stub for @upstash/redis
export class Redis {
  get = async () => null;
  set = async () => 'OK';
  del = async () => 1;
  incr = async () => 1;
  expire = async () => 1;
  ttl = async () => -1;
  static fromEnv = () => new Redis();
}
export default { Redis };
