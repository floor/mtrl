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

    // CRITICAL: Use the virtual index as the actual item ID for coordinate consistency
    // This ensures fake items align perfectly with real item positioning
    const virtualItemId = index + 1; // Convert 0-based index to 1-based ID

    // Generate placeholder content based on mode
    const placeholderContent = this.generatePlaceholderContent(pattern, index);

    return {
      id: virtualItemId.toString(), // Use real virtual ID, not fake_ prefix
      headline: placeholderContent.headline,
      supportingText: placeholderContent.supportingText,
      meta: placeholderContent.meta,
      avatar: placeholderContent.avatar,
      [FAKE_DATA.FAKE_FLAG]: true, // Mark as fake
      _fakeIndex: index, // Keep original index for debugging
      _placeholderMode: FAKE_DATA.PLACEHOLDER_MODE, // Track placeholder mode
      _placeholderOpacity: FAKE_DATA.PLACEHOLDER_OPACITY, // Opacity value for CSS variable or fallback
      _placeholderClass: "item-placeholder", // CSS class (prefix added automatically by addClass)
    };
  }

  /**
   * Generate placeholder content based on configured mode
   */
  private generatePlaceholderContent(pattern: any, index: number) {
    const mode = FAKE_DATA.PLACEHOLDER_MODE;

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
    const maskChar = FAKE_DATA.MASK_CHARACTER;

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
    const names = pattern.namePattern || FAKE_DATA.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    // Choose skeleton size based on content length
    const headlineSkeleton =
      nameLength > 10
        ? FAKE_DATA.SKELETON_CHARS.LONG
        : nameLength > 6
        ? FAKE_DATA.SKELETON_CHARS.MEDIUM
        : FAKE_DATA.SKELETON_CHARS.SHORT;

    const metaSkeleton =
      roleLength > 8
        ? FAKE_DATA.SKELETON_CHARS.MEDIUM
        : FAKE_DATA.SKELETON_CHARS.SHORT;

    return {
      headline: headlineSkeleton,
      supportingText: FAKE_DATA.SKELETON_CHARS.EMAIL,
      meta: metaSkeleton,
      avatar: "▁", // Skeleton avatar
    };
  }

  /**
   * Generate blank placeholder content
   */
  private generateBlankContent(pattern: any, index: number) {
    const names = pattern.namePattern || FAKE_DATA.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    const headlineBlank =
      nameLength > 10
        ? FAKE_DATA.BLANK_CHARS.LONG
        : nameLength > 6
        ? FAKE_DATA.BLANK_CHARS.MEDIUM
        : FAKE_DATA.BLANK_CHARS.SHORT;

    const metaBlank =
      roleLength > 8
        ? FAKE_DATA.BLANK_CHARS.MEDIUM
        : FAKE_DATA.BLANK_CHARS.SHORT;

    return {
      headline: headlineBlank,
      supportingText: FAKE_DATA.BLANK_CHARS.EMAIL,
      meta: metaBlank,
      avatar: " ", // Blank avatar
    };
  }

  /**
   * Generate dot placeholder content
   */
  private generateDotContent(pattern: any, index: number) {
    const names = pattern.namePattern || FAKE_DATA.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];

    const nameLength = names[index % names.length]?.length || 8;
    const roleLength = roles[index % roles.length]?.length || 6;

    const headlineDots =
      nameLength > 10
        ? FAKE_DATA.DOT_CHARS.LONG
        : nameLength > 6
        ? FAKE_DATA.DOT_CHARS.MEDIUM
        : FAKE_DATA.DOT_CHARS.SHORT;

    const metaDots =
      roleLength > 8 ? FAKE_DATA.DOT_CHARS.MEDIUM : FAKE_DATA.DOT_CHARS.SHORT;

    return {
      headline: headlineDots,
      supportingText: FAKE_DATA.DOT_CHARS.EMAIL,
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
    const names = pattern.namePattern || FAKE_DATA.FALLBACK_NAMES;
    const roles = pattern.rolePattern || ["Team Member"];
    const domain = pattern.emailDomain || FAKE_DATA.FALLBACK_DOMAINS[0];

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
      placeholderMode: FAKE_DATA.PLACEHOLDER_MODE,
    };
  }

  /**
   * Set placeholder mode dynamically
   */
  setPlaceholderMode(
    mode: "masked" | "skeleton" | "blank" | "dots" | "realistic"
  ) {
    // Note: This modifies the constant, but it's useful for runtime switching
    (FAKE_DATA as any).PLACEHOLDER_MODE = mode;
    this.clearCache(); // Clear cache to regenerate with new mode
  }

  /**
   * Set placeholder opacity dynamically
   */
  setPlaceholderOpacity(opacity: number) {
    // Clamp opacity between 0 and 1
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    (FAKE_DATA as any).PLACEHOLDER_OPACITY = clampedOpacity;
    this.clearCache(); // Clear cache to regenerate with new opacity
  }
}

