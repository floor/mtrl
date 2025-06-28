/**
 * MTRL List Manager - Data Generation & Placeholder System
 *
 * Provides immediate placeholder generation and data creation capabilities
 * for the list manager.
 *
 * KEY CONCEPTS:
 * 1. PLACEHOLDER MODE: Controls how placeholders appear (opacity, skeleton, content)
 *    Usage: import { setPlaceholderMode } from './data-generator';
 *           setPlaceholderMode('opacity'); // 'skeleton', 'content', or false
 *
 * 2. PLACEHOLDER OPACITY: When using opacity mode, controls the transparency level
 *    Usage: import { setPlaceholderOpacity } from './data-generator';
 *           setPlaceholderOpacity(0.3); // 0.0 (invisible) to 1.0 (fully visible)
 *
 * 3. AUTOMATIC DETECTION: Placeholders are automatically detected and styled
 *    - Items with id: 'placeholder-{index}' are treated as placeholders
 *    - Automatic opacity styling is applied during rendering
 *    - No manual class management needed in most cases
 *
 * 4. MANUAL STYLING CONTROL (advanced):
 *    For cases where you need manual control over placeholder classes:
 *    - Use addPlaceholderClass(element) to mark an element as placeholder
 *    - Use removePlaceholderClass(element) to remove placeholder styling
 *    - Element will automatically get opacity styling based on current mode
 *
 * EXAMPLE USAGE:
 *
 * Basic setup:
 * ```js
 * import { setPlaceholderMode, setPlaceholderOpacity } from './data-generator';
 *
 * // Configure placeholder appearance
 * setPlaceholderMode('opacity');
 * setPlaceholderOpacity(0.3);
 *
 * // Placeholders are now automatically styled when rendered
 * ```
 *
 * Manual styling (advanced):
 * ```js
 * import { addPlaceholderClass, removePlaceholderClass } from './data-generator';
 *
 * // Manually mark element as placeholder
 * addPlaceholderClass(element);
 *
 * // Remove placeholder styling when real data loads
 * removePlaceholderClass(element);
 * ```
 *
 * The system handles all styling automatically - just generate placeholders
 * with id: 'placeholder-{index}' and they'll be styled correctly.
 */

import { PLACEHOLDER } from "../constants";
import {
  addClass as baseAddClass,
  removeClass as baseRemoveClass,
} from "../../../dom/classes";

interface PlaceholderDataPattern {
  namePattern?: string[];
  emailDomain?: string;
  rolePattern?: string[];
  idSequence?: number;
}

interface PlaceholderDataCache {
  items: Map<number, any>;
  pattern: PlaceholderDataPattern;
  lastAnalyzed: number;
}

/**
 * Minimal placeholder data generator with pattern analysis
 */
export class PlaceholderDataGenerator {
  private cache: PlaceholderDataCache = {
    items: new Map(),
    pattern: {},
    lastAnalyzed: 0,
  };

  /**
   * Analyze real items to detect patterns for generating believable placeholder items
   * @param realItems Array of real items to analyze
   */
  analyzePatterns(realItems: any[]): void {
    if (!realItems?.length) return;

    // Use first 10 items for pattern analysis
    const sampleItems = realItems.slice(0, 10);

    // Extract patterns from real data
    const namePattern = sampleItems
      .map((item) => item.headline || item.name || item.title)
      .filter(Boolean)
      .map((name) => String(name).split(" ")[0]) // Extract first names
      .filter((name) => name.length > 1);

    const rolePattern = sampleItems
      .map((item) => item.meta || item.role || item.subtitle)
      .filter(Boolean);

    const emailDomain = sampleItems
      .map((item) => item.supportingText || item.email)
      .filter(Boolean)
      .map((email) => this.extractEmailDomain(String(email)))
      .filter(Boolean)[0];

    // Update cache with detected patterns
    this.cache.pattern = {
      namePattern: namePattern.length > 0 ? namePattern : undefined,
      rolePattern: rolePattern.length > 0 ? rolePattern : undefined,
      emailDomain: emailDomain || undefined,
      idSequence: this.extractIdSequence(sampleItems),
    };

    this.cache.lastAnalyzed = Date.now();
  }

  /**
   * Generate a placeholder item for the given virtual index
   */
  generatePlaceholderItem(index: number, realItems: any[] = []): any {
    // Check cache first
    if (this.cache.items.has(index)) {
      return this.cache.items.get(index);
    }

    // Analyze patterns if we have real items and haven't analyzed recently
    if (realItems.length > 0) {
      this.analyzePatterns(realItems);
    }

    // Generate new placeholder item
    const placeholderItem = this.createPlaceholderItem(index);

    // Cache with size limit (50 items max)
    if (this.cache.items.size >= 50) {
      // Remove oldest entry
      const firstKey = this.cache.items.keys().next().value;
      this.cache.items.delete(firstKey);
    }
    this.cache.items.set(index, placeholderItem);

    return placeholderItem;
  }

