// src/components/tabs/tab.ts
import { pipe } from "../../core/compose";
import { createBase } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { TabConfig, TabComponent } from "./types";
import { TAB_LAYOUT } from "./constants";
import { createTabConfig } from "./config";
import createButton from "../button";
import createBadge from "../badge";

/**
 * Creates a new Tab component following MD3 guidelines
 * @param {TabConfig} config - Tab configuration object
 * @returns {TabComponent} Tab component instance
 */
export const createTab = (config: TabConfig = {}): TabComponent => {
  const baseConfig = createTabConfig(config);

  try {
    // Create base component with events and lifecycle
    const baseComponent = pipe(
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
      ripple: baseConfig.ripple !== false, // Enable ripple by default
      rippleConfig: {
        duration: 400,
        timing: "cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: ["0.2", "0"],
        ...(baseConfig.rippleConfig || {}),
      },
      value: baseConfig.value,
      prefix: baseConfig.prefix,
      variant: "text", // MD3 tabs use text button style
      class: `${baseConfig.prefix}-tab`,
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
      baseComponent.element.setAttribute("id", `tab-${baseConfig.value}`);
      baseComponent.element.setAttribute(
        "aria-controls",
        `tabpanel-${baseConfig.value}`
      );
    }

    // Add active state if specified in config
    if (baseConfig.state === "active") {
      baseComponent.element.classList.add(
        `${baseComponent.getClass("tab")}--active`
      );
    }

    // Forward button events to our component
    button.on("click", (event) => {
      if (baseComponent.emit) {
        baseComponent.emit("click", event);
      }
    });

    // Create the tab component with enhanced API
    const tab: TabComponent = {
      ...baseComponent,
      button,
      element: button.element,

      // Badge support
      badge: null,

      // Tab state methods
      getValue() {
        return button.getValue();
      },

      setValue(value) {
        const safeValue = value || "";
        button.setValue(safeValue);

        // Update accessibility attributes
        this.element.setAttribute("id", `tab-${safeValue}`);
        this.element.setAttribute("aria-controls", `tabpanel-${safeValue}`);

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
            content,
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

        // Set appropriate aria-label when icon-only
        if (layoutClass === TAB_LAYOUT.ICON_ONLY && hasText) {
          this.element.setAttribute("aria-label", this.getText());
        } else {
          this.element.removeAttribute("aria-label");
        }
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
