"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus } from "lucide-react"

interface TimePickerProps {
  value: number // Total time in seconds
  onChange: (seconds: number) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60

  const [minutesInput, setMinutesInput] = useState(minutes.toString())
  const [secondsInput, setSecondsInput] = useState(seconds.toString().padStart(2, "0"))

  // Sync state when value prop changes externally
  useEffect(() => {
    setMinutesInput(minutes.toString())
    setSecondsInput(seconds.toString().padStart(2, "0"))
  }, [value, minutes, seconds])

  const handleMinutesChange = (newMinutes: number) => {
    const validMinutes = Math.max(0, newMinutes)
    setMinutesInput(validMinutes.toString())
    onChange(validMinutes * 60 + seconds)
  }

  const handleSecondsChange = (newSeconds: number) => {
    const validSeconds = Math.max(0, Math.min(59, newSeconds))
    setSecondsInput(validSeconds.toString().padStart(2, "0"))
    onChange(minutes * 60 + validSeconds)
  }

  const handleMinutesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMinutesInput(value)
    
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue * 60 + seconds)
    }
  }

  const handleSecondsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSecondsInput(value)
    
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
      onChange(minutes * 60 + numValue)
    }
  }

  const handleMinutesBlur = () => {
    const numValue = parseInt(minutesInput)
    if (isNaN(numValue) || numValue < 0) {
      setMinutesInput(minutes.toString())
    } else {
      setMinutesInput(numValue.toString())
    }
  }

  const handleSecondsBlur = () => {
    const numValue = parseInt(secondsInput)
    if (isNaN(numValue) || numValue < 0 || numValue > 59) {
      setSecondsInput(seconds.toString().padStart(2, "0"))
    } else {
      setSecondsInput(numValue.toString().padStart(2, "0"))
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-4">
        {/* Minutes Column */}
        <div className="flex flex-col items-center gap-2">
          <Label className="text-sm font-medium">Minutes</Label>
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMinutesChange(minutes + 1)}
              className="h-8 w-16 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white border-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={minutesInput}
              onChange={handleMinutesInputChange}
              onBlur={handleMinutesBlur}
              onFocus={(e) => e.target.select()}
              className="h-16 w-16 text-center text-xl font-medium border-0 focus:ring-0 focus-visible:ring-0"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMinutesChange(minutes - 1)}
              className="h-8 w-16 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white border-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Separator */}
        <span className="text-4xl font-bold self-center mt-4">:</span>

        {/* Seconds Column */}
        <div className="flex flex-col items-center gap-2">
          <Label className="text-sm font-medium">Seconds</Label>
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSecondsChange(seconds + 1)}
              className="h-8 w-16 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white border-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={secondsInput}
              onChange={handleSecondsInputChange}
              onBlur={handleSecondsBlur}
              onFocus={(e) => e.target.select()}
              className="h-16 w-16 text-center text-xl font-medium border-0 focus:ring-0 focus-visible:ring-0"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSecondsChange(seconds - 1)}
              className="h-8 w-16 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white border-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
