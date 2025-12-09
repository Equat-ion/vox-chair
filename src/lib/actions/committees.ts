// src/lib/actions/committees.ts
'use server'

import { saveCommitteeToDatabase } from '@/lib/supabase/committees'

export type CommitteeData = {
  name: string
  abbrev: string
  agenda: string
  chair: string
  coChair: string
  rapporteur: string
  countries: Array<{ name: string; code: string; attendance: 'present' | 'absent' | 'present-voting' }>
  countryList: Array<{ id: string; name: string; flagQuery: string }>
  settings?: any
}

export async function createCommitteeAction(data: CommitteeData) {
  try {
    console.log('Server action: Creating committee')
    
    const savedCommittee = await saveCommitteeToDatabase(
      {
        name: data.name,
        abbrev: data.abbrev,
        agenda: data.agenda,
        chair: data.chair,
        coChair: data.coChair,
        rapporteur: data.rapporteur,
        settings: data.settings || {}
      },
      data.countries
    )

    return {
      success: true,
      committee_id: savedCommittee.committee_id,
      error: null
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      committee_id: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}