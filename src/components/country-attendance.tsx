"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlagAvatar } from "@/components/ui/flag-avatar";

import type { AttendanceStatus, CountryListItem } from './committee-manager';

// Use the imported type
type Country = CountryListItem;

interface CountryAttendanceProps {
  countryList: Country[];
  onAttendanceChange: (countryName: string, newStatus: AttendanceStatus) => void;
}

const getStatusDisplay = (status: AttendanceStatus) => {
  switch (status) {
    case 'present': return 'Present';
    case 'present-voting': return 'Present and Voting';
    case 'absent': return 'Absent';
    default: return 'Absent';
  }
};

export function CountryAttendance({ countryList, onAttendanceChange }: CountryAttendanceProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => 
    countryList.filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [countryList, searchQuery]);

  const handleAttendanceChange = (countryName: string, newValue: AttendanceStatus) => {
    const country = countryList.find(c => c.name === countryName);
    if (!country || country.attendance === newValue) return;
    onAttendanceChange(countryName, newValue);
  };

  return (
    <div className="w-full space-y-4">
      <Input
        placeholder="Search countries..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredCountries.map((country) => (
            <Card key={country.id} className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FlagAvatar query={country.flagQuery} alt={country.name} />
                  <span>{country.name}</span>
                </div>
                <Select
                  value={country.attendance || 'absent'}
                  onValueChange={(value: AttendanceStatus) => {
                    // Prevent unnecessary updates
                    if (value === (country.attendance || 'absent')) return;
                    handleAttendanceChange(country.name, value);
                  }}
                  defaultValue="absent"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {getStatusDisplay(country.attendance || 'absent')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="present-voting">Present and Voting</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
