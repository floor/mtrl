// src/components/dialog/index.ts

/**
 * Dialog Component Module
 * 
 * A Material Design 3 dialog implementation with support for multiple sizes,
 * animations, content types, and interactive features like confirmation.
 * 
 * Dialogs inform users about critical information, require decisions,
 * or involve multiple tasks.
 * 
 * @module components/dialog
 * @category Components
 */

// Main factory function
export { default } from './dialog';

// TypeScript types and interfaces
export { 
  DialogConfig, 
  DialogComponent, 
  DialogButton, 
  DialogEvent, 
  DialogConfirmOptions,
  DialogSize,
  DialogAnimation,
  DialogFooterAlignment,
  DialogEventType
} from './types';
