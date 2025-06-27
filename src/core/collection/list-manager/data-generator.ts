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
   * Analyze real items to detect patterns for generating believable fake items
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

    if (FAKE_DATA.DEBUG_LOGGING) {
      console.log("🔍 Pattern analysis complete:", this.cache.pattern);
    }
  }

  /**
   * Generate a fake item for the given virtual index
   */
  generateFakeItem(index: number, realItems: any[] = []): any {
    // Check cache first
    if (this.cache.items.has(index)) {
      return this.cache.items.get(index);
    }

    // Analyze patterns if we have real items and haven't analyzed recently
    if (realItems.length > 0) {
      this.analyzePatterns(realItems);
    }

    // Generate new fake item
    const fakeItem = this.createFakeItem(index);

    // Cache with size limit (50 items max)
    if (this.cache.items.size >= 50) {
      // Remove oldest entry
      const firstKey = this.cache.items.keys().next().value;
      this.cache.items.delete(firstKey);
    }
    this.cache.items.set(index, fakeItem);

    return fakeItem;
  }

  /**
   * Create fake item using detected patterns (fast generation)
   */
  private createFakeItem(index: number): any {
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
      [FAKE_DATA.FAKE_FLAG]: true, // Mark as fake
      _fakeIndex: index, // Keep original index for debugging
      _placeholderMode: FAKE_DATA.PLACEHOLDER_MODE, // Track placeholder mode for CSS class
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

    // Add the base placeholder class
    baseAddClass(element, "item-placeholder");

    // Add mode-specific modifier class
    const mode = item._placeholderMode || FAKE_DATA.PLACEHOLDER_MODE;
    if (mode && mode !== "realistic") {
      baseAddClass(element, `item-placeholder--${mode}`);
    }

    console.log("🔍 [PlaceholderClass] Classes AFTER adding placeholder:", {
      classList: Array.from(element.classList),
      baseClass: "mtrl-item-placeholder",
      modeClass: `mtrl-item-placeholder--${mode}`,
      hasBaseClass: element.classList.contains("mtrl-item-placeholder"),
      hasModeClass: element.classList.contains(
        `mtrl-item-placeholder--${mode}`
      ),
    });

    // Clean up classes - keep mtrl-list-item and placeholder classes
    const currentClasses = Array.from(element.classList);
    const classesToKeep = [
      "mtrl-list-item",
      "mtrl-item-placeholder",
      `mtrl-item-placeholder--${mode}`,
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
      shouldOnlyHave: classesToKeep.filter((c) => c.includes("mtrl-")),
    });

    // Add accessibility attributes
    element.setAttribute("aria-busy", "true");
    element.setAttribute("aria-label", "Loading content...");

    // Log the operation
    console.log(`🎭 Added placeholder class: mtrl-item-placeholder--${mode}`, {
      element,
      mode: mode,
      allClasses: Array.from(element.classList),
      hasBaseClass: element.classList.contains("mtrl-item-placeholder"),
      hasModeClass: element.classList.contains(
        `mtrl-item-placeholder--${mode}`
      ),
    });
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

  // Remove the base placeholder class
  baseRemoveClass(element, className);

  // Remove all mode-specific modifier classes
  const modes = ["skeleton", "masked", "blank", "dots", "realistic"];
  modes.forEach((mode) => {
    baseRemoveClass(element, `${className}--${mode}`);
  });

  // Remove accessibility attributes
  element.removeAttribute("aria-busy");
  element.removeAttribute("aria-label");

  console.log("🔍 [RemovePlaceholder] Classes AFTER removing placeholder:", {
    classList: Array.from(element.classList),
    removedBaseClass: `mtrl-${className}`,
    removedModeClasses: modes.map((m) => `mtrl-${className}--${m}`),
  });

  // Log the operation
  console.log(`✨ Removed placeholder classes: mtrl-${className} + variants`, {
    element,
    hadBaseClass: !element.classList.contains(`mtrl-${className}`),
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

🎨 Mode Control:
setPlaceholderMode('masked')    // ▪▪▪▪▪ ▪▪▪▪ Real structure, masked text (recommended)
setPlaceholderMode('skeleton')  // ▁▁▁▁▁ Loading bars (modern)
setPlaceholderMode('blank')     // Empty spaces (minimal)  
setPlaceholderMode('dots')      // • • • Dotted pattern
setPlaceholderMode('realistic') // Fake names (avoid)

💡 Styling is now controlled via SCSS variables:
$placeholder-opacity: 0.6
$placeholder-opacity-skeleton: 0.8  
$placeholder-opacity-masked: 0.7
$placeholder-opacity-subtle: 0.4

🔍 Debug Tools:
enablePlaceholderLogging()      // Enable console logging
addPlaceholderClass(element, item) // Add placeholder class with logging
removePlaceholderClass(element) // Remove placeholder class with logging
testPlaceholderOpacity(element) // Test transitions on element
disablePlaceholderLogging()     // Disable console logging

💡 CSS Implementation:
.mtrl-item-placeholder {
  opacity: $placeholder-opacity;
  transition: opacity 0.3s ease-in-out;
}

📝 Debug logging shows:
🎭 Added placeholder class: mtrl-item-placeholder--masked
✨ Removed placeholder class: mtrl-item-placeholder + variants

📋 Example output: "▪▪▪▪▪▪ ▪▪▪▪▪▪▪▪" (subtle masking, close to text size)

Current mode: ${getPlaceholderMode()}
Mask character: ${FAKE_DATA.MASK_CHARACTER}
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
