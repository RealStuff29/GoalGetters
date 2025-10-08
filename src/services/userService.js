import { supabase } from '@/lib/supabase'

// Insert a dummy user THIS IS DUMMY GPT CODE TO TEST CONNECTIVITY AND CRUD FUNCTIONS (SEE IF RLS IS WORKING)
export async function addDummyUser() {
  const dummy = {
    username: 'demo_' + Math.floor(Math.random() * 100000),
    email: `demo${Date.now()}@example.com`,
    password: 'password123', // demo only
    description: 'Just a demo user',
    profile_photo: 'https://picsum.photos/seed/' + Date.now() + '/200/200',
    personality: 'Introvert',
    gender: 'Prefer not to say',
    rating: 0
  }

  const { data, error } = await supabase
    .from('users')
    .insert([dummy])
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all users
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
