/**
 * Motion tokens for GSAP. Mirrors the --bl-dur-* / --bl-ease-* values in
 * styles/tokens.css — keep the two in step.
 */

export const duration = {
  press: 0.12,
  fast: 0.2,
  base: 0.32,
  reveal: 0.6,
  hero: 0.9,
} as const

export const ease = {
  /** Entrances: arrives fast, settles on a long tail. */
  out: 'expo.out',
  /** Softer entrance for small UI. */
  outSoft: 'power3.out',
  /** Moves between two resting states. */
  inOut: 'power2.inOut',
  /** Exits. */
  in: 'power3.in',
} as const

export const stagger = {
  words: 0.08,
  lines: 0.09,
  items: 0.06,
} as const
