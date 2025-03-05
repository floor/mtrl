// src/components/carousel/types.ts

/**
 * Material Design 3 Carousel Layout Types
 * @category Components
 */
export type CarouselLayout = 
  /** Best for browsing many visual items at once (photos, event feeds) */
  | 'multi-browse'
  /** For highly customized or text-heavy carousels (traditional behavior) */
  | 'uncontained'
  /** For spotlighting very large visual items (featured content) */
  | 'hero'
  /** For immersive vertical-scrolling experiences */
  | 'full-screen';

/**
 * Carousel Scrolling Behaviors
 * @category Components
 */
export type CarouselScrollBehavior =
  /** Standard scrolling without snapping, recommended for uncontained layouts */ 
  | 'default'
  /** Items snap to carousel layout, recommended for multi-browse, hero, and full-screen layouts */
  | 'snap';

/**
 * Slide data interface
 * @category Components
 */
export interface CarouselSlide {
  /** Image URL for the slide */
  image: string;
  
  /** Optional title text for the slide */
  title?: string;
  
  /** Optional accent color in hexadecimal or RGB format */
  accent?: string;
  
  /** Optional description text */
  description?: string;
  
  /** Optional action button text */
  buttonText?: string;
  
  /** Optional action button URL */
  buttonUrl?: string;
  
  /** Optional size designation for the item, will be auto-calculated if not provided */
  size?: 'large' | 'medium' | 'small';
}

/**
 * Configuration interface for the Carousel component
 * @category Components
 */
export interface CarouselConfig {
  /** 
   * Initial slide index to display
   * @default 0
   */
  initialSlide?: number;
  
  /** 
   * Whether to loop the carousel
   * @default true
   */
  loop?: boolean;
  
  /** 
   * Transition effect for slide changes
   * @default 'slide'
   */
  transition?: 'slide' | 'fade' | 'none';
  
  /** 
   * Transition duration in milliseconds
   * @default 300
   */
  transitionDuration?: number;
  
  /** 
   * Slides configuration for the carousel
   * @example [{ image: 'image1.jpg', title: 'Title', accent: '#E6E1E5' }]
   */
  slides?: CarouselSlide[];
  
  /** 
   * Border radius for slides in pixels
   * @default 16
   */
  borderRadius?: number;
  
  /** 
   * Gap between slides in pixels
   * @default 8
   */
  gap?: number;
  
  /** 
   * Additional CSS classes to add to the carousel
   * @example 'hero-carousel featured-carousel'
   */
  class?: string;
  
  /**
   * Component prefix for class names
   * @default 'carousel'
   */
  prefix?: string;
  
  /**
   * Component name used in class generation
   * @default 'carousel'
   */
  componentName?: string;
  
  /**
   * Callback for "Show all" action when present
   */
  onShowAll?: () => void;
  
  /**
   * Whether to show a "Show all" link at the end
   * MD3 recommends adding this for accessibility on vertical scrolling pages
   * @default true
   */
  showAllLink?: boolean;
  
  /**
   * MD3 carousel layout type
   * @default 'multi-browse'
   */
  layout?: CarouselLayout;
  
  /**
   * Scrolling behavior for the carousel
   * @default depends on layout (snap for multi-browse, hero, full-screen; default for uncontained)
   */
  scrollBehavior?: CarouselScrollBehavior;
  
  /**
   * Whether to center the carousel items (applies to hero layout)
   * @default false
   */
  centered?: boolean;
  
  /**
   * Maximum width of large items (affects how many items fit on screen)
   * Large items should remain big enough to be easily recognizable
   */
  largeItemMaxWidth?: number;
  
  /**
   * Width for small items in pixels
   * @default 40-56dp range as per MD3 guidelines
   */
  smallItemWidth?: number;
}

/**
 * Slides API interface for carousel
 * @category Components
 */
export interface SlidesAPI {
  /**
   * Adds a new slide to the carousel
   * @param slide - CarouselSlide object with slide data
   * @param index - Optional position to insert the slide
   * @returns The slides API for chaining
   */
  addSlide: (slide: CarouselSlide, index?: number) => SlidesAPI;
  
  /**
   * Removes a slide at the specified index
   * @param index - Index of the slide to remove
   * @returns The slides API for chaining
   */
  removeSlide: (index: number) => SlidesAPI;
  
  /**
   * Updates an existing slide
   * @param index - Index of the slide to update
   * @param slide - Updated CarouselSlide object
   * @returns The slides API for chaining
   */
  updateSlide: (index: number, slide: CarouselSlide) => SlidesAPI;
  
  /**
   * Gets a slide at the specified index
   * @param index - Index of the slide
   * @returns CarouselSlide object or null if not found
   */
  getSlide: (index: number) => CarouselSlide | null;
  
  /**
   * Gets the total number of slides
   * @returns Number of slides
   */
  getCount: () => number;
  
  /**
   * Gets all slide elements
   * @returns Array of slide elements
   */
  getElements: () => HTMLElement[];
}

/**
 * Carousel component interface
 * @category Components
 */
export interface CarouselComponent {
  /** The carousel's root DOM element */
  element: HTMLElement;
  
  /** API for managing carousel slides */
  slides: SlidesAPI;
  
  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;
  
  /**
   * Goes to the next slide
   * @returns The carousel component for chaining
   */
  next: () => CarouselComponent;
  
  /**
   * Goes to the previous slide
   * @returns The carousel component for chaining
   */
  prev: () => CarouselComponent;
  
  /**
   * Goes to a specific slide
   * @param index - Slide index
   * @returns The carousel component for chaining
   */
  goTo: (index: number) => CarouselComponent;
  
  /**
   * Gets the current slide index
   * @returns Current slide index
   */
  getCurrentSlide: () => number;
  
  /**
   * Adds a new slide
   * @param slide - CarouselSlide object with slide data
   * @param index - Optional position to insert the slide
   * @returns The carousel component for chaining
   */
  addSlide: (slide: CarouselSlide, index?: number) => CarouselComponent;
  
  /**
   * Removes a slide
   * @param index - Index of the slide to remove
   * @returns The carousel component for chaining
   */
  removeSlide: (index: number) => CarouselComponent;
  
  /**
   * Enables the loop mode
   * @returns The carousel component for chaining
   */
  enableLoop: () => CarouselComponent;
  
  /**
   * Disables the loop mode
   * @returns The carousel component for chaining
   */
  disableLoop: () => CarouselComponent;
  
  /**
   * Sets the carousel border radius
   * @param radius - Border radius in pixels
   * @returns The carousel component for chaining
   */
  setBorderRadius: (radius: number) => CarouselComponent;
  
  /**
   * Sets the gap between slides
   * @param gap - Gap size in pixels
   * @returns The carousel component for chaining
   */
  setGap: (gap: number) => CarouselComponent;
  
  /**
   * Destroys the carousel component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the carousel
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The carousel component for chaining
   */
  on: (event: string, handler: Function) => CarouselComponent;
  
  /**
   * Removes an event listener from the carousel
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The carousel component for chaining
   */
  off: (event: string, handler: Function) => CarouselComponent;
  
  /**
   * Adds CSS classes to the carousel element
   * @param classes - One or more class names to add
   * @returns The carousel component for chaining
   */
  addClass: (...classes: string[]) => CarouselComponent;
}