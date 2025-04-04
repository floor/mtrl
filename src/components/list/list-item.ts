// src/components/list/list-item.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withDisabled } from '../../core/compose/features';
import { ListItemConfig } from './types';
import { createElement, getListClass } from './utils';

/**
 * Creates list item content based on configuration
 * 
 * Higher-order function that enhances a component with list item content structure
 * according to Material Design 3 guidelines. Handles the creation and arrangement of
 * item elements like headline text, supporting text, leading/trailing components, etc.
 * 
 * @param {ListItemConfig} config - List item configuration
 * @returns {Function} Function that enhances a component with list item content
 * 
 * @internal
 */
const withItemContent = (config: ListItemConfig) => (component: any): any => {
  const { element } = component;
  const prefix = config.prefix || PREFIX;
  const isVertical = config.layout === 'vertical';

  // Create content container
  const content = createElement('div', `${prefix}-${getListClass('ITEM_CONTENT')}`);

  // Add leading content (icon/avatar)
  if (config.leading) {
    const leading = createElement('div', `${prefix}-${getListClass('ITEM_LEADING')}`);
    if (typeof config.leading === 'string') {
      leading.innerHTML = config.leading;
    } else {
      leading.appendChild(config.leading);
    }
    element.appendChild(leading);
  }

  // Text wrapper for proper alignment
  const textWrapper = createElement('div', `${prefix}-${getListClass('ITEM_TEXT')}`);

  // Add overline text (vertical only)
  if (isVertical && config.overline) {
    const overline = createElement('div', `${prefix}-${getListClass('ITEM_OVERLINE')}`, config.overline);
    textWrapper.appendChild(overline);
  }

  // Add headline (primary text)
  if (config.headline) {
    const headline = createElement('div', `${prefix}-${getListClass('ITEM_HEADLINE')}`, config.headline);
    textWrapper.appendChild(headline);
  }

  // Add supporting text (secondary text)
  if (config.supportingText) {
    const supporting = createElement('div', `${prefix}-${getListClass('ITEM_SUPPORTING')}`, config.supportingText);
    textWrapper.appendChild(supporting);
  }

  content.appendChild(textWrapper);

  // Add meta information (vertical only)
  if (isVertical && config.meta) {
    const meta = createElement('div', `${prefix}-${getListClass('ITEM_META')}`);
    if (typeof config.meta === 'string') {
      meta.textContent = config.meta;
    } else {
      meta.appendChild(config.meta);
    }
    content.appendChild(meta);
  }

  element.appendChild(content);

  // Add trailing content (icon/meta)
  if (config.trailing) {
    const trailing = createElement('div', `${prefix}-${getListClass('ITEM_TRAILING')}`);
    if (typeof config.trailing === 'string') {
      trailing.innerHTML = config.trailing;
    } else {
      trailing.appendChild(config.trailing);
    }
    element.appendChild(trailing);
  }

  // Handle selected state
  if (config.selected) {
    element.setAttribute('aria-selected', 'true');
    element.classList.add(`${prefix}-${getListClass('ITEM')}--selected`);
  }

  return component;
};

/**
 * Creates a list item component
 * 
 * Creates an individual list item with customizable content following Material Design 3
 * list item patterns. List items can have different layouts, content structures, and 
 * visual states (selected, disabled, etc.).
 * 
 * @param {ListItemConfig} config - List item configuration
 * @returns {Object} List item component instance
 * 
 * @category Components
 * 
 * @example
 * ```typescript
 * // Create a standard list item
 * const listItem = fListItem({
 *   id: 'user1',
 *   headline: 'Alex Johnson',
 *   supportingText: 'Software Engineer',
 *   leading: '<span class="material-icons">person</span>'
 * });
 * 
 * // Create a vertical layout list item with more content
 * const detailedItem = fListItem({
 *   id: 'event1',
 *   layout: 'vertical',
 *   overline: 'UPCOMING EVENT',
 *   headline: 'Team Meeting',
 *   supportingText: 'Discussion of quarterly goals',
 *   meta: 'Tomorrow, 2:00 PM',
 *   leading: '<span class="material-icons">event</span>',
 *   trailing: '<span class="material-icons">more_vert</span>'
 * });
 * 
 * // Create a selected list item
 * const selectedItem = fListItem({
 *   id: 'file1',
 *   headline: 'Project Proposal.pdf',
 *   supportingText: '2.4 MB',
 *   selected: true
 * });
 * ```
 */
const fListItem = (config: ListItemConfig): any => {
  const baseConfig = {
    ...config,
    componentName: 'list-item',
    prefix: PREFIX
  };

  const layoutClass = config.layout === 'vertical' ? 'vertical' : '';
  const combinedClass = `${layoutClass} ${config.class || ''}`.trim();

  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: 'div',
      role: config.role || 'listitem',
      componentName: 'list-item',
      className: combinedClass
    }),
    withDisabled(baseConfig),
    withItemContent(baseConfig)
  )(baseConfig);
};

export default fListItem;