// Singleton instance for performance
export const fakeDataGenerator = new FakeDataGenerator();

// Utility functions for easy mode switching (useful for testing/debugging)
export const setPlaceholderMode = (
  mode: "masked" | "skeleton" | "blank" | "dots" | "realistic"
) => {
  fakeDataGenerator.setPlaceholderMode(mode);
  console.log(`🎭 Placeholder mode changed to: ${mode}`);
};

export const getPlaceholderMode = () => FAKE_DATA.PLACEHOLDER_MODE;

// Utility functions for opacity management
export const setPlaceholderOpacity = (opacity: number) => {
  fakeDataGenerator.setPlaceholderOpacity(opacity);
  console.log(`👻 Placeholder opacity changed to: ${opacity}`);
};

export const getPlaceholderOpacity = () => FAKE_DATA.PLACEHOLDER_OPACITY;

// Debug utilities for placeholder styling
export const enablePlaceholderLogging = () => {
  (window as any).MTRL_PLACEHOLDER_DEBUG = true;
  console.log(
    "🔍 Placeholder logging enabled - you'll see class add/remove operations"
  );
};

export const disablePlaceholderLogging = () => {
  (window as any).MTRL_PLACEHOLDER_DEBUG = false;
  console.log("🔇 Placeholder logging disabled");
};

// Wrapper functions with logging for placeholder class management
import {
  addClass as baseAddClass,
  removeClass as baseRemoveClass,
} from "../../dom/classes";

export const addPlaceholderClass = (element: HTMLElement, item: any) => {
  if (!element) {
    console.warn("⚠️  addPlaceholderClass: No element provided");
    return;
  }

  if (item._isFake || item[FAKE_DATA.FAKE_FLAG]) {
    console.log("🔍 [PlaceholderClass] Classes BEFORE adding placeholder:", {
      classList: Array.from(element.classList),
      innerHTML: element.innerHTML.substring(0, 100),
    });

    // Add the placeholder class using the DOM utility
    baseAddClass(element, item._placeholderClass || "item-placeholder");

    console.log("🔍 [PlaceholderClass] Classes AFTER adding placeholder:", {
      classList: Array.from(element.classList),
      expectedClass: `mtrl-${item._placeholderClass || "item-placeholder"}`,
      hasExpectedClass: element.classList.contains(
        `mtrl-${item._placeholderClass || "item-placeholder"}`
      ),
    });

    // Clean up classes - for placeholders, only keep mtrl-list-item and mtrl-item-placeholder
    const currentClasses = Array.from(element.classList);
    const classesToKeep = [
      "mtrl-list-item",
      `mtrl-${item._placeholderClass || "item-placeholder"}`,
    ];

    currentClasses.forEach((className) => {
      if (!classesToKeep.includes(className)) {
        element.classList.remove(className);
        console.log(
          `🧹 [PlaceholderClass] Removed unwanted class: ${className}`
        );
      }
    });

    console.log("🔍 [PlaceholderClass] Classes AFTER cleanup:", {
      classList: Array.from(element.classList),
      shouldOnlyHave: classesToKeep,
    });

    // Set CSS custom property for opacity
    if (item._placeholderOpacity !== undefined) {
      element.style.setProperty(
        "--placeholder-opacity",
        item._placeholderOpacity.toString()
      );
    }

    // Add accessibility attributes
    element.setAttribute("aria-busy", "true");
    element.setAttribute("aria-label", "Loading content...");

    // Log the operation
    console.log(
      `🎭 Added placeholder class: mtrl-${
        item._placeholderClass || "item-placeholder"
      }`,
      {
        element,
        opacity: item._placeholderOpacity,
        mode: item._placeholderMode,
        allClasses: Array.from(element.classList),
        hasClass: element.classList.contains(
          `mtrl-${item._placeholderClass || "item-placeholder"}`
        ),
      }
    );
  }
};

