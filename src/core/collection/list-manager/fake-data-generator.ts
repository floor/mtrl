/**
 * Lightweight Fake Data Generator
 * Generates realistic placeholder items for seamless infinite scrolling
 * Uses minimal bundle size with maximum performance
 */

import { FAKE_DATA } from "./constants";

interface FakeDataPattern {
  namePattern?: string[];
  emailDomain?: string;
  rolePattern?: string[];
  idSequence?: number;
}

interface FakeDataCache {
  items: Map<number, any>;
  pattern: FakeDataPattern;
  lastAnalyzed: number;
}

/**
 * Minimal fake data generator with pattern analysis
 */
export class FakeDataGenerator {
  private cache: FakeDataCache = {
    items: new Map(),
    pattern: {},
    lastAnalyzed: 0,
  };

  /**
   * Analyze patterns from real data (lightweight analysis)
   */
  analyzePatterns(realItems: any[]): void {
    if (!FAKE_DATA.ENABLED || !FAKE_DATA.ENABLE_PATTERN_DETECTION) return;
    if (realItems.length === 0) return;

    const sampleSize = Math.min(
      FAKE_DATA.PATTERN_ANALYSIS_SAMPLE_SIZE,
      realItems.length
    );
    const sample = realItems.slice(0, sampleSize);

    // Extract simple patterns
    const names = sample
      .map((item) => item.headline || item.name)
      .filter(Boolean);
    const emails = sample
      .map((item) => item.supportingText || item.email)
      .filter(Boolean);
    const roles = sample.map((item) => item.meta || item.role).filter(Boolean);

    // Simple pattern detection
    this.cache.pattern = {
      namePattern: names.length > 0 ? names : [...FAKE_DATA.FALLBACK_NAMES],
      emailDomain:
        this.extractEmailDomain(emails[0]) || FAKE_DATA.FALLBACK_DOMAINS[0],
      rolePattern: roles.length > 0 ? roles : ["Team Member"],
      idSequence: this.extractIdSequence(sample),
    };

    this.cache.lastAnalyzed = Date.now();
  }

  /**
   * Generate a fake item at specific index (minimal logic)
   */
  generateFakeItem(index: number, realItems: any[] = []): any {
    if (!FAKE_DATA.ENABLED) return null;

    // Check cache first
    if (this.cache.items.has(index)) {
      return this.cache.items.get(index);
    }

    // Analyze patterns if needed
    if (realItems.length > 0 && !this.cache.pattern.namePattern) {
      this.analyzePatterns(realItems);
    }

    // Generate fake item using patterns
    const fakeItem = this.createFakeItem(index);

    // Cache it (with size limit)
    if (this.cache.items.size < FAKE_DATA.CACHE_SIZE) {
      this.cache.items.set(index, fakeItem);
    }

    return fakeItem;
  }

  /**
   * Create fake item using detected patterns (fast generation)
   */
  private createFakeItem(index: number): any {
    const pattern = this.cache.pattern;
    const fakeId = `${FAKE_DATA.ID_PREFIX}${index}`;

    // Use patterns or fallbacks
    const names = pattern.namePattern || FAKE_DATA.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];
    const domain = pattern.emailDomain || FAKE_DATA.FALLBACK_DOMAINS[0];

    // Simple cycling through patterns
    const nameIndex = index % names.length;
    const roleIndex = index % roles.length;

    const firstName = names[nameIndex] || `User`;
    const lastName = `${index}`;
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName}@${domain}`;

    return {
      id: fakeId,
      headline: fullName,
      supportingText: email,
      meta: roles[roleIndex],
      avatar: firstName.charAt(0).toUpperCase(),
      [FAKE_DATA.FAKE_FLAG]: true, // Mark as fake
    };
  }

  /**
   * Extract email domain from sample (simple regex)
   */
  private extractEmailDomain(email: string): string | null {
    if (!email) return null;
    const match = email.match(/@(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * Extract ID sequence pattern (simple analysis)
   */
  private extractIdSequence(items: any[]): number {
    if (items.length < 2) return 1;

    const ids = items
      .map((item) => parseInt(item.id))
      .filter((id) => !isNaN(id));
    if (ids.length < 2) return 1;

    // Simple sequence detection
    return ids[1] - ids[0] || 1;
  }

  /**
   * Check if an item is fake
   */
  isFakeItem(item: any): boolean {
    return item && item[FAKE_DATA.FAKE_FLAG] === true;
  }

  /**
   * Clear cache for memory management
   */
  clearCache(): void {
    this.cache.items.clear();
    this.cache.pattern = {};
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      cachedItems: this.cache.items.size,
      hasPattern: !!this.cache.pattern.namePattern,
      lastAnalyzed: this.cache.lastAnalyzed,
    };
  }
}

// Singleton instance for performance
export const fakeDataGenerator = new FakeDataGenerator();
