| # | Element | linkedom bare | Root cause (bare) | Browser APIs reached (shim) | Parity, after upgrade settles | Upgrade: px changed (DST / Phase A) | CLS (DST) |
|---|---|---|---|---|---|---|---|
| 1 | button | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 0% | 0.0000 |
| 2 | switch | OK |  | attachInternals? | equal after ids | 0% / 0.027% | 0.0000 |
| 3 | tabs | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 (then ResizeObserver missing @ src/components/tabs/features.ts:410) | getComputedStyle, new ResizeObserver +timer | **differs** (2 lines) | 0.158% / 0.585% | 0.0000 |
| 4 | progress | **fails** | requestAnimationFrame missing @ src/components/progress/features/canvas.ts:404 | matchMedia, canvas.getContext, requestAnimationFrame, new ResizeObserver | **differs** (2 lines) | 1.501% / 0.384% | 0.0038 |
| 5 | loading-indicator | **fails** | requestAnimationFrame missing @ src/components/loading-indicator/loading-indicator.ts:29 | new ResizeObserver, matchMedia, canvas.getContext, requestAnimationFrame, cancelAnimationFrame | **differs** (2 lines) | 0.523% / 0.524% | 0.0000 |
| 6 | badge | OK |  | none | equal after attr-order | 0% / 0.141% | 0.0000 |
| 7 | divider | OK |  | none | equal after style | 0% / 0% | 0.0000 |
| 8 | icon-button | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 0.17% | 0.0000 |
| 9 | fab | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 1.029% | 0.0000 |
| 10 | extended-fab | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 1.644% | 0.0000 |
| 11 | checkbox | OK |  | attachInternals? | equal after ids | 0% / 0% | 0.0000 |
| 12 | slider | OK |  | attachInternals?, getBoundingClientRect, new ResizeObserver | **differs** (6 lines) | 2.278% / 3.576% | 0.0015 |
| 13 | textfield | OK |  | attachInternals?, new ResizeObserver +timer | equal after ids | 0% / 0% | 0.0000 |
| 14 | radios | OK |  | attachInternals? | equal after state | 0% / 0.924% | 0.0000 |
| 15 | navigation-rail | OK |  | none | equal after style | 0% / 1.805% | 0.0000 |
| 16 | drawer | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | getComputedStyle | equal after style | 0% / 0% | 0.0000 |
| 17 | top-app-bar | OK |  | none | equal after attr-order | 0% / 0.325% | 0.0000 |
| 18 | bottom-app-bar | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 0% | 0.0000 |
| 19 | button-group | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | getComputedStyle | equal after style | 0% / 0.787% | 0.0000 |
| 20 | chips | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | getComputedStyle | equal after attr-order | 0% / 0.924% | 0.0000 |
| 21 | list | OK |  | none | equal after attr-order | 0% / 13.013% | 0.0000 |
| 22 | card | OK |  | none | equal after attr-order | 0% / 1.223% | 0.0000 |
| 23 | carousel | OK |  | matchMedia, new ResizeObserver, clientWidth | **differs** (13 lines) | 39.868% / 41.717% | 0.0000 |
| 24 | menu | **fails** | requestAnimationFrame missing @ src/elements/menu.ts:228 | requestAnimationFrame, cancelAnimationFrame +timer | **differs** (9 lines) | 0% / 0% | 0.0000 |
| 25 | fab-menu | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | getComputedStyle, matchMedia | **differs** (4 lines) | 0% / 1.029% | 0.0000 |
| 26 | select | OK |  | attachInternals?, new ResizeObserver +timer | equal after ids | 0% / 0.203% | 0.0000 |
| 27 | split-button | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | getComputedStyle +timer | equal after ids | 0% / 0.027% | 0.0000 |
| 28 | tooltip | OK |  | none | equal after ids | 0% / 0% | 0.0000 |
| 29 | toolbar | **fails** | getComputedStyle missing @ src/core/compose/features/ripple.ts:82 | attachInternals?, getComputedStyle | equal after attr-order | 0% / 0.511% | 0.0000 |
| 30 | snackbar | OK |  | none | equal after attr-order | 0% / 0% | 0.0000 |
| 31 | dialog | OK |  | none | equal after style | 0% / 0% | 0.0000 |
| 32 | bottom-sheet | OK |  | none | equal after ids | 0% / 0% | 0.0000 |
| 33 | side-sheet | OK |  | none | equal after ids | 0% / 0% | 0.0000 |
| 34 | datepicker | OK |  | attachInternals? | equal after state | 0% / 1.152% | 0.0000 |
| 35 | timepicker | OK |  | attachInternals?, offsetWidth | equal after whitespace | 0% / 0% | 0.0000 |
| 36 | search | OK |  | attachInternals? +timer | **differs** (7 lines) | 0% / 0.983% | 0.0000 |

bare OK 21/36; min OK 35; shim OK 36; parity equal (normalised) 28; upgrade pixel-identical 31, CLS 0 34
