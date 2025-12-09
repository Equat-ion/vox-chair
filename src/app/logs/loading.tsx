import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function LogsLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-3 h-3 rounded-full" />
                <div>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full max-w-md mb-6" />

        {/* Logs List */}
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="w-3 h-3 rounded-full mt-1" />
                <Skeleton className="w-4 h-4 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
