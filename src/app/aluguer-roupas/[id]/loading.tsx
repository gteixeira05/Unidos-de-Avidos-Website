export default function RoupaDetalheLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-gray-200" />
      <div className="grid min-w-0 gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-1">
          <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-full rounded bg-gray-200" />
            <div className="mt-4 h-24 rounded bg-gray-100" />
            <div className="mt-6 h-32 rounded bg-gray-100" />
          </div>
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
