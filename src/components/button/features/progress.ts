import type { ProgressConfig, ProgressComponent } from '../../progress/types';
import { addClass, removeClass } from '../../../core/dom';
import { ButtonConfig } from '../types';

/**
 * Component with progress capabilities
 */
interface ProgressEnhancedComponent {
  element: HTMLElement;
  icon?: any;
  getClass: (name: string) => string;
  progress?: ProgressComponent;
  [key: string]: any;
}

/**
 * Dynamically imports and creates a progress component
 * @param config Progress configuration
 * @returns Promise resolving to the progress component
 */
const createProgressLazy = async (config: ProgressConfig): Promise<ProgressComponent> => {
  // Dynamic import directly from progress.ts to avoid index re-exports
  const { default: createProgress } = await import('../../progress/progress');
  return createProgress(config);
};

/**
 * Adds progress functionality to a button component
 * 
 * @param config - Button configuration with progress options
 * @returns Component enhancer function
 */
export const withProgress = (config: ButtonConfig) => 
  (component: ProgressEnhancedComponent): ProgressEnhancedComponent => {
    // Skip if no progress config
    if (!config.progress) {
      return component;
    }
    
    // Determine progress configuration
    const progressConfig: ProgressConfig = typeof config.progress === 'boolean' 
      ? { variant: 'circular', size: 20, thickness: 2, indeterminate: true }
      : {
          variant: 'circular',
          size: 20,
          thickness: 2,
          indeterminate: true,
          ...config.progress
        };
    
    // Progress will be created lazily
    let progress: ProgressComponent | null = null;
    let progressPromise: Promise<ProgressComponent> | null = null;
    let isLoading = false;
    let originalText = '';
    
    // Helper to ensure progress is loaded
    const ensureProgress = async (): Promise<ProgressComponent> => {
      if (progress) return progress;
      
      if (!progressPromise) {
        progressPromise = createProgressLazy(progressConfig).then(p => {
          progress = p;
          
          // Add button-specific class to the progress element
          addClass(progress.element, component.getClass('button-progress'));
          
          // Initially hide progress
          progress.element.style.display = 'none';
          
          // Store progress reference
          component.progress = progress;
          
          return progress;
        });
      }
      
      return progressPromise;
    };
    
    // Helper to get insertion point for progress
    const getProgressInsertionPoint = () => {
      // Try to insert after icon if it exists
      const iconElement = component.element.querySelector(`.${component.getClass('button-icon')}`);
      if (iconElement && iconElement.nextSibling) {
        return iconElement.nextSibling;
      }
      
      // Otherwise insert at the beginning
      return component.element.firstChild;
    };
    
    // Add progress methods that lazy-load the progress component
    component.showProgress = async function() {
      const p = await ensureProgress();
      
      if (p.element) {
        // Ensure progress element is in the DOM
        if (!component.element.contains(p.element)) {
          const insertPoint = getProgressInsertionPoint();
          if (insertPoint) {
            component.element.insertBefore(p.element, insertPoint);
          } else {
            component.element.appendChild(p.element);
          }
        }
        
        p.element.style.display = '';
        addClass(this.element, `${component.getClass('button')}--progress`);
        
        // Hide the icon if it exists
        const iconElement = component.element.querySelector(`.${component.getClass('button-icon')}`);
        if (iconElement instanceof HTMLElement) {
          iconElement.style.display = 'none';
        }
      }
      return this;
    };
    
    // Synchronous wrapper for convenience
    component.showProgressSync = function() {
      this.showProgress();
      return this;
    };
    
    component.hideProgress = async function() {
      // If progress hasn't been created yet, just return
      if (!progress) return this;
      
      progress.element.style.display = 'none';
      removeClass(this.element, `${component.getClass('button')}--progress`);
      
      // Show the icon again if it exists
      const iconElement = component.element.querySelector(`.${component.getClass('button-icon')}`);
      if (iconElement instanceof HTMLElement) {
        iconElement.style.display = '';
      }
      
      return this;
    };
    
    // Synchronous wrapper
    component.hideProgressSync = function() {
      this.hideProgress();
      return this;
    };
    
    component.setProgress = async function(value: number) {
      const p = await ensureProgress();
      p.setValue(value);
      return this;
    };
    
    // Synchronous wrapper
    component.setProgressSync = function(value: number) {
      this.setProgress(value);
      return this;
    };
    
    component.setIndeterminate = async function(indeterminate: boolean) {
      const p = await ensureProgress();
      p.setIndeterminate(indeterminate);
      return this;
    };
    
    // Synchronous wrapper
    component.setIndeterminateSync = function(indeterminate: boolean) {
      this.setIndeterminate(indeterminate);
      return this;
    };
    
    component.setLoading = async function(loading: boolean, text?: string) {
      if (loading && !isLoading) {
        // Store original text if we have setText method
        if (this.setText && this.getText) {
          originalText = this.getText();
        }
        isLoading = true;
        await this.showProgress();
        this.disable();
        if (text && this.setText) {
          this.setText(text);
        }
      } else if (!loading && isLoading) {
        isLoading = false;
        await this.hideProgress();
        this.enable();
        if (text && this.setText) {
          this.setText(text);
        } else if (originalText && this.setText) {
          this.setText(originalText);
        }
      }
      return this;
    };
    
    // Synchronous wrapper - most commonly used
    component.setLoadingSync = function(loading: boolean, text?: string) {
      this.setLoading(loading, text);
      return this;
    };
    
    // Update destroy to clean up progress if it was created
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        if (progress) {
          progress.destroy();
        }
        if (progress && progress.element.parentNode) {
          progress.element.parentNode.removeChild(progress.element);
        }
        originalDestroy();
      };
    }
    
    // If showProgress is true, initialize immediately
    if (config.showProgress) {
      ensureProgress().then(() => {
        component.showProgress();
      });
    }
    
    return component;
  }; 