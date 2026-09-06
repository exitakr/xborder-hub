import { Alert } from "react-native";
import { fill, getDict } from "@oma/core";

type Dict = ReturnType<typeof getDict>;

/**
 * Free-plan ceiling, mirrored from `free_holding_limit()` in migration 0015.
 * Used only for the message; the database is what actually enforces it.
 */
export const FREE_HOLDING_LIMIT = 10;

/** Did this write fail because the free plan is full? See migration 0015. */
export function isHoldingLimitError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.includes("holding_limit_reached"));
}

/**
 * Explain a refused add.
 *
 * Without this the native app failed silently: tapping "add" on a full account
 * did nothing at all, with no error and no navigation, which reads as the
 * button being broken rather than as a limit having been reached. There is no
 * purchase flow to send them to yet, so the alert states the limit and stops —
 * an upgrade button that cannot take money would be worse than none.
 */
export function alertHoldingLimit(t: Dict): void {
  Alert.alert(t.planFullTitle, fill(t.planFullBody, { max: FREE_HOLDING_LIMIT }));
}
