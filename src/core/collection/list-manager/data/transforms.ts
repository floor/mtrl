/**
 * Transform Function Examples (NOT EXPORTED - EXAMPLES ONLY)
 *
 * These are example transform functions that show how to convert your API data
 * into the format expected by the list manager. These examples are NOT exported
 * from the library to avoid bundle bloat. Copy and adapt them for your needs.
 *
 * Required format:
 * {
 *   id: string,           // Unique identifier
 *   headline: string,     // Primary text (name, title, etc.)
 *   supportingText: string, // Secondary text (email, description, etc.)
 *   meta: string         // Additional info (role, date, status, etc.)
 * }
 *
 * Usage:
 * ```typescript
 * const myList = createList({
 *   // ... other config
 *   transform: (item) => ({
 *     id: item.id,
 *     headline: item.name,
 *     supportingText: item.email,
 *     meta: item.role
 *   })
 * });
 * ```
 */

/**
 * Example: User/Contact transform
 * Most common use case for user lists, contact lists, team members, etc.
 */
export const user = (user: any) => ({
  id: user._id || user.id,
  headline: user.name || user.displayName || user.username,
  supportingText: user.email || user.phone,
  meta: user.role || user.department || "User",
});

/**
 * Example: Product/Item transform
 * E-commerce products, inventory items, catalog entries, etc.
 */
export const product = (product: any) => ({
  id: product._id || product.id || product.sku,
  headline: product.name || product.title,
  supportingText: product.price ? `$${product.price}` : product.description,
  meta: product.category || product.brand || product.status,
});

/**
 * Example: Article/Content transform
 * Blog posts, news articles, documentation, etc.
 */
export const article = (article: any) => ({
  id: article._id || article.id || article.slug,
  headline: article.title || article.name,
  supportingText: article.excerpt || article.description || article.summary,
  meta: article.author || article.publishedAt || article.category,
});

/**
 * Example: Task/Todo transform
 * Task management, todo lists, project items, etc.
 */
export const task = (task: any) => ({
  id: task._id || task.id,
  headline: task.title || task.name,
  supportingText: task.description || task.notes,
  meta: task.status || task.priority || task.assignee,
});

/**
 * Example: File/Document transform
 * File lists, document libraries, media galleries, etc.
 */
export const file = (file: any) => ({
  id: file._id || file.id || file.path,
  headline: file.name || file.filename,
  supportingText: file.size ? formatFileSize(file.size) : file.type,
  meta: file.lastModified || file.uploadedAt || file.owner,
});

/**
 * Example: Generic/Flexible transform
 * Handles various object structures with fallbacks
 */
export const generic = (item: any) => ({
  id: item._id || item.id || item.key || String(Math.random()),
  headline: item.name || item.title || item.label || item.headline || "Unknown",
  supportingText:
    item.description ||
    item.subtitle ||
    item.email ||
    item.supportingText ||
    "",
  meta: item.category || item.type || item.status || item.meta || "",
});

/**
 * Utility function for file size formatting
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Example: Transform with error handling (recommended pattern)
 * Shows how to handle invalid data gracefully
 */
export const withErrorHandling = (item: any) => {
  // Validate input
  if (!item || typeof item !== "object") {
    console.warn("Invalid item received in transform:", item);
    return {
      id: "error-" + Date.now() + Math.random(),
      headline: "Error: Invalid Item",
      supportingText: "The item data was malformed",
      meta: "Error",
    };
  }

  // Transform with fallbacks
  return {
    id: item.id || item._id || String(Math.random()),
    headline: String(item.name || item.title || "Unknown Item"),
    supportingText: String(item.description || item.email || ""),
    meta: String(item.category || item.type || ""),
    // Preserve original data for advanced use cases
    original: item,
  };
};

/**
 * Collection of all example transforms
 * Use this for reference or testing purposes
 */
export const transforms = {
  user,
  product,
  article,
  task,
  file,
  generic,
  withErrorHandling,
};
