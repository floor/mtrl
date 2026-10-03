// The server-style HTML scripts/check-preupgrade.ts renders for each element:
// the host and its light DOM, as a framework adapter's server render emits it.
// One case per element in its default configuration, then the attribute
// variants whose box the pre-upgrade styles cover.

const ICON = "<svg viewBox='0 0 24 24'><path d='M4 4h16v16H4z'/></svg>";
/** A 4:3 image that needs no request. */
const IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23888'/%3E%3C/svg%3E";

export interface PreupgradeCase {
  /** The element, as `elements` keys it in kebab case (`icon-button`). */
  element: string;
  /** The variant, or "default". */
  variant: string;
  html: string;
}

const c = (element: string, variant: string, html: string): PreupgradeCase => ({ element, variant, html });

export const cases: PreupgradeCase[] = [
  c("button", "default", `<m-button>Save</m-button>`),
  c("button", "size=xs", `<m-button size="xs">Save</m-button>`),
  c("button", "size=m", `<m-button size="m">Save</m-button>`),
  c("button", "size=l", `<m-button size="l">Save</m-button>`),
  c("button", "size=xl", `<m-button size="xl">Save</m-button>`),
  c("button", "variant=outlined", `<m-button variant="outlined">Save</m-button>`),
  c("button", "variant=text", `<m-button variant="text">Save</m-button>`),
  c("button", "icon", `<m-button icon="${ICON}">Save</m-button>`),
  c("button", "size=m icon", `<m-button size="m" icon="${ICON}">Save</m-button>`),
  c("button", "variant=tonal", `<m-button variant="tonal">Save</m-button>`),
  c("switch", "default", `<m-switch>Wi-Fi</m-switch>`),
  c("switch", "supporting-text", `<m-switch supporting-text="Saves power">Wi-Fi</m-switch>`),
  c("switch", "checked", `<m-switch checked>Wi-Fi</m-switch>`),
  c("tabs", "default", `<m-tabs value="a"><m-tab value="a">Flights</m-tab><m-tab value="b">Trips</m-tab><m-tab value="c">Explore</m-tab></m-tabs>`),
  c("tabs", "icon", `<m-tabs value="a"><m-tab value="a" icon="${ICON}">Flights</m-tab><m-tab value="b" icon="${ICON}">Trips</m-tab></m-tabs>`),
  c("progress", "default", `<m-progress value="40" aria-label="Upload"></m-progress>`),
  c("progress", "variant=circular", `<m-progress variant="circular" value="40" aria-label="Upload"></m-progress>`),
  c("loading-indicator", "default", `<m-loading-indicator aria-label="Loading"></m-loading-indicator>`),
  c("badge", "default", `<m-badge label="3"></m-badge>`),
  c("badge", "small", `<m-badge></m-badge>`),
  c("divider", "default", `<m-divider></m-divider>`),
  c("icon-button", "default", `<m-icon-button icon="${ICON}" aria-label="Favourite"></m-icon-button>`),
  c("icon-button", "size=m", `<m-icon-button size="m" icon="${ICON}" aria-label="Favourite"></m-icon-button>`),
  c("icon-button", "size=xs", `<m-icon-button size="xs" icon="${ICON}" aria-label="Favourite"></m-icon-button>`),
  c("icon-button", "width=wide", `<m-icon-button width="wide" icon="${ICON}" aria-label="Favourite"></m-icon-button>`),
  c("icon-button", "size=l width=narrow", `<m-icon-button size="l" width="narrow" icon="${ICON}" aria-label="Favourite"></m-icon-button>`),
  c("fab", "default", `<m-fab icon="${ICON}" aria-label="Add"></m-fab>`),
  c("fab", "size=large", `<m-fab size="large" icon="${ICON}" aria-label="Add"></m-fab>`),
  c("fab-menu", "default", `<m-fab-menu icon="${ICON}" aria-label="Compose"><m-fab-menu-item value="r">Reply</m-fab-menu-item><m-fab-menu-item value="f">Forward</m-fab-menu-item></m-fab-menu>`),
  c("fab-menu", "size=medium color=tertiary", `<m-fab-menu size="medium" color="tertiary" icon="${ICON}" aria-label="Compose"><m-fab-menu-item value="r">Reply</m-fab-menu-item><m-fab-menu-item value="f">Forward</m-fab-menu-item></m-fab-menu>`),
  c("extended-fab", "default", `<m-extended-fab icon="${ICON}">Compose</m-extended-fab>`),
  c("extended-fab", "size=large", `<m-extended-fab size="large" icon="${ICON}">Compose</m-extended-fab>`),
  c("checkbox", "default", `<m-checkbox>Agree</m-checkbox>`),
  c("checkbox", "checked label-position=start", `<m-checkbox checked label-position="start">Agree</m-checkbox>`),
  c("slider", "default", `<m-slider value="40" aria-label="Volume"></m-slider>`),
  c("textfield", "default", `<m-textfield label="Name"></m-textfield>`),
  c("textfield", "variant=outlined", `<m-textfield variant="outlined" label="Name"></m-textfield>`),
  c("textfield", "supporting-text", `<m-textfield label="Name" supporting-text="As on your passport"></m-textfield>`),
  // FLO-300: the supporting text row under the field, reserved before upgrade
  c("textfield", "outlined supporting-text", `<m-textfield variant="outlined" label="Name" supporting-text="As on your passport"></m-textfield>`),
  c("textfield", "maxlength (counter)", `<m-textfield label="Name" maxlength="20"></m-textfield>`),
  c("textfield", "compact supporting-text", `<m-textfield density="compact" label="Name" supporting-text="Help"></m-textfield>`),
  c("textfield", "value", `<m-textfield label="Name" value="Ada"></m-textfield>`),
  c("textfield", "empty password", `<m-textfield type="password"></m-textfield>`),
  c("textfield", "password value", `<m-textfield type="password" value="secret"></m-textfield>`),
  c("textfield", "hidden value", `<m-textfield type="hidden" value="synthetic-token"></m-textfield>`),
  c("textfield", "density=compact", `<m-textfield density="compact" label="Name"></m-textfield>`),
  c("textfield", "outlined compact value", `<m-textfield variant="outlined" density="compact" label="Name" value="Ada"></m-textfield>`),
  c("textfield", "width set by the page", `<m-textfield label="Name" style="width:300px"></m-textfield>`),
  c("radios", "default", `<m-radios value="a" aria-label="Size"><m-radio value="a">Small</m-radio><m-radio value="b">Medium</m-radio><m-radio value="c">Large</m-radio></m-radios>`),
  c("radios", "direction=horizontal", `<m-radios direction="horizontal" value="a" aria-label="Size"><m-radio value="a">Small</m-radio><m-radio value="b">Medium</m-radio><m-radio value="c">Large</m-radio></m-radios>`),
  c("navigation-rail", "default", `<m-navigation-rail value="inbox" aria-label="Main"><m-navigation-rail-item value="inbox" icon="${ICON}">Inbox</m-navigation-rail-item><m-navigation-rail-item value="sent" icon="${ICON}">Sent</m-navigation-rail-item><m-navigation-rail-item value="starred" icon="${ICON}">Starred</m-navigation-rail-item></m-navigation-rail>`),
  c("drawer", "default", `<m-drawer value="inbox" aria-label="Mail"><m-drawer-item value="inbox" icon="${ICON}">Inbox</m-drawer-item><m-drawer-item value="sent" icon="${ICON}">Sent</m-drawer-item></m-drawer>`),
  c("drawer", "open", `<m-drawer open value="inbox" aria-label="Mail"><m-drawer-item value="inbox" icon="${ICON}">Inbox</m-drawer-item><m-drawer-item value="sent" icon="${ICON}">Sent</m-drawer-item></m-drawer>`),
  c("top-app-bar", "default", `<m-top-app-bar>Title</m-top-app-bar>`),
  c("top-app-bar", "type=medium", `<m-top-app-bar type="medium">Title</m-top-app-bar>`),
  c("top-app-bar", "type=center", `<m-top-app-bar type="center">Title</m-top-app-bar>`),
  c("top-app-bar", "type=large", `<m-top-app-bar type="large">Title</m-top-app-bar>`),
  c("bottom-app-bar", "default", `<m-bottom-app-bar><m-icon-button icon="${ICON}" aria-label="Search"></m-icon-button></m-bottom-app-bar>`),
  c("toolbar", "default", `<m-toolbar aria-label="Actions"><m-icon-button icon="${ICON}" aria-label="Archive"></m-icon-button><m-icon-button icon="${ICON}" aria-label="Delete"></m-icon-button><m-icon-button icon="${ICON}" aria-label="Label"></m-icon-button></m-toolbar>`),
  c("toolbar", "variant=floating", `<m-toolbar variant="floating" aria-label="Formatting"><m-icon-button icon="${ICON}" aria-label="Bold"></m-icon-button><m-icon-button icon="${ICON}" aria-label="Italic"></m-icon-button></m-toolbar>`),
  c("button-group", "default", `<m-button-group aria-label="Actions"><m-button-group-item value="a">One</m-button-group-item><m-button-group-item value="b">Two</m-button-group-item><m-button-group-item value="c">Three</m-button-group-item></m-button-group>`),
  c("chips", "default", `<m-chips aria-label="Diet"><m-chip value="veg">Vegetarian</m-chip><m-chip value="gf">Gluten free</m-chip></m-chips>`),
  c("chips", "wrapping", `<m-chips aria-label="Diet"><m-chip value="veg">Vegetarian</m-chip><m-chip value="gf">Gluten free</m-chip><m-chip value="df">Dairy free</m-chip><m-chip value="nf">Nut free</m-chip><m-chip value="h">Halal</m-chip></m-chips>`),
  c("list", "default", `<m-list value="b" aria-label="Fruit"><m-list-item value="a">Apple</m-list-item><m-list-item value="b">Banana</m-list-item><m-list-item value="c">Cherry</m-list-item></m-list>`),
  c("list", "two-line, divider, subheader", `<m-list aria-label="Mail"><m-list-item kind="subheader">Today</m-list-item><m-list-item value="a" supporting-text="Lunch?">Ada</m-list-item><m-list-item kind="divider"></m-list-item><m-list-item value="b" overline="Work">Grace</m-list-item></m-list>`),
  c("card", "default", `<m-card headline="Title" subhead="Subhead">Supporting text for the card.</m-card>`),
  c("card", "variant=outlined headline", `<m-card variant="outlined" headline="Title">Supporting text for the card.</m-card>`),
  c("carousel", "default", `<m-carousel aria-label="Photos" style="height:200px"><m-carousel-item src="${IMAGE}" alt="One">One</m-carousel-item><m-carousel-item src="${IMAGE}" alt="Two">Two</m-carousel-item><m-carousel-item src="${IMAGE}" alt="Three">Three</m-carousel-item></m-carousel>`),
  c("menu", "default", `<m-menu anchor="nowhere"><m-menu-item value="a">Copy</m-menu-item><m-menu-item value="b">Paste</m-menu-item></m-menu>`),
  c("select", "default", `<m-select label="Pet" value="cat"><m-select-option value="cat">Cat</m-select-option><m-select-option value="dog">Dog</m-select-option></m-select>`),
  c("select", "variant=outlined", `<m-select variant="outlined" label="Pet"><m-select-option value="cat">Cat</m-select-option></m-select>`),
  c("select", "supporting-text", `<m-select label="Pet" supporting-text="Pick one"><m-select-option value="cat">Cat</m-select-option></m-select>`),
  c("split-button", "default", `<m-split-button>Send<m-menu-item value="later">Send later</m-menu-item></m-split-button>`),
  c("tooltip", "default", `<m-tooltip for="nowhere">Help text</m-tooltip>`),
  c("snackbar", "default", `<m-snackbar>Message sent</m-snackbar>`),
  c("dialog", "default", `<m-dialog headline="Discard draft?">Your changes will be lost.</m-dialog>`),
  c("dialog", "open", `<m-dialog open headline="Discard draft?">Your changes will be lost.</m-dialog>`),
  c("bottom-sheet", "default", `<m-bottom-sheet headline="Share">Content</m-bottom-sheet>`),
  c("side-sheet", "default", `<m-side-sheet headline="Filters">Content</m-side-sheet>`),
  c("datepicker", "default", `<m-datepicker label="Due" value="2026-09-10"></m-datepicker>`),
  c("timepicker", "default", `<m-timepicker label="Alarm" value="07:30"></m-timepicker>`),
  c("search", "default", `<m-search placeholder="Search" aria-label="Search"><m-search-suggestion value="apple">Apple</m-search-suggestion></m-search>`),
  c("search", "value", `<m-search placeholder="Search" value="apple" aria-label="Search"></m-search>`),
];
