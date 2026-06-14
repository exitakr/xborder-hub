"use client";

/**
 * Small "×" control shown only to admins over seeded sample content. The
 * caller wires onClick to dismissSample(...) so the item is hidden for
 * everyone. Positioned absolutely — place inside a `relative` wrapper.
 */
export function DeleteSampleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("このサンプルを全ユーザーから非表示にしますか?")) {
          onClick();
        }
      }}
      className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-plum text-cream border border-ink flex items-center justify-center shadow-pop-sm"
      aria-label="サンプルを削除"
      title="管理者: このサンプルを削除"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
