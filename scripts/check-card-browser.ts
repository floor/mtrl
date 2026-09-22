/** Check the packed Card builders and enhancers against their shipped CSS. */
import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import type * as Card from "../src/components/card";

type CardWindow = Window & {
  cardParts: typeof Card;
  cards: ReturnType<typeof Card.default>[];
  loadingCard: ReturnType<ReturnType<typeof Card.withLoading>>;
};

export async function checkCard(page: Page, artifacts: string): Promise<void> {
  await page.setViewportSize({ width: 800, height: 1400 });
  await page.route("https://mtrl.test/card.svg", route => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#9bb9d0"/></svg>',
  }));
  await page.evaluate(() => {
    const state = window as unknown as CardWindow;
    const { default: createCard, createCardHeader, createCardContent, createCardMedia, createCardActions, withExpandable, withSwipeable } = state.cardParts;
    document.body.replaceChildren();
    document.body.style.cssText = "display:block;padding:24px;margin:0";
    document.documentElement.setAttribute("data-theme", "material");
    document.documentElement.setAttribute("data-theme-mode", "light");
    state.cards = [];
    for (const variant of ["elevated", "filled", "outlined"] as const) {
      const card = createCard({ variant });
      card.element.id = `card-${variant}`;
      card.element.style.cssText = "width:344px;margin-bottom:24px";
      card.addMedia(createCardMedia({ src: 'https://mtrl.test/card.svg', aspectRatio: "16:9", contain: true }));
      card.setHeader(createCardHeader({ title: "Old" }));
      card.setHeader(createCardHeader({ title: "Trip", subtitle: "Paris", avatar: "<img alt='' src='https://mtrl.test/card.svg'>", action: "<button>More</button>" }));
      card.addContent(createCardContent({ text: "A weekend away" }));
      card.setActions(createCardActions());
      const action = document.createElement("button"); action.textContent = "Share";
      card.setActions(createCardActions({ actions: [action], align: "end" }));
      const extra = document.createElement("div"); extra.id = `extra-${variant}`; extra.textContent = "More details";
      withExpandable({ expandableContent: extra })(card);
      withSwipeable({ onSwipeLeft: () => {}, onSwipeRight: () => {} })(card);
      state.cards.push(card);
      document.body.append(card.element);
    }
  });
  await page.waitForFunction(() => [...document.querySelectorAll(".mtrl-card img")].every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0));
  const root = page.locator("#card-elevated");
  assert.equal(await root.locator(".mtrl-card__header").count(), 1);
  assert.equal(await root.locator(".mtrl-card__actions").count(), 1);
  const styles = await root.evaluate(element => {
    const style = (selector: string) => getComputedStyle(element.querySelector(selector)!);
    return {
      header: style(".mtrl-card__header").display,
      title: style(".mtrl-card__header-title").fontSize,
      subtitle: style(".mtrl-card__header-subtitle").fontSize,
      avatar: style(".mtrl-card__header-avatar img").width,
      padding: style(".mtrl-card__content").padding,
      actions: style(".mtrl-card__actions").display,
      alignment: style(".mtrl-card__actions").justifyContent,
      image: style(".mtrl-card__media-img").objectFit,
      expand: style(".mtrl-card__expand-button").display,
      swipe: style(".mtrl-card__swipe-left-action").position,
    };
  });
  assert.deepEqual(styles, { header: "flex", title: "22px", subtitle: "14px", avatar: "40px", padding: "16px", actions: "flex", alignment: "flex-end", image: "contain", expand: "flex", swipe: "absolute" });
  const media = await root.locator(".mtrl-card__media").boundingBox();
  assert(media && Math.abs(media.width / media.height - 16 / 9) < 0.01);
  await root.locator(".mtrl-card__expand-button").click();
  assert.equal(await root.locator(".mtrl-card__expandable-content").isVisible(), true);
  assert.equal(await root.locator(".mtrl-card__expand-button").getAttribute("aria-expanded"), "true");
  const light = await root.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.screenshot({ path: join(artifacts, "card-light.png"), animations: "disabled" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme-mode", "dark"));
  await page.waitForTimeout(250);
  assert.notEqual(await root.evaluate(element => getComputedStyle(element).backgroundColor), light);
  await page.screenshot({ path: join(artifacts, "card-dark.png"), animations: "disabled" });
  await page.evaluate(() => {
    const state = window as unknown as CardWindow;
    state.loadingCard = state.cardParts.withLoading({ initialState: true })(state.cards[0]);
  });
  assert.equal(await root.locator(".mtrl-card__loading-overlay").evaluate(element => getComputedStyle(element).position), "absolute");
  assert.equal(await root.locator(".mtrl-card__loading-spinner").evaluate(element => getComputedStyle(element).width), "40px");
  await page.evaluate(() => {
    const state = window as unknown as CardWindow;
    state.loadingCard.loading.setLoading(false);
    state.cards[0].setActions(state.cardParts.createCardActions({ fullBleed: true, vertical: true }));
    state.cards[0].addContent(state.cardParts.createCardContent({ text: "No padding", padding: false }));
  });
  assert.equal(await root.locator(".mtrl-card__loading-overlay").count(), 0);
  assert.equal(await root.locator(".mtrl-card__actions").evaluate(element => getComputedStyle(element).padding), "0px");
  assert.equal(await root.locator(".mtrl-card__actions").evaluate(element => getComputedStyle(element).flexDirection), "column");
  assert.equal(await root.locator(".mtrl-card__content--no-padding").evaluate(element => getComputedStyle(element).padding), "0px");
  assert.deepEqual(await page.locator(".mtrl-card").evaluateAll(elements => elements.flatMap(root => [root, ...root.querySelectorAll("*")].flatMap(element => [...element.classList].filter(name => /^mtrl-card-[^-]/.test(name))))), []);
  await page.evaluate(() => (window as unknown as CardWindow).cards.forEach(card => card.destroy()));
  assert.equal(await page.locator(".mtrl-card").count(), 0);
  await page.unroute("https://mtrl.test/card.svg");
  console.log("Passed packed Card: BEM builders, replacement selectors, media geometry, themes, actions, expansion, loading and swipe styles.");
}