  /**
   * Create placeholder item using detected patterns (fast generation)
   */
  private createPlaceholderItem(index: number): any {
    // Use global virtual ID to ensure proper sequence
    const virtualItemId = index + 1;

    // Get sample patterns
    const pattern = this.cache.pattern;

    // Generate placeholder content based on mode
    const placeholderContent = this.generatePlaceholderContent(pattern, index);

    return {
      id: virtualItemId.toString(), // Use real virtual ID, not fake_ prefix
      headline: placeholderContent.headline,
      supportingText: placeholderContent.supportingText,
      meta: placeholderContent.meta,
      avatar: placeholderContent.avatar,
      [PLACEHOLDER.PLACEHOLDER_FLAG]: true, // Mark as placeholder
      _placeholderIndex: index, // Keep original index for debugging
      _placeholderMode: PLACEHOLDER.PLACEHOLDER_MODE, // Track placeholder mode for CSS class
    };
  }

  /**
   * Generate placeholder content based on configured mode
   */
  private generatePlaceholderContent(pattern: any, index: number) {
    const mode = PLACEHOLDER.PLACEHOLDER_MODE;

    switch (mode) {
      case "masked":
        return this.generateMaskedContent(pattern, index);
      case "skeleton":
        return this.generateSkeletonContent(pattern, index);
      case "blank":
        return this.generateBlankContent(pattern, index);
      case "dots":
        return this.generateDotContent(pattern, index);
      case "realistic":
      default:
        return this.generateRealisticContent(pattern, index);
    }
  }

  /**
   * Generate masked placeholder content - realistic structure with masked characters
   */
  private generateMaskedContent(pattern: any, index: number) {
    // First generate realistic content
    const realisticContent = this.generateRealisticContent(pattern, index);

    // Then mask all alphanumeric characters
    const maskChar = PLACEHOLDER.MASK_CHARACTER;

    return {
      headline: this.maskText(realisticContent.headline, maskChar),
      supportingText: this.maskText(realisticContent.supportingText, maskChar),
      meta: this.maskText(realisticContent.meta, maskChar),
      avatar: maskChar, // Single masked character for avatar
    };
  }

  /**
   * Mask all alphanumeric characters in text while preserving structure
   */
  private maskText(text: string, maskChar: string): string {
    return text.replace(/[A-Za-z0-9@._-]/g, maskChar);
  }

  /**
   * Generate skeleton placeholder content
   */
  private generateSkeletonContent(pattern: any, index: number) {
    const virtualItemId = index + 1;

    // Use pattern lengths to determine skeleton size
    const names = pattern.namePattern || PLACEHOLDER.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    // Choose skeleton size based on content length
    const headlineSkeleton =
      nameLength > 10
        ? PLACEHOLDER.SKELETON_CHARS.LONG
        : nameLength > 6
        ? PLACEHOLDER.SKELETON_CHARS.MEDIUM
        : PLACEHOLDER.SKELETON_CHARS.SHORT;

    const metaSkeleton =
      roleLength > 8
        ? PLACEHOLDER.SKELETON_CHARS.MEDIUM
        : PLACEHOLDER.SKELETON_CHARS.SHORT;

    return {
      headline: headlineSkeleton,
      supportingText: PLACEHOLDER.SKELETON_CHARS.EMAIL,
      meta: metaSkeleton,
      avatar: "▁", // Skeleton avatar
    };
  }

  /**
   * Generate blank placeholder content
   */
  private generateBlankContent(pattern: any, index: number) {
    const names = pattern.namePattern || PLACEHOLDER.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    const headlineBlank =
      nameLength > 10
        ? PLACEHOLDER.BLANK_CHARS.LONG
        : nameLength > 6
        ? PLACEHOLDER.BLANK_CHARS.MEDIUM
        : PLACEHOLDER.BLANK_CHARS.SHORT;

    const metaBlank =
      roleLength > 8
        ? PLACEHOLDER.BLANK_CHARS.MEDIUM
        : PLACEHOLDER.BLANK_CHARS.SHORT;

    return {
      headline: headlineBlank,
      supportingText: PLACEHOLDER.BLANK_CHARS.EMAIL,
      meta: metaBlank,
      avatar: " ", // Blank avatar
    };
  }

  /**
   * Generate dot placeholder content
   */
  private generateDotContent(pattern: any, index: number) {
    const names = pattern.namePattern || PLACEHOLDER.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    const headlineDots =
      nameLength > 10
        ? PLACEHOLDER.DOT_CHARS.LONG
        : nameLength > 6
        ? PLACEHOLDER.DOT_CHARS.MEDIUM
        : PLACEHOLDER.DOT_CHARS.SHORT;

    const metaDots =
      roleLength > 8
        ? PLACEHOLDER.DOT_CHARS.MEDIUM
        : PLACEHOLDER.DOT_CHARS.SHORT;

    return {
      headline: headlineDots,
      supportingText: PLACEHOLDER.DOT_CHARS.EMAIL,
      meta: metaDots,
      avatar: "•", // Dot avatar
    };
  }

  /**
   * Generate realistic fake content (original behavior)
   */
  private generateRealisticContent(pattern: any, index: number) {
    const virtualItemId = index + 1;

    // Use patterns or fallbacks
    const names = pattern.namePattern || PLACEHOLDER.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];
    const domain = pattern.emailDomain || PLACEHOLDER.FALLBACK_DOMAINS[0];

