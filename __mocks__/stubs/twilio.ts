// Stub for twilio
class Twilio {
  messages = { create: async () => ({ sid: 'SM_test' }) };
  constructor(_sid?: string, _token?: string) {}
}
export default Twilio;
