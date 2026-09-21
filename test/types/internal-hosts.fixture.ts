// test/types/internal-hosts.fixture.ts
//
// Three internal declarations that were wider than the producers they accept.
// Nothing here runs; the assertions are the test.
//
// Every one is the same shape, and it is the shape this whole issue keeps
// turning out to be: a host promising to accept *anything* cannot take a
// producer that accepts something specific, because parameter positions are
// contravariant. Bivariance permitted all three; `strictFunctionTypes` does
// not.
//
//   slider/features/tracks.ts  renderTracks took `(state?: unknown)`
//                              while the producer takes a VisualState
//   slider/api.ts              setColor took `(color: string)`, and also the
//                              uppercase keys of SLIDER_COLORS, which neither
//                              the public SliderComponent.setColor nor the
//                              implementation in features/states.ts accepts
//   slider/config.ts           the same setColor, one host further out
//
// None of them is public: SliderApiHost lives in config.ts, the tracks host
// in tracks.ts, and the package exports neither. What *is* public --
// SliderComponent.setColor -- already said SliderColor, so these narrowings
// bring the internal declarations to what the public one always promised.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { SliderColor, SliderComponent } from "../../src/components/slider/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const slider: SliderComponent;

// --- the public promise these were brought in line with -------------------

export const publicSetColorTakesSliderColor: Equals<
  Parameters<SliderComponent["setColor"]>,
  [SliderColor]
> = true;

// And SliderColor is the four lowercase names, not a string. The uppercase
// keys the internal host also accepted were never reachable through the
// component's own type.
export const sliderColourIsTheFourNames: Equals<
  SliderColor,
  "primary" | "secondary" | "tertiary" | "error"
> = true;

export const sliderColourIsNotAString: Equals<SliderColor, string> = false;

// --- what the narrowed signature rejects ----------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions.

// @ts-expect-error "PRIMARY" is a key of SLIDER_COLORS, not one of its values
slider.setColor("PRIMARY");

// @ts-expect-error nor any other string
slider.setColor("blue");

// --- what it still allows --------------------------------------------------

slider.setColor("primary");
slider.setColor("error");
