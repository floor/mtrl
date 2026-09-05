// src/components/carousel/features/slides.ts
// DOM creation and management for carousel slides.
// Positioning is handled by the scroll engine — this module only
// creates, removes, and updates slide DOM elements.

import { CarouselConfig, CarouselSlide } from "../types";
import { CAROUSEL_DEFAULTS } from "../constants";

export const withSlides = (config: CarouselConfig) => (component: any) => {
  const prefix = component.getClass("carousel");
  const cornerRadius = config.cornerRadius ?? CAROUSEL_DEFAULTS.CORNER_RADIUS;

  const track = document.createElement("div");
  track.className = `${prefix}__track`;
  track.setAttribute("role", "list");
  track.style.position = "relative";
  track.style.height = "100%";
  component.element.appendChild(track);

  const slideData: CarouselSlide[] = [];
  const slideElements: HTMLElement[] = [];

  function createSlideElement(slide: CarouselSlide, index: number): HTMLElement {
    const el = document.createElement("div");
    el.className = `${prefix}__slide`;
    el.setAttribute("role", "listitem");
    el.setAttribute("aria-roledescription", "slide");
    el.dataset.index = String(index);
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.left = "0";
    el.style.height = "100%";
    el.style.overflow = "hidden";
    el.style.borderRadius = `${cornerRadius}px`;
    el.style.flexShrink = "0";

    const imageWrap = document.createElement("div");
    imageWrap.className = `${prefix}__slide-image`;
    imageWrap.style.width = "100%";
    imageWrap.style.height = "100%";
    imageWrap.style.position = "relative";
    imageWrap.style.overflow = "hidden";

    const img = document.createElement("img");
    img.src = slide.image;
    img.alt = slide.title || "Carousel slide";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    imageWrap.appendChild(img);

    if (slide.accent) {
      const overlay = document.createElement("div");
      overlay.className = `${prefix}__slide-overlay`;
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.backgroundColor = slide.accent;
      overlay.style.opacity = "0.3";
      imageWrap.appendChild(overlay);
    }

    el.appendChild(imageWrap);

    if (slide.title || slide.description || slide.buttonText) {
      const content = document.createElement("div");
      content.className = `${prefix}__slide-content`;
      content.style.position = "absolute";
      content.style.bottom = "0";
      content.style.left = "0";
      content.style.right = "0";
      content.style.padding = "16px";
      content.style.opacity = "var(--mtrl-carousel-role-weight, 1)";

      if (slide.title) {
        const title = document.createElement("div");
        title.className = `${prefix}__slide-title`;
        title.textContent = slide.title;
        content.appendChild(title);
      }

      if (slide.description) {
        const desc = document.createElement("div");
        desc.className = `${prefix}__slide-description`;
        desc.textContent = slide.description;
        content.appendChild(desc);
      }

      if (slide.buttonText) {
        const btn = document.createElement("a");
        btn.className = `${prefix}__slide-button`;
        btn.textContent = slide.buttonText;
        if (slide.buttonUrl) btn.href = slide.buttonUrl;
        content.appendChild(btn);
      }

      el.appendChild(content);
    }

    return el;
  }

  function addSlide(slide: CarouselSlide, index?: number): void {
    const insertAt = index !== undefined && index >= 0 && index <= slideData.length
      ? index
      : slideData.length;

    slideData.splice(insertAt, 0, slide);
    const el = createSlideElement(slide, insertAt);

    if (insertAt < slideElements.length) {
      track.insertBefore(el, slideElements[insertAt]!);
      slideElements.splice(insertAt, 0, el);
    } else {
      track.appendChild(el);
      slideElements.push(el);
    }

    // Re-index all slides after insert
    for (let i = insertAt; i < slideElements.length; i++) {
      slideElements[i]!.dataset.index = String(i);
    }

    if (component.rebuildOnSlideChange) component.rebuildOnSlideChange();
  }

  function removeSlide(index: number): void {
    if (index < 0 || index >= slideElements.length) return;
    track.removeChild(slideElements[index]!);
    slideElements.splice(index, 1);
    slideData.splice(index, 1);

    for (let i = index; i < slideElements.length; i++) {
      slideElements[i]!.dataset.index = String(i);
    }

    if (component.rebuildOnSlideChange) component.rebuildOnSlideChange();
  }

  function updateSlide(index: number, slide: CarouselSlide): void {
    if (index < 0 || index >= slideElements.length) return;
    slideData[index] = slide;

    const el = slideElements[index]!;
    const img = el.querySelector("img");
    if (img) {
      img.src = slide.image;
      img.alt = slide.title || "Carousel slide";
    }

    const titleEl = el.querySelector(`.${prefix}__slide-title`);
    if (titleEl && slide.title) titleEl.textContent = slide.title;

    const descEl = el.querySelector(`.${prefix}__slide-description`);
    if (descEl && slide.description) descEl.textContent = slide.description;
  }

  // Add initial slides
  if (config.slides) {
    config.slides.forEach((slide) => {
      const el = createSlideElement(slide, slideData.length);
      slideData.push(slide);
      slideElements.push(el);
      track.appendChild(el);
    });
  }

  return {
    ...component,

    trackElement: track,
    slideData,

    slides: {
      addSlide: (slide: CarouselSlide, index?: number) => {
        addSlide(slide, index);
        return component.slides;
      },
      removeSlide: (index: number) => {
        removeSlide(index);
        return component.slides;
      },
      updateSlide: (index: number, slide: CarouselSlide) => {
        updateSlide(index, slide);
        return component.slides;
      },
      getSlide: (index: number) => slideData[index] ?? null,
      getCount: () => slideData.length,
      getElements: () => [...slideElements],
    },
  };
};
