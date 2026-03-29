// src/components/drawer/features/headline.ts
import { DrawerConfig } from "../types";

/**
 * Component shape expected by withHeadline
 */
interface HeadlineBaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  [key: string]: unknown;
}

/**
 * Adds headline management to the drawer component
 *
 * @param config - Drawer configuration
 * @returns Component enhancer function
 */
export const withHeadline =
  (config: DrawerConfig) =>
  (component: HeadlineBaseComponent): HeadlineBaseComponent => {
    let headlineElement: HTMLElement | null = null;
    let headlineText: string = config.headline || "";

    // Create headline element if text is provided
    if (headlineText) {
      headlineElement = document.createElement("div");
      headlineElement.className = component.getClass("drawer__headline");
      headlineElement.textContent = headlineText;
    }

    /**
     * Sets the headline text
     */
    const setHeadline = (text: string): void => {
      headlineText = text;

      if (text) {
        if (!headlineElement) {
          headlineElement = document.createElement("div");
          headlineElement.className = component.getClass("drawer__headline");
        }
        headlineElement.textContent = text;
      } else if (headlineElement && headlineElement.parentNode) {
        headlineElement.parentNode.removeChild(headlineElement);
        headlineElement = null;
      }
    };

    /**
     * Gets the headline text
     */
    const getHeadline = (): string => headlineText;

    return {
      ...component,
      headlineElement,
      drawerHeadline: {
        setHeadline,
        getHeadline,
        getElement: () => headlineElement,
      },
    };
  };
