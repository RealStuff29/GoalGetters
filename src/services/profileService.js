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
    .eq('user_id', userId) // 👈 make sure this matches your table column
    .select()

  if (error) {
    console.error('[profileService] updateProfile failed:', error)
    throw error
  }

  return data?.[0] ?? null
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
