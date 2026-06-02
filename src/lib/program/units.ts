import { BN } from "@coral-xyz/anchor";
import { TOKEN_DECIMALS } from "./cluster";

const FACTOR = 10 ** TOKEN_DECIMALS;

/** Whole tokens (e.g. 10 USDT) -> base units BN (10_000_000). */
export function toBaseUnits(whole: number): BN {
  return new BN(Math.round(whole * FACTOR));
}

/** Base units (BN/number/bigint) -> whole tokens as a JS number. */
export function fromBaseUnits(base: BN | number | bigint): number {
  const n = typeof base === "object" ? base.toString() : String(base);
  return Number(n) / FACTOR;
}

export const SECONDS_PER_DAY = 86_400;
