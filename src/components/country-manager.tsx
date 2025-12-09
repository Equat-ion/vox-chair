"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Upload, Plus, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface Country {
  name: string;
  code: string;
}

export function CountryManager() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [newCountry, setNewCountry] = useState<string>("");
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{ Country: string }>;
        
        const newCountries: Country[] = jsonData.map(row => ({
          name: row.Country,
          code: getCountryCode(row.Country)
        }));
        
        setCountries([...countries, ...newCountries]);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const getCountryCode = (countryName: string): string => {
    // This is a simplified version - you might want to use a proper country code library
    return countryName.slice(0, 2).toUpperCase();
  };

  const addCountry = () => {
    if (newCountry.trim()) {
      setCountries([...countries, { name: newCountry, code: getCountryCode(newCountry) }]);
      setNewCountry("");
    }
  };

  const removeCountry = (index: number) => {
    const newCountries = [...countries];
    newCountries.splice(index, 1);
    setCountries(newCountries);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Enter country name"
          value={newCountry}
          onChange={(e) => setNewCountry(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && addCountry()}
        />
        <Button onClick={addCountry}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
        <div className="relative">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] w-full border rounded-md p-4">
        <div className="space-y-2">
          {countries.map((country, index) => (
            <Card key={index} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  className="w-6 h-4 object-cover rounded"
                />
                <span>{country.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCountry(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}