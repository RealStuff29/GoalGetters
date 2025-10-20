import { supabase } from '@/lib/supabase'

export async function updateProfile(userId, patch) {
    // patch: { username?, profile_photo?, gender? }

    const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('user_id', userId)
        .select()

  if (error) throw error

  return data
}