export const removePlaceholderClass = (
  element: HTMLElement,
  className = "item-placeholder"
) => {
  if (!element) {
    console.warn("⚠️  removePlaceholderClass: No element provided");
    return;
  }

  console.log("🔍 [RemovePlaceholder] Classes BEFORE removing placeholder:", {
    classList: Array.from(element.classList),
  });

  // Remove the placeholder class
  baseRemoveClass(element, className);

  // Remove CSS custom property
  element.style.removeProperty("--placeholder-opacity");

  // Remove accessibility attributes
  element.removeAttribute("aria-busy");
  element.removeAttribute("aria-label");

  console.log("🔍 [RemovePlaceholder] Classes AFTER removing placeholder:", {
    classList: Array.from(element.classList),
    removedClass: `mtrl-${className}`,
  });

  // Log the operation
  console.log(`✨ Removed placeholder class: mtrl-${className}`, {
    element,
    hadClass: !element.classList.contains(`mtrl-${className}`),
    remainingClasses: Array.from(element.classList),
  });
};

/**
 * Automatic render hook for applying placeholder styling
 * This function is called automatically for each rendered item
 */
export const placeholderRenderHook = (item: any, element: HTMLElement) => {
  console.log("🎭 [PlaceholderHook] Render hook called!", {
    item: item
      ? {
          id: item.id,
          _isFake: item._isFake,
          [FAKE_DATA.FAKE_FLAG]: item[FAKE_DATA.FAKE_FLAG],
        }
      : null,
    element,
    elementClasses: element ? Array.from(element.classList) : null,
  });

  if (!item || !element) {
    console.warn("⚠️ [PlaceholderHook] Missing item or element", {
      item,
      element,
    });
    return;
  }

  // Check if this is a fake/placeholder item
  const isFake = item._isFake || item[FAKE_DATA.FAKE_FLAG];
  console.log("🔍 [PlaceholderHook] Item analysis:", {
    itemId: item.id,
    isFake,
    _isFake: item._isFake,
    flagValue: item[FAKE_DATA.FAKE_FLAG],
    flagKey: FAKE_DATA.FAKE_FLAG,
  });

  if (isFake) {
    console.log("🎭 [PlaceholderHook] Applying placeholder styling...");
    // Apply placeholder styling
    addPlaceholderClass(element, item);
  } else {
    console.log(
      "✨ [PlaceholderHook] Checking for existing placeholder class..."
    );
    // Remove placeholder styling if it exists
    if (element.classList.contains("mtrl-item-placeholder")) {
      console.log(
        "🧹 [PlaceholderHook] Found existing placeholder class, removing..."
      );
      removePlaceholderClass(element);
    } else {
      console.log(
        "ℹ️ [PlaceholderHook] No placeholder class found, nothing to remove"
      );
    }
  }
};

/**
 * Install the placeholder render hook into a list manager renderer
 * This should be called when setting up the list manager
 */
export const installPlaceholderHook = (
  setRenderHookFn: (hook: (item: any, element: HTMLElement) => void) => void
) => {
  console.log("🔧 [PlaceholderHook] Starting installation...", {
    setRenderHookFn,
  });

  if (!setRenderHookFn || typeof setRenderHookFn !== "function") {
    console.error("❌ [PlaceholderHook] setRenderHookFn is not a function!", {
      setRenderHookFn,
    });
    return;
  }

  console.log("🔧 [PlaceholderHook] Installing placeholder render hook...");
  setRenderHookFn(placeholderRenderHook);
  console.log(
    "✅ [PlaceholderHook] Placeholder render hook installed successfully!"
  );
};

