// src/components/bottom-sheet/types.ts

import {
  BOTTOM_SHEET_VARIANTS,
  BOTTOM_SHEET_STATES,
} from "./constants";

/** Standard or modal */
export type BottomSheetVariant =
  (typeof BOTTOM_SHEET_VARIANTS)[keyof typeof BOTTOM_SHEET_VARIANTS];

/** How far the sheet is open */
export type BottomSheetState =
  (typeof BOTTOM_SHEET_STATES)[keyof typeof BOTTOM_SHEET_STATES];

/** What a state change reports */
export interface BottomSheetStateEvent {
  /** The state the sheet has moved to */
  state: BottomSheetState;
  /** The state it came from */
  previous: BottomSheetState;
}

/** Handlers accepted at creation, one per event name */
export interface BottomSheetEventHandlers {
  open?: () => void;
  close?: () => void;
  stateChange?: (event: BottomSheetStateEvent) => void;
  dragStart?: () => void;
  dragEnd?: (event: BottomSheetStateEvent) => void;
}

/**
 * Configuration for the bottom sheet.
 *
 * @category Components
 */
export interface BottomSheetConfig {
  /**
   * Standard sheets leave the page usable; modal sheets cover it with a scrim
   * and take focus.
   * @default 'modal'
   */
  variant?: BottomSheetVariant;

  /**
   * Headline shown above the content. Also names the sheet for assistive
   * technology, through `aria-labelledby`.
   */
  title?: string;

  /** Body of the sheet, as markup or an element */
  content?: string | HTMLElement;

  /**
   * The 32x4dp bar at the top edge, which says the sheet can be dragged.
   * Turning it off also turns off dragging, since nothing would indicate it.
   * @default true
   */
  dragHandle?: boolean;

  /**
   * Height of the partially expanded state, in pixels.
   * @default 56
   */
  peekHeight?: number;

  /**
   * The sheet stops growing at this width and centres itself, so it does not
   * stretch across a desktop window.
   * @default 640
   */
  maxWidth?: number;

  /**
   * State to start in. `hidden` builds the sheet without showing it.
   * @default 'hidden'
   */
  initialState?: BottomSheetState;

  /**
   * Whether a click on the scrim closes a modal sheet. Standard sheets have no
   * scrim, so this does nothing for them.
   * @default true
   */
  closeOnScrimClick?: boolean;

  /**
   * Whether Escape closes a modal sheet.
   * @default true
   */
  closeOnEscape?: boolean;

  /** Where to mount the sheet. Defaults to `document.body` */
  container?: HTMLElement;

  /** Handlers registered at creation, equivalent to calling `on` for each */
  on?: BottomSheetEventHandlers;

  /** Extra classes for the root element */
  class?: string;

  /** @internal */
  prefix?: string;
  /** @internal */
  componentName?: string;
}

/**
 * A bottom sheet instance.
 *
 * @category Components
 */
export interface BottomSheetComponent {
  /** The root element, which holds the scrim and the container */
  element: HTMLElement;

  /** Opens the sheet, partially expanded */
  open: () => BottomSheetComponent;

  /** Closes the sheet */
  close: () => BottomSheetComponent;

  /** Opens the sheet to its full height */
  expand: () => BottomSheetComponent;

  /** Returns the sheet to the peek height */
  collapse: () => BottomSheetComponent;

  /** Whether the sheet is showing at all */
  isOpen: () => boolean;

  /** How far the sheet is open */
  getState: () => BottomSheetState;

  /** Replaces the body of the sheet */
  setContent: (content: string | HTMLElement) => BottomSheetComponent;

  /** Replaces the headline */
  setTitle: (title: string) => BottomSheetComponent;

  /** Adds an event listener */
  on: <T extends keyof BottomSheetEventHandlers>(
    event: T,
    handler: NonNullable<BottomSheetEventHandlers[T]>
  ) => BottomSheetComponent;

  /** Removes an event listener */
  off: <T extends keyof BottomSheetEventHandlers>(
    event: T,
    handler: NonNullable<BottomSheetEventHandlers[T]>
  ) => BottomSheetComponent;

  /** Removes the sheet from the page and releases its listeners */
  destroy: () => void;

  /** Prefixes a class name, for styling hooks */
  getClass: (name: string) => string;
}
