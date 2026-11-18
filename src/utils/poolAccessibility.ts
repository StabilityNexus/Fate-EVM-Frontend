import type { Pool } from "@/lib/types";

export const poolActionLabel = (
  pool: Pick<Pool, "name" | "bullToken" | "bearToken">,
): string => {
  const pair = `${pool.bullToken.symbol}/${pool.bearToken.symbol}`;
  return pool.name ? `Open pool ${pool.name} (${pair})` : `Open pool ${pair}`;
};
