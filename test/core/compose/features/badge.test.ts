// test/core/compose/features/badge.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withBadge } from '../../../../src/core/compose/features/badge';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

// Create a mock element for our badge
const mockBadgeElement = document.createElement('div');

// Mock the createBadge function
const createBadgeMock = (config) => ({
  config,
  element: mockBadgeElement
});

// Use Bun's mock functionality
mock('../../../../src/components/badge', () => ({
  default: createBadgeMock
}));

describe('withBadge', () => {
  let component;

  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `${PREFIX}-${name}`
    };
  });

  test('should not add badge if content is not provided', () => {
    const config = { prefix: PREFIX };
    const enhancedComponent = withBadge(config)(component);
    
    expect(enhancedComponent.badge).toBeUndefined();
  });

  test('should add badge if content is provided', () => {
    const config = { 
      prefix: PREFIX,
      badge: '5'
    };
    const enhancedComponent = withBadge(config)(component);
    
    expect(enhancedComponent.badge).toBeDefined();
    expect(enhancedComponent.badge.config.content).toBe('5');
    expect(enhancedComponent.badge.config.standalone).toBe(false);
    expect(enhancedComponent.badge.config.target).toBe(component.element);
  });

  test('should use default position if not specified', () => {
    const config = { 
      prefix: PREFIX,
      badge: '10'
    };
    const enhancedComponent = withBadge(config)(component);
    
    expect(enhancedComponent.badge.config.position).toBe('top-right');
  });

  test('should use custom position if specified', () => {
    const config = { 
      prefix: PREFIX,
      badge: '10',
      badgeConfig: {
        position: 'bottom-left'
      }
    };
    const enhancedComponent = withBadge(config)(component);
    
    expect(enhancedComponent.badge.config.position).toBe('bottom-left');
  });

  test('should pass all badge configuration options', () => {
    const config = { 
      prefix: PREFIX,
      badge: '10',
      badgeConfig: {
        color: 'secondary',
        size: 'small',
        max: 99
      }
    };
    const enhancedComponent = withBadge(config)(component);
    
    expect(enhancedComponent.badge.config.color).toBe('secondary');
    expect(enhancedComponent.badge.config.size).toBe('small');
    expect(enhancedComponent.badge.config.max).toBe(99);
  });
});