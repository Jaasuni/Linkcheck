/**
 * Gets domain age in days using RDAP
 */

// Simple in-memory cache with expiration
interface CacheEntry {
  ageDays: number | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getDomainAgeDays(baseDomain: string): Promise<number | null> {
  // Check env flag
  const USE_DOMAIN_AGE = (process.env.USE_DOMAIN_AGE ?? "true") !== "false";
  if (!USE_DOMAIN_AGE) {
    return null;
  }

  // Check cache
  const cached = cache.get(baseDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.ageDays;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`https://rdap.org/domain/${baseDomain}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      cache.set(baseDomain, { ageDays: null, timestamp: Date.now() });
      return null;
    }

    const data = await response.json();
    
    // Find earliest registration date
    let earliestDate: Date | null = null;
    
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        if (
          event.eventAction === "registration" ||
          event.eventAction === "last changed" ||
          event.eventAction === "expiration"
        ) {
          if (event.eventDate) {
            const eventDate = new Date(event.eventDate);
            if (!earliestDate || eventDate < earliestDate) {
              if (event.eventAction === "registration") {
                earliestDate = eventDate;
              }
            }
          }
        }
      }
    }

    if (!earliestDate) {
      cache.set(baseDomain, { ageDays: null, timestamp: Date.now() });
      return null;
    }

    const ageDays = Math.floor(
      (Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    cache.set(baseDomain, { ageDays, timestamp: Date.now() });
    return ageDays;
  } catch (error) {
    // Timeout or network error - cache null result
    cache.set(baseDomain, { ageDays: null, timestamp: Date.now() });
    return null;
  }
}



