export default function GaleriaAnoLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-36 animate-pulse rounded bg-gray-200" />
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-56 rounded-lg bg-gray-200" />
        <div className="h-6 max-w-md rounded-lg bg-gray-100" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
    </div>
  );
}
