// src/core/composition/features/index.ts

// Export composition features
export { withLayout } from './layout';
export { withIcon } from './icon';
export { withLabel } from './label';
export { withDom } from './dom';

// Re-export interface types for better developer experience
export type { IconConfig } from './icon';
export type { LabelConfig } from './label';
export type { LayoutConfig } from './layout';