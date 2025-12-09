import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            {/* LoadCommittee skeleton */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </CardContent>
            </Card>

            {/* SetupNewCommittee skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-[360px] w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* EditableCommittee skeleton */}
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-10" />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
