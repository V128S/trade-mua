import { useSyncExternalStore } from "react";

// The store value never changes after hydration, so subscribe never fires.
const emptySubscribe = () => () => {};

/**
 * `false` during SSR and the hydration render, `true` on the client afterwards.
 * Use for client-only UI (randomized order, interstitials) instead of the
 * "setState(true) in a mount effect" pattern, which the
 * react-hooks/set-state-in-effect rule bans.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
