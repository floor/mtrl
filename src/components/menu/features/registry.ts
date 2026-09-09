// src/components/menu/features/registry.ts

/**
 * Keeps track of which menu is open, so that opening one closes the last.
 *
 * A menu button's menu is dismissed once the interaction moves outside it, so
 * two menus should never be open together: the screen reader would be told
 * there are two, since both openers carry aria-expanded="true".
 *
 * Menus used to rely on the document click listener each open menu installs to
 * notice a click elsewhere and close. That never fired for another menu's
 * opener, because the opener stops the click from propagating, so menus piled
 * up. Announcing the open here does not depend on how the menu was opened,
 * which the click path could never cover: a menu opened by keyboard or by code
 * closes the previous one just the same.
 *
 * Only root menus take part. Submenus belong to their parent, which closes them.
 */

/** What the registry needs of a menu: a way to close it */
export interface RegisteredMenu {
  close: (event?: Event) => void;
}

let openMenu: RegisteredMenu | null = null;

/**
 * Announces that a menu has opened, closing whichever was open before.
 *
 * @param menu - The menu that is opening
 * @param event - The event that opened it, passed to the menu being closed
 */
export const menuOpened = (menu: RegisteredMenu, event?: Event): void => {
  const previous = openMenu;

  // Claim the slot before closing the old one: its close path calls back into
  // menuClosed, which must not clear the menu that is on its way in
  openMenu = menu;

  if (previous && previous !== menu) {
    previous.close(event);
  }
};

/**
 * Announces that a menu has closed. Closing a menu that is not the open one is
 * a no-op, which is what makes the call safe from any close path, including
 * destroy.
 *
 * @param menu - The menu that is closing
 */
export const menuClosed = (menu: RegisteredMenu): void => {
  if (openMenu === menu) openMenu = null;
};

/** The menu that is currently open, if any. Exported for tests */
export const currentlyOpenMenu = (): RegisteredMenu | null => openMenu;
