// src/components/chips/chip/types.ts
import { ChipConfig, ChipComponent, ChipVariant } from '../types';

export { ChipConfig, ChipComponent, ChipVariant };

// Add chip-specific interfaces
export interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}