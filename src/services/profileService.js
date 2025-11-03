import { supabase } from '@/lib/supabase'

/**
 * Generic profile updater.
 * @param {string} userId - auth.user.id
 * @param {object} patch - fields to update on profiles
 */
export async function updateProfile(userId, patch) {
  if (!userId) throw new Error('updateProfile: userId is required')

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId) 
    .select()

  if (error) {
    console.error('[profileService] updateProfile failed:', error)
    throw error
  }

  return data?.[0] ?? null
}

export async function usernameClash(username, currentUserId) {
  if (!username) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .neq('user_id', currentUserId)
    .maybeSingle()

  if (error) {
    console.error('[profileService] usernameClash failed:', error)
    return null
  }
  return data ?? null  // null means no clash
}

// Save Step 1+2 fields together (AccountInfo + Academic Info)
export async function saveAccountAcademicBundle(userId, payload) {
  const patch = {
    username: payload.username,
    gender: payload.gender,
    profile_photo: payload.profile_photo,
    degree: payload.degree,
    modules: Array.isArray(payload.modules) ? payload.modules.join(',') : '',
    study_hours: Number(payload.study_hours ?? 0) || null
  }
  return updateProfile(userId, patch)
}

/**
 * Update only the timeslot_avail column as a comma-separated string
 * @param {string} userId - Supabase Auth user ID
 * @param {string[]} slots - Selected time slots (e.g. ['slot_morning', 'slot_evening'])
 */
export async function updateProfileTimeslots(userId, slots) {
  if (!userId) throw new Error('updateProfileTimeslots: userId is required')

  // Convert array → comma-separated string
  const timeslotString = Array.isArray(slots) ? slots.join(',') : ''

  console.log('[profileService] Updating timeslot_avail →', timeslotString)

  return updateProfile(userId, { timeslot_avail: timeslotString })
}
