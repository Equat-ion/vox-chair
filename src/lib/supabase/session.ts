import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { CommitteeSessionData, Speaker } from '@/types/session';

// Don't create client at module level - create it in each function
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export async function saveSession(sessionData: CommitteeSessionData) {
  const supabase = getSupabaseClient();
  
  try {
    // First save or update the main session data
    const { data: session, error: sessionError } = await supabase
      .from('committee_sessions')
      .upsert({
        id: sessionData.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: sessionData.name,
        abbrev: sessionData.abbrev,
        agenda: sessionData.agenda,
        settings: sessionData.settings
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Save/update session settings
    const { error: settingsError } = await supabase
      .from('session_settings')
      .upsert({
        session_id: session.id,
        speaking_time: sessionData.speakingTime,
        warning_time: sessionData.warningTime,
        enable_motions: sessionData.settings?.enableMotions ?? true,
        enable_voting: sessionData.settings?.enableVoting ?? true
      });

    if (settingsError) throw settingsError;

    // Save/update countries
    if (sessionData.countries?.length) {
      const { error: countriesError } = await supabase
        .from('session_countries')
        .upsert(
          sessionData.countries.map(country => ({
            session_id: session.id,
            name: country.name,
            code: country.code,
            attendance: country.attendance
          }))
        );

      if (countriesError) throw countriesError;
    }

    // Save current speaker if exists
    if (sessionData.currentSpeaker) {
      const { error: speakerError } = await supabase
        .from('session_speakers')
        .upsert({
          session_id: session.id,
          name: sessionData.currentSpeaker.name,
          flag_query: sessionData.currentSpeaker.flagQuery,
          code: sessionData.currentSpeaker.code,
          speaking_time: sessionData.speakingTime,
          is_current: true,
          attendance: sessionData.currentSpeaker.attendance,
          is_yielded: sessionData.currentSpeaker.isYielded,
          yielded_time: sessionData.currentSpeaker.yieldedTime
        });

      if (speakerError) throw speakerError;
    }

    // Save speaker queue
    if (sessionData.speakerQueue?.length) {
      const { error: queueError } = await supabase
        .from('session_speakers')
        .upsert(
          sessionData.speakerQueue.map((speaker, index) => ({
            session_id: session.id,
            name: speaker.name,
            flag_query: speaker.flagQuery,
            code: speaker.code,
            speaking_time: sessionData.speakingTime,
            is_current: false,
            position_in_queue: index,
            attendance: speaker.attendance,
            is_yielded: speaker.isYielded,
            yielded_time: speaker.yieldedTime
          }))
        );

      if (queueError) throw queueError;
    }

    return session;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function loadSession(sessionId: string): Promise<CommitteeSessionData> {
  const supabase = getSupabaseClient();
  
  try {
    // Load main session data
    const { data: session, error: sessionError } = await supabase
      .from('committee_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Load session settings
    const { data: settings, error: settingsError } = await supabase
      .from('session_settings')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (settingsError) throw settingsError;

    // Load countries
    const { data: countries, error: countriesError } = await supabase
      .from('session_countries')
      .select('*')
      .eq('session_id', sessionId);

    if (countriesError) throw countriesError;

    // Load current speaker and queue
    const { data: speakers, error: speakersError } = await supabase
      .from('session_speakers')
      .select('*')
      .eq('session_id', sessionId)
      .order('position_in_queue', { ascending: true });

    if (speakersError) throw speakersError;

    // Construct the session data
    const sessionData: CommitteeSessionData = {
      id: session.id,
      name: session.name,
      abbrev: session.abbrev,
      agenda: session.agenda,
      speakingTime: settings.speaking_time,
      warningTime: settings.warning_time,
      settings: {
        enableMotions: settings.enable_motions,
        enableVoting: settings.enable_voting
      },
      countries: countries.map(country => ({
        name: country.name,
        code: country.code,
        attendance: country.attendance
      })),
      currentSpeaker: speakers.find(s => s.is_current) ? {
        name: speakers.find(s => s.is_current)!.name,
        flagQuery: speakers.find(s => s.is_current)!.flag_query,
        code: speakers.find(s => s.is_current)!.code,
        attendance: speakers.find(s => s.is_current)!.attendance,
        isYielded: speakers.find(s => s.is_current)!.is_yielded,
        yieldedTime: speakers.find(s => s.is_current)!.yielded_time
      } : undefined,
      speakerQueue: speakers
        .filter(s => !s.is_current)
        .sort((a, b) => a.position_in_queue - b.position_in_queue)
        .map(speaker => ({
          name: speaker.name,
          flagQuery: speaker.flag_query,
          code: speaker.code,
          attendance: speaker.attendance,
          isYielded: speaker.is_yielded,
          yieldedTime: speaker.yielded_time
        }))
    };

    return sessionData;
  } catch (error) {
    console.error('Error loading session:', error);
    throw error;
  }
}

export async function deleteSession(sessionId: string) {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('committee_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

export async function listSessions() {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('committee_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing sessions:', error);
    throw error;
  }
}

// Auto-sync to Supabase when available
export async function saveCommitteeWithSync(committee: CommitteeSessionData): Promise<void> {
  saveCommittee(committee); // Local storage
  try {
    await saveSession(committee); // Supabase
  } catch (error) {
    console.warn('Failed to sync to Supabase:', error);
    // Continue with local storage fallback
  }
}