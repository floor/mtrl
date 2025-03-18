// src/components/list/list-item.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withDisabled } from '../../core/compose/features';
import { ListItemConfig } from './types';
import { createElement, getListClass } from './utils';

/**
 * Creates list item content based on configuration
 * @param {BaseComponent} component - Component to enhance
 * @param {ListItemConfig} config - List item configuration
 * @returns {BaseComponent} Enhanced component
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
 * @param {ListItemConfig} config - List item configuration
 * @returns {Object} List item component instance
 */
const createListItem = (config: ListItemConfig): any => {
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

export default createListItem;