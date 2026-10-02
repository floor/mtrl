// src/components/tabs/responsive.ts
import { TabsComponent, TabComponent } from './types';

/**
 * Breakpoints for responsive behavior
 */
export const RESPONSIVE_BREAKPOINTS = {
  /** Small screens (mobile) */
  SMALL: 600,
  /** Medium screens (tablet) */
  MEDIUM: 904,
  /** Large screens (desktop) */
  LARGE: 1240
};

/**
 * Configuration for responsive behavior
 */
export interface ResponsiveConfig {
  /** Whether to enable responsive behavior */
  responsive?: boolean;
  /** Options for small screens */
  smallScreen?: {
    /**
     * Layout below the small breakpoint: `icon-only` hides the labels of tabs
     * that have an icon (the label still names the tab), `text-only` hides the
     * icons of tabs that have a label, `icon-and-text` keeps every tab as built.
     * @default 'icon-only'
     */
    layout?: 'icon-only' | 'text-only' | 'icon-and-text';
  };
  /**
   * Breakpoints. Only `small` switches the layout; `medium` and `large` are
   * accepted and unused.
   */
  breakpoints?: {
    small?: number;
    medium?: number;
    large?: number;
  };
}

/**
 * Tabs component carrying the resize observer used for cleanup
 */
type ResponsiveTabs = TabsComponent & { _resizeObserver?: ResizeObserver };

type Layout = 'icon-only' | 'text-only' | 'icon-and-text';
const LAYOUTS: Layout[] = ['icon-only', 'text-only', 'icon-and-text'];

/** The layout a tab's own content gives it, as the tab computes it. */
const naturalLayout = (tab: TabComponent): Layout =>
  tab.getIcon() && tab.getText() ? 'icon-and-text' : tab.getIcon() ? 'icon-only' : 'text-only';

/**
 * Enhances tabs with responsive behavior.
 *
 * Every update reads the group's tabs and each tab's content as they are then,
 * so tabs added later and labels or icons changed later follow the layout; it
 * held a snapshot taken at setup and restored layouts from it. FLO-232.
 * @param tabs - The tabs component to enhance
 * @param config - Responsive configuration
 */
export const setupResponsiveBehavior = (
  tabs: TabsComponent, 
  config: ResponsiveConfig = {}
): void => {
  if (config.responsive === false) return;
  
  const small = config.breakpoints?.small || RESPONSIVE_BREAKPOINTS.SMALL;
  const smallLayout: Layout = config.smallScreen?.layout || 'icon-only';
  let isSmall = false;

  /** The layout a tab takes now: its own, or the small-screen one it can show. */
  const layoutFor = (tab: TabComponent): Layout => {
    const natural = naturalLayout(tab);
    if (!isSmall || natural !== 'icon-and-text' || smallLayout === 'icon-and-text') return natural;
    return smallLayout;
  };

  const apply = (tab: TabComponent): void => {
    const layout = layoutFor(tab);
    for (const name of LAYOUTS) {
      tab.element.classList.toggle(`${tab.getClass('tab')}--${name}`, name === layout);
    }
  };

  // A tab recomputes its own layout when its text or icon changes; the
  // responsive one is applied again after it.
  const followed = new WeakSet<TabComponent>();
  const follow = (tab: TabComponent): void => {
    if (followed.has(tab)) return;
    followed.add(tab);
    const own = tab.updateLayoutStyle.bind(tab);
    tab.updateLayoutStyle = () => {
      own();
      apply(tab);
    };
  };

  /**
   * Update tabs layout based on screen size
   */
  const updateLayout = (): void => {
    isSmall = window.innerWidth < small;
    tabs.getTabs().forEach(tab => {
      follow(tab);
      apply(tab);
    });
    tabs.element.classList.toggle(`${tabs.getClass('tabs')}--responsive-small`, isSmall);
  };
  
  // Initial layout update
  updateLayout();

  // Tabs added later take the current layout at once.
  for (const method of ['addTab', 'add'] as const) {
    const original = tabs[method] as (...args: unknown[]) => unknown;
    (tabs as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      const result = original.apply(tabs, args);
      updateLayout();
      return result;
    };
  }
  
  // Set up resize listener
  const resizeObserver = new ResizeObserver(updateLayout);
  resizeObserver.observe(document.body);
  
  // Store the observer on the component for cleanup
  const host: ResponsiveTabs = tabs;
  host._resizeObserver = resizeObserver;

  // Enhance destroy method to clean up observer
  const originalDestroy = tabs.destroy;
  tabs.destroy = function(this: ResponsiveTabs) {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    originalDestroy.call(this);
  };
};