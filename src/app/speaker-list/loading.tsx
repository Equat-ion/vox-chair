import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Status Bar skeleton */}
        <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div>
            <Card className="p-8 mb-6">
              <div className="relative text-center py-12">
                <Skeleton className="h-24 w-full mb-8" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>

            {/* Current Speaker skeleton */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </Card>
            </div>

            {/* Upcoming Speakers skeleton */}
            <div className="mb-8">
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="space-y-2">
                <Card className="p-4">
                  <Skeleton className="h-10 w-full" />
                </Card>
                <Card className="p-4">
                  <Skeleton className="h-10 w-full" />
                </Card>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            <Card className="p-6">
              <Skeleton className="h-7 w-32 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[400px] w-full" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
