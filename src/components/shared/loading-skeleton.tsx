"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

type LoadingSkeletonProps = {
  variant?: 'default' | 'list' | 'grid'
  itemCount?: number
}

export function LoadingSkeleton({ variant = 'default', itemCount = 3 }: LoadingSkeletonProps) {
  switch (variant) {
    case 'list':
      return (
        <div className="space-y-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    
    case 'grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )
    
    default:
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>
          
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
          </Card>
        </div>
      )
  }
}