export const testPlaceholderOpacity = (element?: HTMLElement) => {
  if (!element) {
    console.log(
      "⚠️  Please provide an element: testPlaceholderOpacity(element)"
    );
    return;
  }

  console.log("🧪 Testing placeholder opacity transitions...");

  // Create a fake item for testing
  const testItem = {
    _isFake: true,
    _placeholderClass: "item-placeholder",
    _placeholderOpacity: 0.3,
    _placeholderMode: "masked",
    [FAKE_DATA.FAKE_FLAG]: true,
  };

  // Test sequence: add placeholder → change opacity → remove placeholder
  addPlaceholderClass(element, testItem);

  setTimeout(() => {
    element.style.setProperty("--placeholder-opacity", "0.8");
    console.log("🔄 Changed opacity to 0.8", {
      element,
      computedOpacity: window.getComputedStyle(element).opacity,
      hasClass: element.classList.contains("mtrl-item-placeholder"),
    });
  }, 1000);

  setTimeout(() => {
    removePlaceholderClass(element);
  }, 2000);
};

// Expose to window for easy console testing (development only)
if (typeof window !== "undefined") {
  (window as any).setPlaceholderMode = setPlaceholderMode;
  (window as any).getPlaceholderMode = getPlaceholderMode;
  (window as any).setPlaceholderOpacity = setPlaceholderOpacity;
  (window as any).getPlaceholderOpacity = getPlaceholderOpacity;
  (window as any).enablePlaceholderLogging = enablePlaceholderLogging;
  (window as any).disablePlaceholderLogging = disablePlaceholderLogging;
  (window as any).testPlaceholderOpacity = testPlaceholderOpacity;
  (window as any).addPlaceholderClass = addPlaceholderClass;
  (window as any).removePlaceholderClass = removePlaceholderClass;
  (window as any).placeholderRenderHook = placeholderRenderHook;

  // Add helper function to show available modes
  (window as any).showPlaceholderModes = () => {
    console.log(`
🎭 Available Placeholder Modes:

setPlaceholderMode('masked')    // ▪▪▪▪▪ ▪▪▪▪ Real structure, masked text (recommended)
setPlaceholderMode('skeleton')  // ▁▁▁▁▁ Loading bars (modern)
setPlaceholderMode('blank')     // Empty spaces (minimal)  
setPlaceholderMode('dots')      // • • • Dotted pattern
setPlaceholderMode('realistic') // Fake names (avoid)

🎨 Opacity Control:
setPlaceholderOpacity(0.5)      // 50% opacity (default)
setPlaceholderOpacity(0.3)      // 30% opacity (very subtle)
setPlaceholderOpacity(1.0)      // 100% opacity (fully visible)

🔍 Debug Tools:
enablePlaceholderLogging()      // Enable console logging
addPlaceholderClass(element, item) // Add placeholder class with logging
removePlaceholderClass(element) // Remove placeholder class with logging
testPlaceholderOpacity(element) // Test transitions on element
disablePlaceholderLogging()     // Disable console logging

💡 CSS Implementation:
.mtrl-item-placeholder {
  opacity: var(--placeholder-opacity, 0.5);
  transition: opacity 0.3s ease-in-out;
}

📝 Debug logging shows:
🎭 Added placeholder class: mtrl-item-placeholder, opacity: 0.5
✨ Removed placeholder class: mtrl-item-placeholder

📋 Example output: "▪▪▪▪▪▪ ▪▪▪▪▪▪▪▪" (subtle masking, close to text size)

Current mode: ${getPlaceholderMode()}
Mask character: ${FAKE_DATA.MASK_CHARACTER}
Placeholder opacity: ${FAKE_DATA.PLACEHOLDER_OPACITY}
    `);
  };

  // Auto-show on first load for discoverability
  console.log(
    `🎭 Placeholder API loaded! Type 'showPlaceholderModes()' for help.`
  );
  console.log(
    `🔍 Debug tools: addPlaceholderClass(element, item), removePlaceholderClass(element)`
  );
}
