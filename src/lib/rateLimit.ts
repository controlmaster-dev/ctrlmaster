
export class RateLimiter {
  buckets: Map<string, { tokens: number; lastRefill: number }>;
  maxTokens: number;
  refillRateInSeconds: number;
  constructor(maxTokens = 3, refillRateInSeconds = 60) {
    this.buckets = new Map();
    this.maxTokens = maxTokens;
    this.refillRateInSeconds = refillRateInSeconds;
  }

  refill(key) {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: Date.now() };
      this.buckets.set(key, bucket);
      return bucket;
    }

    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;

    if (elapsedSeconds >= 1) {

      const refillAmount = elapsedSeconds / this.refillRateInSeconds;

      if (refillAmount > 0) {
        bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refillAmount);
        bucket.lastRefill = now;
      }
    }

    return bucket;
  }
  tryConsume(key) {
    const bucket = this.refill(key);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { success: true };
    } else {
      const deficit = 1 - bucket.tokens;
      const retryAfterSeconds = Math.ceil(deficit * this.refillRateInSeconds);

      return { success: false, retryAfter: retryAfterSeconds };
    }
  }
}

export const emailRateLimiter = new RateLimiter(1, 60);