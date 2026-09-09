// src/components/side-sheet/types.ts

import { SIDE_SHEET_VARIANTS, SIDE_SHEET_POSITIONS } from "./constants";

/** Docked or floating over a scrim */
export type SideSheetVariant =
  (typeof SIDE_SHEET_VARIANTS)[keyof typeof SIDE_SHEET_VARIANTS];

/** Which edge it docks to, in logical terms */
export type SideSheetPosition =
  (typeof SIDE_SHEET_POSITIONS)[keyof typeof SIDE_SHEET_POSITIONS];

/** Handlers accepted at creation, one per event name */
export interface SideSheetEventHandlers {
  open?: () => void;
  close?: () => void;
}

/**
 * Configuration for the side sheet.
 *
 * @category Components
 */
export interface SideSheetConfig {
  /**
   * Standard sheets dock beside the page and leave it usable; modal sheets
   * float over it behind a scrim and take focus.
   * @default 'modal'
   */
  variant?: SideSheetVariant;

  /**
   * Which edge to dock to. Logical, so `end` follows the writing direction.
   * @default 'end'
   */
  position?: SideSheetPosition;

  /**
   * Headline in the header. Also names the sheet for assistive technology,
   * through `aria-labelledby`.
   */
  title?: string;

  /** Body of the sheet, as markup or an element */
  content?: string | HTMLElement;

  /**
   * Width in pixels. Capped by `maxWidth`.
   * @default 256
   */
  width?: number;

  /**
   * The sheet never grows past this, so it does not take over a wide window.
   * @default 400
   */
  maxWidth?: number;

  /**
   * Whether the header carries a close button.
   * @default true
   */
  closeButton?: boolean;

  /**
   * Whether a click on the scrim closes a modal sheet. Standard sheets have no
   * scrim, so this does nothing for them.
   * @default true
   */
  closeOnScrimClick?: boolean;

  /**
   * Whether Escape closes it.
   * @default true
   */
  closeOnEscape?: boolean;

  /** Whether the sheet starts open */
  open?: boolean;

  /** Where to mount the sheet. Defaults to `document.body` */
  container?: HTMLElement;

  /** Handlers registered at creation, equivalent to calling `on` for each */
  on?: SideSheetEventHandlers;

  /** Extra classes for the root element */
  class?: string;

  /** @internal */
  prefix?: string;
  /** @internal */
  componentName?: string;
}

/**
 * A side sheet instance.
 *
 * @category Components
 */
export interface SideSheetComponent {
  /** The root element, which holds the scrim and the container */
  element: HTMLElement;

  /** Opens the sheet */
  open: () => SideSheetComponent;

  /** Closes the sheet */
  close: () => SideSheetComponent;

  /** Opens it if closed, closes it if open */
  toggle: () => SideSheetComponent;

  /** Whether the sheet is showing */
  isOpen: () => boolean;

  /** Replaces the body */
  setContent: (content: string | HTMLElement) => SideSheetComponent;

  /** Replaces the headline */
  setTitle: (title: string) => SideSheetComponent;

  /** Adds an event listener */
  on: <T extends keyof SideSheetEventHandlers>(
    event: T,
    handler: NonNullable<SideSheetEventHandlers[T]>
  ) => SideSheetComponent;

  /** Removes an event listener */
  off: <T extends keyof SideSheetEventHandlers>(
    event: T,
    handler: NonNullable<SideSheetEventHandlers[T]>
  ) => SideSheetComponent;

  /** Removes the sheet from the page and releases its listeners */
  destroy: () => void;

  /** Prefixes a class name, for styling hooks */
  getClass: (name: string) => string;
}
