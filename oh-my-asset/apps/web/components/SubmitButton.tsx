"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that shows it has been pressed.
 *
 * Server Actions navigate on completion, so a plain submit button sits inert
 * for the whole round trip — the click registers with the server and nothing at
 * all registers with the person who made it. That reads as an unresponsive
 * button, and the instinct is to press it again. `useFormStatus` only works
 * from inside the form's own subtree, which is why this is a component rather
 * than a prop on the pages that use it.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
