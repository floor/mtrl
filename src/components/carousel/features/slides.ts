// src/components/carousel/features/slides.ts
//
// Builds and maintains the carousel items. Each item is a focusable group
// labelled "n of total" (m3.material.io carousel accessibility); sizes and
// positions are set by the scroll feature.

import { CarouselConfig, CarouselSlide, SlidesAPI } from "../types";

export interface SlidesComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  /** Scroll container holding the track */
  scroller: HTMLElement;
  /** Positioned parent of the items */
  track: HTMLElement;
  slides: SlidesAPI;
  slideElements: HTMLElement[];
  /** Registers the callback run when items are added or removed (the scroll feature rebuilds) */
  onSlidesChanged: (handler: () => void) => void;
  [key: string]: unknown;
}

export const withSlides = (config: CarouselConfig) => <C extends { element: HTMLElement; getClass: (name: string) => string }>(component: C): C & SlidesComponent => {
  const prefix = component.getClass("carousel");

  const scroller = document.createElement("div");
  scroller.className = `${prefix}__scroller`;
  const track = document.createElement("div");
  track.className = `${prefix}__track`;
  scroller.appendChild(track);
  component.element.appendChild(scroller);

  const slideData: CarouselSlide[] = [];
  const slideElements: HTMLElement[] = [];
  const enhanced = component as C & SlidesComponent;
  let slidesChanged: (() => void) | undefined;

  const relabel = (): void => {
    const total = slideElements.length;
    slideElements.forEach((el, i) => {
      el.dataset.index = String(i);
      el.setAttribute("aria-label", `${i + 1} of ${total}`);
    });
  };

  const fill = (el: HTMLElement, slide: CarouselSlide): void => {
    el.replaceChildren();
    if (slide.content !== undefined) {
      if (typeof slide.content === "string") el.innerHTML = slide.content;
      else el.appendChild(slide.content);
      return;
    }
    if (slide.image) {
      const img = document.createElement("img");
      img.className = `${prefix}__image`;
      img.src = slide.image;
      img.alt = slide.alt ?? slide.title ?? "";
      img.draggable = false;
      el.appendChild(img);
    }
    if (slide.title || slide.description || slide.buttonText) {
      const content = document.createElement("div");
      content.className = `${prefix}__content`;
      if (slide.title) {
        const title = document.createElement("div");
        title.className = `${prefix}__title`;
        title.textContent = slide.title;
        content.appendChild(title);
      }
      if (slide.description) {
        const description = document.createElement("div");
        description.className = `${prefix}__description`;
        description.textContent = slide.description;
        content.appendChild(description);
      }
      if (slide.buttonText) {
        const button = document.createElement("a");
        button.className = `${prefix}__button`;
        button.textContent = slide.buttonText;
        if (slide.buttonUrl) button.href = slide.buttonUrl;
        content.appendChild(button);
      }
      el.appendChild(content);
    }
  };

  const createSlideElement = (slide: CarouselSlide): HTMLElement => {
    const el = document.createElement("div");
    el.className = `${prefix}__item`;
    el.setAttribute("role", "group");
    el.setAttribute("aria-roledescription", "slide");
    el.tabIndex = 0;
    fill(el, slide);
    return el;
  };

  const changed = (): void => {
    relabel();
    slidesChanged?.();
  };

  const slides: SlidesAPI = {
    addSlide(slide, index) {
      const at = index !== undefined && index >= 0 && index <= slideData.length ? index : slideData.length;
      const el = createSlideElement(slide);
      slideData.splice(at, 0, slide);
      if (at < slideElements.length) {
        track.insertBefore(el, slideElements[at]!);
        slideElements.splice(at, 0, el);
      } else {
        track.appendChild(el);
        slideElements.push(el);
      }
      changed();
      return slides;
    },
    removeSlide(index) {
      if (index < 0 || index >= slideElements.length) return slides;
      track.removeChild(slideElements[index]!);
      slideElements.splice(index, 1);
      slideData.splice(index, 1);
      changed();
      return slides;
    },
    updateSlide(index, slide) {
      if (index < 0 || index >= slideElements.length) return slides;
      slideData[index] = slide;
      fill(slideElements[index]!, slide);
      return slides;
    },
    getSlide: (index) => slideData[index] ?? null,
    getCount: () => slideData.length,
    getElements: () => slideElements.slice(),
  };

  enhanced.scroller = scroller;
  enhanced.track = track;
  enhanced.slides = slides;
  enhanced.slideElements = slideElements;
  enhanced.onSlidesChanged = (handler) => {
    slidesChanged = handler;
  };

  (config.slides ?? []).forEach((slide) => {
    const el = createSlideElement(slide);
    slideData.push(slide);
    slideElements.push(el);
    track.appendChild(el);
  });
  relabel();

  return enhanced;
};
