// src/components/tabs/tab.ts
import { processClassNames, type BaseComponentConfig } from "../../core/config/component";
import { registerTab, syncTabControls, tabIdFor } from "./utils";
import { pipe } from "../../core/compose";
import { createBase } from "../../core/compose/component";
import type { BaseComponent, ElementComponent } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import type { EventComponent, LifecycleComponent } from "../../core/compose/features";
import type { BadgeComponent } from "../badge";
import { TabConfig, TabComponent, TabEvents } from "./types";
import { TAB_LAYOUT } from "./constants";
import { createTabConfig } from "./config";
import createButton from "../button";
import createBadge from "../badge";

/**
 * Creates a new Tab component following MD3 guidelines
 * @param {TabConfig} config - Tab configuration object
 * @returns {TabComponent} Tab component instance
 */
/**
 * Point a tab at its panel, but only when that panel exists.
 *
 * The component creates no panels; a page supplies them. Writing
 * `aria-controls` regardless left every tab referencing an id that resolves to
 * nothing, which assistive technology reports as a broken relationship. When
 * the panel appears later, `updateTabPanels` links it then.
 */


export const createTab = (config: TabConfig = {}): TabComponent => {
  const baseConfig = createTabConfig(config);

  try {
    // Create base component with events and lifecycle; it takes the button's element below
    const baseComponent: BaseComponent &
      EventComponent &
      LifecycleComponent &
      Partial<Pick<ElementComponent, "element">> = pipe(
      createBase,
      withEvents(),
      withLifecycle()
    )(baseConfig);

    // Create a button for the tab
    const button = createButton({
      text: baseConfig.text,
      icon: baseConfig.icon,
      iconSize: baseConfig.iconSize,
      disabled: baseConfig.disabled,
      ariaLabel: baseConfig.ariaLabel,
      ripple: baseConfig.ripple !== false, // Enable ripple by default
      rippleConfig: {
        duration: 400,
        ...(baseConfig.rippleConfig || {}),
      },
      value: baseConfig.value,
      prefix: baseConfig.prefix,
      variant: "text", // MD3 tabs use text button style
      class: [
        `${baseConfig.prefix}-tab`,
        processClassNames((baseConfig as BaseComponentConfig).className || ""),
      ].filter(Boolean).join(" "),
    });

    // Use the button element as our element
    baseComponent.element = button.element;

    // Set up tab accessibility attributes
    baseComponent.element.setAttribute("role", "tab");
    baseComponent.element.setAttribute(
      "aria-selected",
      baseConfig.state === "active" ? "true" : "false"
    );

    // For better accessibility
    if (baseConfig.value) {
      // The group id makes this unique across tablists. Without it two
      // groups sharing a value produced duplicate ids. FLO-229.
      baseComponent.element.setAttribute(
        "id",
        tabIdFor(baseConfig.groupId ?? "", baseConfig.value)
      );
      registerTab(baseComponent.element, baseConfig.groupId ?? "", baseConfig.value);
      // `aria-controls` is linked by `updateTabPanels` once a panel with that
      // id is actually in the document. It used to be written here
      // unconditionally, so every tab pointed at a panel the component never
      // creates — a dangling reference unless the page happened to supply one,
      // which is an ARIA conformance break rather than a cosmetic detail.
      syncTabControls(baseComponent.element);
    }

    // Add active state if specified in config
    if (baseConfig.state === "active") {
      baseComponent.element.classList.add(
        `${baseComponent.getClass("tab")}--active`
      );
    }

    // Forward button events to our component
    button.on("click", (event: unknown) => {
      if (baseComponent.emit) {
        baseComponent.emit("click", event);
      }
    });
    // TAB_EVENTS declares focus and blur; nothing emitted them (FLO-264).
    for (const type of ["focus", "blur"] as const) {
      button.element.addEventListener(type, (event) => baseComponent.emit?.(type, event));
    }

    // Create the tab component with enhanced API
    const tab: TabComponent = {
      ...baseComponent,
      button,
      element: button.element,

      // Event methods: `this` is the tab the method is called on
      on<K extends keyof TabEvents>(event: K, handler: TabEvents[K]) {
        baseComponent.on(event, handler);
        return this;
      },

      off<K extends keyof TabEvents>(event: K, handler: TabEvents[K]) {
        baseComponent.off(event, handler);
        return this;
      },

      // Badge support. Undefined rather than null: `badge?: BadgeComponent`
      // is what the type says, and every read here is a truthiness check.
      badge: undefined as BadgeComponent | undefined,

      // Tab state methods
      getValue() {
        return button.getValue();
      },

      setValue(value) {
        const safeValue = value || "";
        button.setValue(safeValue);

        // Update accessibility attributes
        this.element.setAttribute(
          "id",
          tabIdFor(baseConfig.groupId ?? "", safeValue)
        );
        registerTab(this.element, baseConfig.groupId ?? "", safeValue);
        syncTabControls(this.element);

        return this;
      },

      activate() {
        this.element.classList.add(`${this.getClass("tab")}--active`);
        this.element.setAttribute("aria-selected", "true");

        // Dispatch event for screen readers
        const event = new CustomEvent("tab:activated", {
          bubbles: true,
          detail: { value: this.getValue() },
        });
        this.element.dispatchEvent(event);

        return this;
      },

      deactivate() {
        this.element.classList.remove(`${this.getClass("tab")}--active`);
        this.element.setAttribute("aria-selected", "false");
        return this;
      },

      isActive() {
        return this.element.classList.contains(
          `${this.getClass("tab")}--active`
        );
      },

      enable() {
        button.enable();
        this.element.removeAttribute("aria-disabled");
        return this;
      },

      disable() {
        button.disable();
        this.element.setAttribute("aria-disabled", "true");
        return this;
      },

      isDisabled() {
        return button.isDisabled();
      },

      setText(content) {
        button.setText(content);
        this.updateLayoutStyle();
        return this;
      },

      getText() {
        return button.getText();
      },

      setIcon(icon) {
        button.setIcon(icon);
        this.updateLayoutStyle();
        return this;
      },

      getIcon() {
        return button.getIcon();
      },

      // Badge methods
      setBadge(content) {
        if (!this.badge) {
          const badgeConfig = {
            label: content,
            standalone: false,
            target: this.element,
            prefix: baseConfig.prefix,
            ...(baseConfig.badgeConfig || {}),
          };

          this.badge = createBadge(badgeConfig);
        } else {
          this.badge.setContent(content);
          this.badge.show();
        }

        // Add badge presence attribute for potential styling
        this.element.setAttribute("data-has-badge", "true");

        return this;
      },

      getBadge() {
        return this.badge ? this.badge.getContent() : "";
      },

      showBadge() {
        if (this.badge) {
          this.badge.show();
          this.element.setAttribute("data-has-badge", "true");
        }
        return this;
      },

      hideBadge() {
        if (this.badge) {
          this.badge.hide();
          this.element.setAttribute("data-has-badge", "false");
        }
        return this;
      },

      getBadgeComponent() {
        return this.badge;
      },

      destroy() {
        if (this.badge) {
          this.badge.destroy();
        }

        if (button.destroy) {
          button.destroy();
        }

        baseComponent.lifecycle.destroy();
      },

      updateLayoutStyle() {
        const hasText = !!this.getText();
        const hasIcon = !!this.getIcon();
        let layoutClass = "";

        if (hasText && hasIcon) {
          layoutClass = TAB_LAYOUT.ICON_AND_TEXT;
        } else if (hasIcon) {
          layoutClass = TAB_LAYOUT.ICON_ONLY;
        } else {
          layoutClass = TAB_LAYOUT.TEXT_ONLY;
        }

        // Remove all existing layout classes
        Object.values(TAB_LAYOUT).forEach((layout) => {
          this.element.classList.remove(`${this.getClass("tab")}--${layout}`);
        });

        // Add the appropriate layout class
        this.element.classList.add(`${this.getClass("tab")}--${layoutClass}`);
        // An icon-only tab is named by `ariaLabel`; a visually hidden label names
        // the rest. What stood here could never set a name (icon-only means no
        // text) and removed the one `ariaLabel` gave. FLO-263.
      },
    };

    // Add badge if specified in config
    if (baseConfig.badge !== undefined) {
      tab.setBadge(baseConfig.badge);
    }

    // Initialize layout style based on content
    tab.updateLayoutStyle();

    return tab;
  } catch (error) {
    console.error("Tab creation error:", error);
    throw new Error(`Failed to create tab: ${(error as Error).message}`);
  }
};
