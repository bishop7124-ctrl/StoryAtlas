import { supabase } from '../supabase'

/**
 * Submit a support or feature-request message to the feedback table.
 * Works for both authenticated and anonymous users.
 *
 * @param {Object} params
 * @param {'support'|'feature_request'} params.type
 * @param {string}  params.title
 * @param {string}  params.message
 * @param {string}  [params.category]
 * @param {string}  [params.email]    - captured for anonymous users
 * @param {string}  [params.name]
 * @param {string}  [params.userId]   - auth.users id if logged in
 */
export async function submitFeedback({ type, title, message, category, email, name, userId }) {
  const { error } = await supabase
    .from('feedback')
    .insert({
      type,
      title:    title.trim(),
      message:  message.trim(),
      category: category || null,
      email:    email?.trim() || null,
      name:     name?.trim()  || null,
      user_id:  userId || null,
    })

  if (error) throw new Error(error.message || 'Submission failed.')
}
