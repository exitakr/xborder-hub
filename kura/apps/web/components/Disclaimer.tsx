import type { getDict } from "@oma/core";

/**
 * SPEC §1.3: this text must be present on every screen. It is rendered by the
 * root layout's footer so no page can accidentally ship without it.
 */
export function Disclaimer({ t }: { t: ReturnType<typeof getDict> }) {
  return (
    <p className="text-xs leading-relaxed text-muted">{t.disclaimer}</p>
  );
}