    // Simple cycling through patterns
    const nameIndex = index % names.length;
    const roleIndex = index % roles.length;

    const firstName = names[nameIndex] || `User`;
    const lastName = `${virtualItemId}`; // Use virtual ID for name consistency
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName}@${domain}`;

    return {
      headline: fullName,
      supportingText: email,
      meta: roles[roleIndex],
      avatar: firstName.charAt(0).toUpperCase(),
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
   * Check if an item is a placeholder
   */
  isPlaceholderItem(item: any): boolean {
    return item && item[PLACEHOLDER.PLACEHOLDER_FLAG] === true;
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
      placeholderMode: PLACEHOLDER.PLACEHOLDER_MODE,
    };
  }

  /**
   * Set placeholder mode dynamically
   */
  setPlaceholderMode(
    mode: "masked" | "skeleton" | "blank" | "dots" | "realistic"
  ) {
    (PLACEHOLDER as any).PLACEHOLDER_MODE = mode;
    this.clearCache();
  }
}

// Singleton instance for performance
export const placeholderDataGenerator = new PlaceholderDataGenerator();

// Utility functions for mode switching
export const setPlaceholderMode = (
  mode: "masked" | "skeleton" | "blank" | "dots" | "realistic"
) => {
  placeholderDataGenerator.setPlaceholderMode(mode);
};

export const getPlaceholderMode = () => PLACEHOLDER.PLACEHOLDER_MODE;

export const addPlaceholderClass = (element: HTMLElement, item: any) => {
  if (!element) return;

  if (item._isPlaceholder || item[PLACEHOLDER.PLACEHOLDER_FLAG]) {
    baseAddClass(element, "item-placeholder");

    const mode = item._placeholderMode || PLACEHOLDER.PLACEHOLDER_MODE;
    if (mode && mode !== "realistic") {
      baseAddClass(element, `item-placeholder--${mode}`);
    }

    const currentClasses = Array.from(element.classList);
    const classesToKeep = [
      "mtrl-list-item",
      "mtrl-item-placeholder",
      `mtrl-item-placeholder--${mode}`,
    ];

    currentClasses.forEach((className) => {
      if (!classesToKeep.includes(className)) {
        element.classList.remove(className);
      }
    });

    element.setAttribute("aria-busy", "true");
    element.setAttribute("aria-label", "Loading content...");

    // 🔧 CRITICAL FIX: Always set height to prevent shift
    // This ensures placeholders maintain the same height as real items
    const configuredHeight = element.dataset.configuredItemHeight;
    const itemHeight = configuredHeight || "84"; // Fallback to standard item height

    if (itemHeight) {
      element.style.height = `${itemHeight}px`;
      element.style.minHeight = `${itemHeight}px`;
      // Use !important to ensure CSS doesn't override
      element.style.setProperty("height", `${itemHeight}px`, "important");
      element.style.setProperty("min-height", `${itemHeight}px`, "important");

      // Ensure the dataset is set for consistency
      element.dataset.configuredItemHeight = itemHeight;
    }
  }
};

export const removePlaceholderClass = (
  element: HTMLElement,
  className = "item-placeholder"
) => {
  if (!element) return;

  baseRemoveClass(element, className);

  const modes = ["skeleton", "masked", "blank", "dots", "realistic"];
  modes.forEach((mode) => {
    baseRemoveClass(element, `${className}--${mode}`);
  });

  element.removeAttribute("aria-busy");
  element.removeAttribute("aria-label");

  // 🔧 CRITICAL FIX: Always preserve height to prevent shift
  // This ensures no height shift when transitioning from placeholder to real item
  const configuredHeight = element.dataset.configuredItemHeight;
  const itemHeight = configuredHeight || "84"; // Fallback to standard item height

  if (itemHeight) {
    element.style.height = `${itemHeight}px`;
    element.style.minHeight = `${itemHeight}px`;
    element.style.setProperty("height", `${itemHeight}px`, "important");
    element.style.setProperty("min-height", `${itemHeight}px`, "important");

    // Also ensure the dataset is set for consistency
    element.dataset.configuredItemHeight = itemHeight;
  }
};

/**
 * Automatic render hook for applying placeholder styling
 */
export const placeholderRenderHook = (item: any, element: HTMLElement) => {
  if (!item || !element) return;

  const isFake = item._isPlaceholder || item[PLACEHOLDER.PLACEHOLDER_FLAG];

  if (isFake) {
    addPlaceholderClass(element, item);
  } else {
    if (element.classList.contains("mtrl-item-placeholder")) {
      removePlaceholderClass(element);
    }
  }
};

/**
 * Install the placeholder render hook into a list manager renderer
 */
export const installPlaceholderHook = (
  setRenderHookFn: (hook: (item: any, element: HTMLElement) => void) => void
) => {
  if (!setRenderHookFn || typeof setRenderHookFn !== "function") {
    return;
  }

  setRenderHookFn(placeholderRenderHook);
};
