export default function AluguerRoupasLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 animate-pulse space-y-3">
        <div className="h-10 w-64 rounded-lg bg-gray-200" />
        <div className="h-24 max-w-2xl rounded-lg bg-gray-100" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
          >
            <div className="h-48 bg-gray-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-6 w-3/4 rounded bg-gray-200" />
              <div className="h-12 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
