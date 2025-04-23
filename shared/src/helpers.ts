import { head, pipe, toPairs } from "ramda";

export const firstProperty = pipe(toPairs, head, ([, value]) => value)
