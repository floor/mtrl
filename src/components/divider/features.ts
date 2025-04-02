// src/components/divider/features.ts
import { BaseComponent, ElementComponent } from '../../core/compose';
import { DividerConfig } from './config';
import { DividerComponent } from './types';

/**
 * Adds orientation functionality to divider
 * 
 * Higher-order function that enhances a component with the ability to be
 * oriented horizontally (default) or vertically. Controls the appropriate
 * CSS classes and dimensional styling based on orientation.
 * 
 * @param config - Divider configuration
 * @returns Function that enhances a component with orientation capabilities
 * 
 * @internal
 */
export const withOrientation = (config: DividerConfig) => 
  <C extends ElementComponent & BaseComponent>(component: C): C & Partial<DividerComponent> => {
    const orientation = config.orientation || 'horizontal';
    
    // Apply the orientation class
    component.element.classList.add(`${component.getClass('divider')}--${orientation}`);
    
    // Set styles based on orientation and thickness
    const thickness = config.thickness || 1;
    
    if (orientation === 'horizontal') {
      component.element.style.height = `${thickness}px`;
      component.element.style.width = '100%';
    } else {
      component.element.style.width = `${thickness}px`;
      component.element.style.height = '100%';
    }
    
    return {
      ...component,
      
      getOrientation() {
        return orientation;
      },
      
      setOrientation(newOrientation: 'horizontal' | 'vertical') {
        // Remove existing orientation class
        component.element.classList.remove(`${component.getClass('divider')}--${orientation}`);
        
        // Add new orientation class
        component.element.classList.add(`${component.getClass('divider')}--${newOrientation}`);
        
        // Update styles
        if (newOrientation === 'horizontal') {
          component.element.style.height = `${thickness}px`;
          component.element.style.width = '100%';
          
          // Reset vertical styles
          component.element.style.marginTop = '';
          component.element.style.marginBottom = '';
        } else {
          component.element.style.width = `${thickness}px`;
          component.element.style.height = '100%';
          
          // Reset horizontal styles
          component.element.style.marginLeft = '';
          component.element.style.marginRight = '';
        }
        
        return this as unknown as DividerComponent;
      }
    };
  };

/**
 * Adds inset functionality to divider
 * 
 * Higher-order function that enhances a component with the ability to have
 * customized inset spacing. Supports three variants (full-width, inset, middle-inset)
 * and allows fine-grained control over start and end insets.
 * 
 * Insets are applied as margins in the appropriate direction based on orientation:
 * - For horizontal dividers: left/right margins
 * - For vertical dividers: top/bottom margins
 * 
 * @param config - Divider configuration
 * @returns Function that enhances a component with inset capabilities
 * 
 * @internal
 */
export const withInset = (config: DividerConfig) => 
  <C extends ElementComponent & Partial<DividerComponent>>(component: C): C & Partial<DividerComponent> => {
    const variant = config.variant || 'full-width';
    const orientation = config.orientation || 'horizontal';
    
    // Apply inset styles based on variant
    if (variant === 'inset' || variant === 'middle-inset') {
      if (orientation === 'horizontal') {
        const insetStart = config.insetStart !== undefined ? config.insetStart : 16;
        const insetEnd = config.insetEnd !== undefined ? config.insetEnd : (variant === 'middle-inset' ? 16 : 0);
        
        component.element.style.marginLeft = `${insetStart}px`;
        component.element.style.marginRight = `${insetEnd}px`;
      } else {
        const insetStart = config.insetStart !== undefined ? config.insetStart : 16;
        const insetEnd = config.insetEnd !== undefined ? config.insetEnd : (variant === 'middle-inset' ? 16 : 0);
        
        component.element.style.marginTop = `${insetStart}px`;
        component.element.style.marginBottom = `${insetEnd}px`;
      }
    }
    
    return {
      ...component,
      
      getVariant() {
        return variant as 'full-width' | 'inset' | 'middle-inset';
      },
      
      setVariant(newVariant: 'full-width' | 'inset' | 'middle-inset') {
        // Remove existing variant class
        component.element.classList.remove(`${component.getClass('divider')}--${variant}`);
        
        // Add new variant class
        component.element.classList.add(`${component.getClass('divider')}--${newVariant}`);
        
        // Update styles
        const currentOrientation = component.getOrientation ? component.getOrientation() : orientation;
        
        if (newVariant === 'full-width') {
          if (currentOrientation === 'horizontal') {
            component.element.style.marginLeft = '';
            component.element.style.marginRight = '';
          } else {
            component.element.style.marginTop = '';
            component.element.style.marginBottom = '';
          }
        } else {
          const insetStart = config.insetStart !== undefined ? config.insetStart : 16;
          const insetEnd = config.insetEnd !== undefined ? config.insetEnd : (newVariant === 'middle-inset' ? 16 : 0);
          
          if (currentOrientation === 'horizontal') {
            component.element.style.marginLeft = `${insetStart}px`;
            component.element.style.marginRight = `${insetEnd}px`;
          } else {
            component.element.style.marginTop = `${insetStart}px`;
            component.element.style.marginBottom = `${insetEnd}px`;
          }
        }
        
        return this as unknown as DividerComponent;
      },
      
      setInset(insetStart?: number, insetEnd?: number) {
        const currentOrientation = component.getOrientation ? component.getOrientation() : orientation;
        const currentVariant = component.getVariant ? component.getVariant() : variant;
        
        if (currentVariant !== 'full-width') {
          if (currentOrientation === 'horizontal') {
            if (insetStart !== undefined) {
              component.element.style.marginLeft = `${insetStart}px`;
            }
            
            if (insetEnd !== undefined) {
              component.element.style.marginRight = `${insetEnd}px`;
            }
          } else {
            if (insetStart !== undefined) {
              component.element.style.marginTop = `${insetStart}px`;
            }
            
            if (insetEnd !== undefined) {
              component.element.style.marginBottom = `${insetEnd}px`;
            }
          }
        }
        
        return this as unknown as DividerComponent;
      }
    };
  };

/**
 * Adds style customization to divider
 * 
 * Higher-order function that enhances a component with visual customization
 * capabilities, including:
 * - Custom thickness (height for horizontal, width for vertical dividers)
 * - Custom colors (background-color CSS property)
 * 
 * These styling options allow dividers to be visually adapted to different
 * design requirements while maintaining Material Design principles.
 * 
 * @param config - Divider configuration
 * @returns Function that enhances a component with style capabilities
 * 
 * @internal
 */
export const withStyle = (config: DividerConfig) => 
  <C extends ElementComponent & Partial<DividerComponent>>(component: C): C & Partial<DividerComponent> => {
    // Apply custom color if provided
    if (config.color) {
      component.element.style.backgroundColor = config.color;
    }
    
    // Apply thickness
    const thickness = config.thickness || 1;
    const orientation = config.orientation || 'horizontal';
    
    if (orientation === 'horizontal') {
      component.element.style.height = `${thickness}px`;
    } else {
      component.element.style.width = `${thickness}px`;
    }
    
    return {
      ...component,
      
      setThickness(newThickness: number) {
        const currentOrientation = component.getOrientation ? component.getOrientation() : orientation;
        
        if (currentOrientation === 'horizontal') {
          component.element.style.height = `${newThickness}px`;
        } else {
          component.element.style.width = `${newThickness}px`;
        }
        
        return this as unknown as DividerComponent;
      },
      
      setColor(color: string) {
        component.element.style.backgroundColor = color;
        return this as unknown as DividerComponent;
      }
    };
  };