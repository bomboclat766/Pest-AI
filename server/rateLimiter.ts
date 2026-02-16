type Key = string;

interface Entry {
  minuteTimestamps: number[]; // epoch ms
  dayCount: number;
  dayResetMs: number;
}

const store = new Map<Key, Entry>();

function startOfNextUTCDayMs(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime();
}

export function getLimits() {
  const perMinute = parseInt(process.env.FREE_TIER_PER_MINUTE || "1", 10);
  const perDay = parseInt(process.env.FREE_TIER_PER_DAY || "20", 10);
  return { perMinute, perDay };
}

export function checkAndConsume(key: Key): { ok: boolean; retryAfterSeconds?: number; reason?: string } {
  const now = Date.now();
  const limits = getLimits();

  let entry = store.get(key);
  if (!entry) {
    entry = { minuteTimestamps: [], dayCount: 0, dayResetMs: startOfNextUTCDayMs() };
    store.set(key, entry);
  }

  // reset daily if needed
  if (now >= entry.dayResetMs) {
    entry.dayCount = 0;
    entry.dayResetMs = startOfNextUTCDayMs();
    entry.minuteTimestamps = entry.minuteTimestamps.filter((t) => t >= now - 60_000);
  }

  // clean up minute timestamps older than 60s
  entry.minuteTimestamps = entry.minuteTimestamps.filter((t) => t >= now - 60_000);

  if (entry.dayCount >= limits.perDay) {
    const retry = Math.ceil((entry.dayResetMs - now) / 1000);
    return { ok: false, retryAfterSeconds: retry, reason: 'daily_quota_exceeded' };
  }

  if (entry.minuteTimestamps.length >= limits.perMinute) {
    const earliest = entry.minuteTimestamps[0];
    const retry = Math.ceil((earliest + 60_000 - now) / 1000);
    return { ok: false, retryAfterSeconds: retry, reason: 'per_minute_quota_exceeded' };
  }

  // consume
  entry.minuteTimestamps.push(now);
  entry.dayCount += 1;

  return { ok: true };
}

export function getStatus(key: Key) {
  const entry = store.get(key);
  const limits = getLimits();
  const now = Date.now();
  if (!entry) {
    return { perMinuteLimit: limits.perMinute, perDayLimit: limits.perDay, dayRemaining: limits.perDay, minuteRemaining: limits.perMinute };
  }
  const minuteUsed = entry.minuteTimestamps.filter((t) => t >= now - 60_000).length;
  const dayRemaining = Math.max(0, limits.perDay - entry.dayCount);
  const minuteRemaining = Math.max(0, limits.perMinute - minuteUsed);
  return { perMinuteLimit: limits.perMinute, perDayLimit: limits.perDay, dayRemaining, minuteRemaining, dayResetInSeconds: Math.ceil((entry.dayResetMs - now) / 1000) };
}
