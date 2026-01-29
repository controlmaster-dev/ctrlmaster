
interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

export class RateLimiter {
    private buckets: Map<string, TokenBucket>;
    private maxTokens: number;
    private refillRateInSeconds: number;

    /**
     * @param maxTokens Maximum number of tokens (burst size)
     * @param refillRateInSeconds Time in seconds to add one token
     */
    constructor(maxTokens: number = 3, refillRateInSeconds: number = 60) {
        this.buckets = new Map();
        this.maxTokens = maxTokens;
        this.refillRateInSeconds = refillRateInSeconds;
    }

    private refill(key: string) {
        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = { tokens: this.maxTokens, lastRefill: Date.now() };
            this.buckets.set(key, bucket);
            return bucket;
        }

        const now = Date.now();
        const elapsedSeconds = (now - bucket.lastRefill) / 1000;

        if (elapsedSeconds >= 1) { // Calculate refill if enough time passed
            // Actually, standard token bucket:
            // tokens += (now - lastRefill) * (rate / time_unit)
            // Here rate is 1 token per refillRateInSeconds.

            const refillAmount = (elapsedSeconds / this.refillRateInSeconds);

            if (refillAmount > 0) {
                bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refillAmount);
                bucket.lastRefill = now;
            }
        }

        return bucket;
    }

    /**
     * Attempts to consume a token for the given key.
     * @param key Unique identifier (e.g., userId or email)
     * @returns { success: boolean, retryAfter?: number }
     */
    public tryConsume(key: string): { success: boolean, retryAfter?: number } {
        const bucket = this.refill(key);

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return { success: true };
        } else {
            // Calculate time until next token
            // 1 token needed. Current tokens < 1.
            // deficit = 1 - bucket.tokens
            // time = deficit * refillRate

            const deficit = 1 - bucket.tokens;
            const retryAfterSeconds = Math.ceil(deficit * this.refillRateInSeconds);

            return { success: false, retryAfter: retryAfterSeconds };
        }
    }
}

// Singleton instance for global app usage
// Burst: 1 email. Refill: 1 email every 60 seconds.
// Strict anti-spam: User can only send 1 email every minute.
export const emailRateLimiter = new RateLimiter(1, 60);
