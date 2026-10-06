// Shared animation CSS for cards. Animations run inside SVGs shown as <img> on GitHub
// (CSS only: GitHub never runs scripts in images), and stop for viewers who ask for less motion.
// Every element's own style is its final state and keyframes only describe where it starts,
// so switching animations off always leaves a complete, readable card.

export const REDUCED_MOTION = `
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
  }
`;

// Elements fade and rise into place once; pair with delay() to stagger them.
export const FADE_IN = `
  .fade-in { animation: fade-in 0.6s ease-out both; }
  @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } }
`;

// Bars grow from their left edge once.
export const GROW_X = `
  .grow-x { transform-box: fill-box; transform-origin: left center; animation: grow-x 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
  @keyframes grow-x { from { transform: scaleX(0); } }
`;

export function delay(ms: number): string {
  return `style="animation-delay: ${Math.round(ms)}ms"`;
}

// A background-coloured cover that shrinks in steps reveals text like typing. Its own style is fully
// shrunk, so the text is readable without animation; set duration, delay and steps() inline.
export const TYPING = `
  .typing { transform-box: fill-box; transform-origin: right center; transform: scaleX(0); animation-name: typing; animation-fill-mode: both; }
  @keyframes typing { from { transform: scaleX(1); } to { transform: scaleX(0); } }
`;

// A progress ring draws itself from empty to its value.
export function ringDraw(circumference: number): string {
  return `
  .ring-draw { animation: ring-draw 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both; }
  @keyframes ring-draw { from { stroke-dashoffset: ${circumference}; } }
`;
}
