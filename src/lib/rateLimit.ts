type RateLimitOptions = {
    windowMs: number;
    max: number;
};

type RateLimitResult = {
    ok: boolean;
    remaining: number;
    resetAt: number;
};

const store = new Map<string, { count: number; resetAt: number }>();

export function getRequestIp(request: Request) {
    const xf = request.headers.get('x-forwarded-for');
    if (xf) return xf.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        const resetAt = now + opts.windowMs;
        store.set(key, { count: 1, resetAt });
        return { ok: true, remaining: Math.max(0, opts.max - 1), resetAt };
    }

    if (entry.count >= opts.max) {
        return { ok: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    store.set(key, entry);
    return { ok: true, remaining: Math.max(0, opts.max - entry.count), resetAt: entry.resetAt };
}
