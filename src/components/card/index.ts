// src/components/card/index.ts

/**
 * @module Card
 *
 * Card component following Material Design 3 guidelines.
 * Cards are surfaces that display content and actions about a single topic.
 * They should be easy to scan for relevant and actionable information.
 *
 * The main export is the {@link default | createCard} factory function that creates
 * a {@link CardComponent} instance with the provided configuration.
 *
 * Features:
 * - Multiple variants: elevated, filled, and outlined
 * - Support for header, content, media, and actions sections
 * - Interactive behavior with elevation changes on hover
 * - Draggable capability
 * - Expandable content support
 * - Loading state indication
 * - Swipe gestures with custom actions
 *
 * The API includes methods for:
 * - {@link CardComponent.addContent | Adding content}
 * - {@link CardComponent.setHeader | Setting header}
 * - {@link CardComponent.addMedia | Adding media}
 * - {@link CardComponent.setActions | Setting actions}
 * - {@link CardComponent.makeDraggable | Making cards draggable}
 * - {@link CardComponent.focus | Managing focus}
 *
 * @example
 * ```typescript
 * // Create a basic card
 * const card = createCard({
 *   variant: 'elevated',
 *   header: {
 *     title: 'Card Title',
 *     subtitle: 'Secondary text'
 *   },
 *   content: {
 *     text: 'Card content goes here.'
 *   },
 *   buttons: [
 *     { text: 'Action', variant: 'text' }
 *   ]
 * });
 *
 * // Modify card programmatically using API methods
 * const image = document.createElement('div');
 * image.className = 'mtrl-card-media';
 * image.style.backgroundImage = 'url(path/to/image.jpg)';
 *
 * card.addMedia(image, 'top')
 *     .makeDraggable((event) => {
 *       console.log('Card drag started');
 *     });
 * ```
 *
 * @category Components
 */

/**
 * Factory function to create a new Card component.
 * @see CardComponent for the full API reference
 */
export { default } from "./card";

/**
 * Card component types and interfaces
 *
 * These types define the structure and behavior of the Card component.
 */
export {
  CardVariant,
  CardElevationLevel,
  CardSchema,
  CardHeaderConfig,
  CardContentConfig,
  CardActionsConfig,
  CardMediaConfig,
  CardAriaAttributes,
  CardComponent,
  LoadingFeature,
  ExpandableFeature,
  SwipeableFeature,
} from "./types";

// Export card content helper functions
export {
  createCardContent,
  createCardHeader,
  createCardActions,
  createCardMedia,
} from "./content";

// Export API methods
export { withAPI } from "./api";

// Export feature enhancers
export {
  withLoading,
  withExpandable,
  withSwipeable,
  withElevation,
} from "./features";

// Export card constants
export {
  CARD_VARIANTS,
  CARD_ELEVATIONS,
  CARD_WIDTHS,
  CARD_CORNER_RADIUS,
  CARD_ASPECT_RATIOS,
  CARD_ACTION_ALIGNMENT,
  CARD_MEDIA_POSITION,
  CARD_CLASSES,
} from "./constants";
