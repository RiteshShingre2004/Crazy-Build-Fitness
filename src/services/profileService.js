// ── Crazy Build · profileService.js ──────────────────────────────────────────
// Reads and writes the user's full app state to the Supabase `profiles` table.
// Called on login (fetch) and whenever state changes (upsert, debounced).

import { supabase } from '../utils/supabase.js';

/**
 * Fetch an existing profile from Supabase by email.
 * Returns the full profile row, or null if the user is new.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function fetchProfile(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      // PGRST116 = no rows found — not an error, just a new user
      if (error.code === 'PGRST116') return null;
      console.error('[profileService] fetchProfile error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[profileService] fetchProfile unexpected error:', err);
    return null;
  }
}

/**
 * Upsert (create or update) the full profile from app state.
 * Safe to call frequently — debounce at the call-site.
 * @param {string} email
 * @param {object} state  — the full AppContext state snapshot
 */
export async function saveProfile(email, state) {
  if (!email || !state.user) return;

  const row = {
    email:              email.toLowerCase(),
    name:               state.user.name,
    age:                state.user.age,
    gender:             state.user.gender,
    weight:             state.user.weight,
    height:             state.user.height,
    activity_level:     state.user.activityLevel,
    goal:               state.user.goal,
    diet_preference:    state.user.dietPreference,
    meal_plan:          state.mealPlan,
    workout_plan:       state.workoutPlan,
    progress_log:       state.progressLog,
    activity_log:       state.activityLog,
    preferences:        state.preferences,
    active_day:         state.activeDay,
    active_workout_day: state.activeWorkoutDay,
    updated_at:         new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'email' });

    if (error) {
      console.error('[profileService] saveProfile error:', error.message);
    }
  } catch (err) {
    console.error('[profileService] saveProfile unexpected error:', err);
  }
}

/**
 * Convert a Supabase `profiles` row back into the AppContext state shape.
 * @param {object} row
 * @returns {object} partial state to merge
 */
export function rowToState(row) {
  return {
    user: {
      name:           row.name,
      email:          row.email,
      age:            row.age,
      gender:         row.gender,
      weight:         row.weight,
      height:         row.height,
      activityLevel:  row.activity_level,
      goal:           row.goal,
      dietPreference: row.diet_preference,
    },
    mealPlan:          row.meal_plan,
    workoutPlan:       row.workout_plan,
    progressLog:       row.progress_log  || [],
    activityLog:       row.activity_log  || [],
    preferences:       row.preferences   || { notifications: true, workoutDays: [1,2,3,4,5] },
    activeDay:         row.active_day    ?? 1,
    activeWorkoutDay:  row.active_workout_day ?? 0,
  };
}
