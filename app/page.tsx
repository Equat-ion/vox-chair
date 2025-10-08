"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { SetupNewCommittee } from "@/components/setup-committee"
import { EditableCommittee } from "@/components/editable-committee"

// ----- Data -----
type Country = { id: string; name: string; flagQuery: string }

// ----- Left Column -----
function LoadCommittee() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-balance">Load Committee</CardTitle>
        <CardDescription className="sr-only">Load from a file or template</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-transparent">
          From File
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent">
          From Template
        </Button>
      </CardContent>
    </Card>
  )
}

// ----- Right Column -----
type Selected = { id: string; name: string; flagQuery: string }

// ----- Page -----
export default function Page() {
  const [title, setTitle] = useState("Editable Committee Name")
  const [selected, setSelected] = useState<Selected[]>([])

  function addCountry(c: Country) {
    setSelected((curr) =>
      curr.some((x) => x.id === c.id) ? curr : [...curr, { id: c.id, name: c.name, flagQuery: c.flagQuery }],
    )
  }

  function addCustom(name: string) {
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    setSelected((curr) =>
      curr.some((x) => x.id === id) ? curr : [...curr, { id, name, flagQuery: "custom member icon" }],
    )
  }

  function remove(id: string) {
    setSelected((curr) => curr.filter((x) => x.id !== id))
  }

  function rename(id: string, name: string) {
    setSelected((curr) => curr.map((x) => (x.id === id ? { ...x, name } : x)))
  }

  function clearAll() {
    setSelected([])
  }

  const router = useRouter()

  function start() {
    if (selected.length === 0) {
      alert("Please add at least one member to start a session")
      return
    }
    // Store session data in sessionStorage
    sessionStorage.setItem("sessionData", JSON.stringify({ title, members: selected }))
    // Navigate to speaker-list page
    router.push("/speaker-list")
  }

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <LoadCommittee />
            <SetupNewCommittee onAddCountry={addCountry} onAddCustom={addCustom} />
          </div>

          <EditableCommittee
            title={title}
            setTitle={setTitle}
            items={selected}
            onRemove={remove}
            onRename={rename}
            onClear={clearAll}
            onStart={start}
          />
        </div>
      </div>
    </main>
  )
}
