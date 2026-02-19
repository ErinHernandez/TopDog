// Stub for stripe
class Stripe {
  customers = { create: async () => ({}), retrieve: async () => ({}), list: async () => ({ data: [] }) };
  subscriptions = { create: async () => ({}), retrieve: async () => ({}), list: async () => ({ data: [] }), update: async () => ({}) };
  paymentIntents = { create: async () => ({}), retrieve: async () => ({}) };
  checkout = { sessions: { create: async () => ({ url: 'https://checkout.stripe.com/test' }) } };
  webhooks = { constructEvent: () => ({ type: 'test', data: { object: {} } }) };
  prices = { list: async () => ({ data: [] }), retrieve: async () => ({}) };
  products = { list: async () => ({ data: [] }), retrieve: async () => ({}) };
  constructor(_key?: string) {}
}
export default Stripe;
