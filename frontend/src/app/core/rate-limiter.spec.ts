import { ClientSideRateLimiter } from './rate-limiter';

describe('ClientSideRateLimiter', () => {
  let limiter: ClientSideRateLimiter;

  beforeEach(() => {
    localStorage.clear();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-09-28T10:00:00Z'));
    limiter = new ClientSideRateLimiter();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.clear();
  });

  it('blocks after 5 failures and reports the wait', () => {
    for (let i = 0; i < 4; i++) limiter.recordFailure('login');
    expect(limiter.isBlocked('login')).toBeFalse();
    limiter.recordFailure('login');
    expect(limiter.isBlocked('login')).toBeTrue();
    expect(limiter.getTimeRemaining('login')).toBe(15 * 60);
    expect(limiter.getThrottleMessage('login')).toContain('15 minutes');
  });

  it('unblocks when the block expires', () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure('login');
    jasmine.clock().tick(15 * 60 * 1000 + 1000);
    expect(limiter.isBlocked('login')).toBeFalse();
    expect(limiter.getFailureCount('login')).toBe(0);
  });

  it('forgets failures spread over a long time', () => {
    for (let i = 0; i < 4; i++) limiter.recordFailure('login');
    jasmine.clock().tick(16 * 60 * 1000);
    limiter.recordFailure('login');
    expect(limiter.isBlocked('login')).toBeFalse();
    expect(limiter.getFailureCount('login')).toBe(1);
  });

  it('clears failures after a successful login', () => {
    limiter.recordFailure('login');
    limiter.recordSuccess('login');
    expect(limiter.getFailureCount('login')).toBe(0);
  });

  it('tracks endpoints separately', () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure('login');
    expect(limiter.isBlocked('otp')).toBeFalse();
  });
});
