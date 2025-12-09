import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <LoadingSkeleton />
      </div>
    </div>
  )
}
