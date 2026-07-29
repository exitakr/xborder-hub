import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-lg font-semibold">Page not found</h1>
      <Link href="/" className="btn-secondary mt-6">
        Home
      </Link>
    </div>
  );
}
