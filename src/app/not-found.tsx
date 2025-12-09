"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-6">The page you were looking for doesn&apos;t exist.</p>
      <Link 
        href="/"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Return to Home
      </Link>
    </div>
  )
}