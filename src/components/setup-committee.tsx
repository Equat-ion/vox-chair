"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import { CommitteeSetupModal } from "./committee-setup-modal"

type NewCommittee = {
  name: string
  abbrev: string
  agenda: string
  countries: Array<{ 
    name: string; 
    code: string; 
    attendance?: 'present' | 'present-voting' | 'absent' 
  }>
  countryList: Array<{ id: string; name: string; flagQuery: string }>
  chair: string
  coChair: string
  rapporteur: string
}

const SUGGESTED_COMMITTEES: Array<{ name: string; exampleAbbrev?: string }> = [
  { name: "General Assembly", exampleAbbrev: "GA" },
  { name: "Security Council", exampleAbbrev: "SC" },
  { name: "Human Rights Council", exampleAbbrev: "HRC" },
  { name: "Economic and Social Council", exampleAbbrev: "ECOSOC" },
  { name: "Disarmament and International Security Committee", exampleAbbrev: "DISEC" },
  { name: "Historical Security Council", exampleAbbrev: "HSC" },
]

function generateAbbrev(name: string) {
  const s = name.trim()
  if (!s) return ""
  // If multiple words, take initials
  const words = s.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase()
  }
  const initials = words.map((w) => w[0].toUpperCase()).join("")
  return initials.slice(0, 6)
}

export function SetupNewCommittee({
  onCreateAction,
}: {
  onCreateAction: (n: NewCommittee) => void
}) {
  const [name, setName] = useState("")
  const [abbrev, setAbbrev] = useState("")
  const [abbrevEdited, setAbbrevEdited] = useState(false)
  const [agenda, setAgenda] = useState("")

  useEffect(() => {
    // Auto-generate abbreviation when name changes, but only if the user hasn't typed one manually
    if (!abbrevEdited) {
      setAbbrev(generateAbbrev(name))
    }
  }, [name, abbrevEdited])

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [committeeData, setCommitteeData] = useState<{
    countries: Array<{ name: string; code: string }>
    chair: string
    coChair: string
    rapporteur: string
  } | null>(null)

  function tryCreate() {
    const n = name.trim()
    const a = (abbrev || generateAbbrev(n)).trim()
    const ag = agenda.trim()
    if (!n) {
      alert("Please enter a committee name")
      return
    }
    if (!ag) {
      alert("Please enter an agenda for the committee")
      return
    }

    // Open the setup modal after basic committee info is entered
    setIsSetupModalOpen(true)
  }

  const handleSetupComplete = (setupData: {
    countries: Array<{ name: string; code: string; attendance?: 'present' | 'present-voting' | 'absent' }>
    chair: string
    coChair: string
    rapporteur: string
  }) => {
    setCommitteeData(setupData)
    setIsSetupModalOpen(false)
    
    // Transform countries data for the speaker list
    const countryList = setupData.countries.map(country => ({
      id: Math.random().toString(36).substring(7),
      name: country.name,
      flagQuery: country.code
    }));

    // Add attendance status to countries
    const processedCountries = setupData.countries.map(country => ({
      name: country.name,
      code: country.code,
      attendance: country.attendance || 'absent'
    }));

    // Save data to session storage
    const sessionData = {
      countries: processedCountries,
      countryList: countryList,
      committeeInfo: {
        name: name.trim(),
        abbrev: (abbrev || generateAbbrev(name)).trim(),
        agenda: agenda.trim(),
        chair: setupData.chair,
        coChair: setupData.coChair,
        rapporteur: setupData.rapporteur
      }
    };
    sessionStorage.setItem('sessionData', JSON.stringify(sessionData));

    // Create committee with all data
    onCreateAction({
      name: name.trim(),
      abbrev: (abbrev || generateAbbrev(name)).trim(),
      agenda: agenda.trim(),
      ...setupData,
      countries: processedCountries,
      countryList
    })

    // Clear form
    setName("")
    setAbbrev("")
    setAgenda("")
    setAbbrevEdited(false)
    setCommitteeData(null)
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-balance">Create / Select Committee</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 [&_input]:bg-[--input-background] [&_textarea]:bg-[--input-background]">
        <div className="space-y-1 mb-6">
          <Label htmlFor="committee-name" className="font-medium mb-2 block">Committee</Label>
          <Input
            list="committee-suggestions"
            id="committee-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Select or type committee name"
            aria-label="Committee name"
            className="bg-background"
          />
          <datalist id="committee-suggestions">
            {SUGGESTED_COMMITTEES.map((s) => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1 mb-6">
          <Label htmlFor="committee-abbrev" className="font-medium mb-2 block">Abbreviation</Label>
          <Input
            id="committee-abbrev"
            value={abbrev || generateAbbrev(name)}
            onChange={(e) => {
              setAbbrev(e.target.value)
              setAbbrevEdited(true)
            }}
            placeholder="Auto-generated abbreviation"
            aria-label="Committee abbreviation"
            className="bg-background"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="committee-agenda" className="font-medium mb-2 block">Agenda (required)</Label>
          <Textarea
            id="committee-agenda"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="Enter the agenda/topic for this committee"
            aria-label="Committee agenda"
            className="bg-background resize-y min-h-[100px]"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={tryCreate}>Create Committee</Button>
        </div>
      </CardContent>

      {/* Committee Setup Modal */}
      <CommitteeSetupModal
        open={isSetupModalOpen}
        onOpenChange={setIsSetupModalOpen}
        onSetupComplete={handleSetupComplete}
      />
    </Card>
  )
}
