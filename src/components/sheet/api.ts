// src/components/sheet/api.ts
import { SheetComponent } from './types';

interface ApiOptions {
  state: {
    open: () => void;
    close: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  container: HTMLElement;
  content: {
    setContent: (html: string) => any;
    getContent: () => string;
    getElement: () => HTMLElement | null;
  };
  title: {
    setTitle: (text: string) => any;
    getTitle: () => string;
    getElement: () => HTMLElement | null;
  };
  getClass: (name: string) => string;
  dragHandle?: {
    setVisible: (visible: boolean) => any;
  };
  initialize?: () => void;
}

/**
 * Enhances a sheet component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Sheet component
 */
export const withAPI = ({ state, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): SheetComponent => ({
    ...component as any,
    element: component.element,
    container: component.container,
    
    open() {
      state.open();
      return this;
    },
    
    close() {
      state.close();
      return this;
    },
    
    setContent(html: string) {
      component.content.setContent(html);
      return this;
    },
    
    getContent() {
      return component.content.getContent();
    },
    
    setTitle(text: string) {
      component.title.setTitle(text);
      return this;
    },
    
    getTitle() {
      return component.title.getTitle();
    },
    
    setDragHandle(enabled: boolean) {
      if (component.dragHandle) {
        component.dragHandle.setVisible(enabled);
      }
      return this;
    },
    
    setMaxHeight(height: string) {
      component.container.style.maxHeight = height;
      return this;
    },
    
    destroy() {
      lifecycle.destroy();
    },
    
    initialize() {
      if (component.initialize) {
        component.initialize();
      }
      return this;
    }
  });