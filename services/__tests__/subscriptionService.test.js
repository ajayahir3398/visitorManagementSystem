import { calculateSubscriptionStatus } from '../subscriptionService.js';

describe('Subscription Service', () => {
  describe('calculateSubscriptionStatus', () => {
    it('returns LOCKED if no subscription or expiry date', () => {
      expect(calculateSubscriptionStatus(null)).toBe('LOCKED');
      expect(calculateSubscriptionStatus({})).toBe('LOCKED');
    });

    it('returns SUSPENDED if status is SUSPENDED', () => {
      const sub = { status: 'SUSPENDED', expiryDate: new Date() };
      expect(calculateSubscriptionStatus(sub)).toBe('SUSPENDED');
    });

    it('returns current status if expiry date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const sub = { status: 'ACTIVE', expiryDate: futureDate };
      expect(calculateSubscriptionStatus(sub)).toBe('ACTIVE');
    });

    it('returns GRACE if expired but within grace period', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2); // 2 days ago
      const sub = { status: 'ACTIVE', expiryDate: pastDate, graceDays: 3 };
      expect(calculateSubscriptionStatus(sub)).toBe('GRACE');
    });

    it('returns LOCKED if expired beyond grace period', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago
      const sub = { status: 'GRACE', expiryDate: pastDate, graceDays: 3 };
      expect(calculateSubscriptionStatus(sub)).toBe('LOCKED');
    });
  });
});
