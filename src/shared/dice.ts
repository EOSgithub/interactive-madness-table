// A fair die. `value % sides` on a random integer favours the low faces whenever
// the integer's range is not a multiple of `sides`; the standard fix is rejection
// sampling: throw away draws above the largest multiple and draw again.

/** Draws one unsigned 32-bit integer. Injectable so tests can script the draws. */
export type Draw = () => number

const cryptoDraw: Draw = () => {
  const box = new Uint32Array(1)
  crypto.getRandomValues(box)
  return box[0]
}

const SPAN = 0x1_0000_0000 // 2^32, the number of values a draw can take

/** A whole number from 1 to `sides`, every face equally likely. */
export function fairRoll(sides: number, draw: Draw = cryptoDraw): number {
  if (!Number.isInteger(sides) || sides < 1) throw new RangeError(`A die needs at least one side, got ${sides}.`)
  const limit = SPAN - (SPAN % sides) // draws at or above this would skew the low faces
  let value = draw()
  while (value >= limit) value = draw()
  return (value % sides) + 1
}
