export default function MediaUploadSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-24 rounded bg-gray-200 dark:bg-neutral-700"></div>
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-300 dark:bg-neutral-600"></div>
          <div className="mx-auto h-4 w-32 rounded bg-gray-300 dark:bg-neutral-600"></div>
          <div className="mx-auto h-3 w-48 rounded bg-gray-200 dark:bg-neutral-700"></div>
        </div>
      </div>
    </div>
  );
}
