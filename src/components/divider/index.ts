// src/components/divider/index.ts

// Use a more explicit export to avoid bundler confusion
import { createDivider } from './divider';
export { createDivider };

// Export types
export type { DividerConfig } from './config';
export type { DividerComponent } from './types';