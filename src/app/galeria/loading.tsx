export default function GaleriaLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-48 rounded-lg bg-gray-200" />
        <div className="h-20 max-w-xl rounded-lg bg-gray-100" />
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
          >
            <div className="h-40 bg-gray-200" />
            <div className="space-y-2 p-5">
              <div className="h-6 w-16 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
