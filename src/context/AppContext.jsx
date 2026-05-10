import { useReducer, useEffect, useRef } from 'react';
import AppContext from './AppContextObj.jsx';
import { generateMealPlan } from '../engines/nutritionEngine.js';
import { generateWorkoutPlan } from '../engines/workoutEngine.js';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Capacitor } from '@capacitor/core';
import { fetchProfile, saveProfile, rowToState } from '../services/profileService.js';

const initialState = {
  isInitializing: true,
  isAuthenticated: false,
  user: null,
  mealPlan: null,
  workoutPlan: null,
  progressLog: [],
  activityLog: [],  // { date, appVisited, workoutDone, mealsLogged }[]
  activeDay: 1,
  activeWorkoutDay: 0,
  preferences: {
    notifications: true,
    workoutDays: [1, 2, 3, 4, 5], // 0=Sun, 1=Mon... default to Mon-Fri
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'FINISH_INIT':
      return { ...state, isInitializing: false };

    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload, isInitializing: false };

    // Restore full state from Supabase after login
    case 'RESTORE_PROFILE':
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        isInitializing: false,
      };

    case 'LOGOUT':
      return { ...initialState, isInitializing: false };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'SET_MEAL_PLAN':
      return { ...state, mealPlan: action.payload };

    case 'SET_WORKOUT_PLAN':
      return { ...state, workoutPlan: action.payload };

    case 'REGENERATE_PLANS': {
      const user = action.payload || state.user;
      if (!user) return state;
      const mealPlan    = generateMealPlan(user);
      const workoutPlan = generateWorkoutPlan(user);
      return { ...state, mealPlan, workoutPlan };
    }

    case 'SET_ACTIVE_DAY':
      return { ...state, activeDay: action.payload };

    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };

    case 'SET_ACTIVE_WORKOUT_DAY':
      return { ...state, activeWorkoutDay: action.payload };

    case 'LOG_PROGRESS':
      return {
        ...state,
        progressLog: [action.payload, ...state.progressLog].slice(0, 90),
      };

    case 'TRACK_APP_VISIT': {
      // Fires on every page navigation — marks the user as "seen today"
      // but does NOT set workoutDone or mealsLogged.
      const { date } = action.payload;
      const existing = state.activityLog.find((e) => e.date === date) || {};
      if (existing.appVisited) return state; // already marked, no re-render needed
      const updated  = { ...existing, date, appVisited: true };
      const filtered = state.activityLog.filter((e) => e.date !== date);
      return {
        ...state,
        activityLog: [updated, ...filtered].slice(0, 365),
      };
    }

    case 'TRACK_ACTIVITY': {
      // Fires when the user explicitly completes a workout or logs meals.
      // type: 'workout' | 'diet'
      // Flags are additive — once true they stay true for the day.
      const { actType, date } = action.payload;
      const existing = state.activityLog.find((e) => e.date === date) || {};
      const updated  = {
        ...existing,
        date,
        appVisited:  true,
        workoutDone: existing.workoutDone || actType === 'workout',
        mealsLogged: existing.mealsLogged || actType === 'diet',
      };
      const filtered = state.activityLog.filter((e) => e.date !== date);
      return {
        ...state,
        activityLog: [updated, ...filtered].slice(0, 365),
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const stored = localStorage.getItem('crazyBuildState');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration guard: clear old 4-meal plans so new 5-meal format is used
        const firstDay      = parsed?.mealPlan?.plan?.[0];
        const hasPreWorkout = firstDay && 'pre_workout' in (firstDay.meals || {});
        if (parsed?.mealPlan && !hasPreWorkout) {
          parsed.mealPlan    = null;
          parsed.workoutPlan = null;
        }
        return { ...initialState, ...parsed };
      }
    } catch {}
    return { ...initialState, isInitializing: true };
  });

  // ── Debounce ref for Supabase saves ──────────────────────────────────────────
  const saveTimerRef = useRef(null);

  // ── Check auth token on mount, then fetch profile from Supabase ──────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        let token = null;
        if (Capacitor.isNativePlatform()) {
          const res = await SecureStoragePlugin.get({ key: 'session_token' });
          token = res.value;
        } else {
          token = localStorage.getItem('session_token');
        }

        if (token && state.user?.email) {
          // Token present — try to restore from Supabase first
          const row = await fetchProfile(state.user.email);

          if (row) {
            // ✅ Returning user — restore full profile from cloud
            const restoredState = rowToState(row);

            // Migration guard on restored meal plan
            const firstDay      = restoredState.mealPlan?.plan?.[0];
            const hasPreWorkout = firstDay && 'pre_workout' in (firstDay.meals || {});
            if (restoredState.mealPlan && !hasPreWorkout) {
              restoredState.mealPlan    = null;
              restoredState.workoutPlan = null;
            }

            dispatch({ type: 'RESTORE_PROFILE', payload: restoredState });
          } else {
            // New user with a valid token but no cloud profile yet
            // (e.g. dev bypass) — just log them in with cached local user
            dispatch({ type: 'LOGIN', payload: state.user });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    }
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist to localStorage (fast, offline-safe) ─────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('crazyBuildState', JSON.stringify({
        isAuthenticated:  state.isAuthenticated,
        user:             state.user,
        mealPlan:         state.mealPlan,
        workoutPlan:      state.workoutPlan,
        progressLog:      state.progressLog,
        activityLog:      state.activityLog,
        activeDay:        state.activeDay,
        activeWorkoutDay: state.activeWorkoutDay,
        preferences: {
          notifications: true,
          workoutDays:   [1, 2, 3, 4, 5],
          ...state.preferences,
        },
      }));
    } catch {}
  }, [state]);

  // ── Debounced auto-save to Supabase (2 s after last change) ──────────────────
  useEffect(() => {
    if (!state.isAuthenticated || !state.user?.email) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProfile(state.user.email, state);
    }, 2000);

    return () => clearTimeout(saveTimerRef.current);
  }, [state]);

  // ── Auto-regenerate plans when missing ────────────────────────────────────────
  useEffect(() => {
    if (state.isAuthenticated && state.user && !state.mealPlan) {
      dispatch({ type: 'SET_MEAL_PLAN',    payload: generateMealPlan(state.user) });
      dispatch({ type: 'SET_WORKOUT_PLAN', payload: generateWorkoutPlan(state.user) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const actions = {
    /**
     * Called right after OTP verification.
     * Checks Supabase first — returning users get their full profile back.
     * New users get freshly generated plans.
     */
    login: async (userData) => {
      const row = await fetchProfile(userData.email);

      if (row) {
        // ✅ Returning user — restore everything from Supabase
        const restoredState = rowToState(row);

        // Migration guard
        const firstDay      = restoredState.mealPlan?.plan?.[0];
        const hasPreWorkout = firstDay && 'pre_workout' in (firstDay.meals || {});
        if (restoredState.mealPlan && !hasPreWorkout) {
          restoredState.mealPlan    = null;
          restoredState.workoutPlan = null;
        }

        dispatch({ type: 'RESTORE_PROFILE', payload: restoredState });
      } else {
        // 🆕 New user — generate fresh plans and create their cloud profile
        const mealPlan    = generateMealPlan(userData);
        const workoutPlan = generateWorkoutPlan(userData);
        dispatch({ type: 'LOGIN',            payload: userData });
        dispatch({ type: 'SET_MEAL_PLAN',    payload: mealPlan });
        dispatch({ type: 'SET_WORKOUT_PLAN', payload: workoutPlan });
        // Initial cloud save (fire and forget)
        saveProfile(userData.email, {
          ...initialState,
          user: userData,
          mealPlan,
          workoutPlan,
          isAuthenticated: true,
        });
      }
    },

    logout: () => {
      clearTimeout(saveTimerRef.current);
      localStorage.removeItem('crazyBuildState');
      localStorage.removeItem('session_token');
      dispatch({ type: 'LOGOUT' });
    },

    updateUser: (updates) => {
      dispatch({ type: 'UPDATE_USER', payload: updates });
    },

    regeneratePlans: (overrideUser) => {
      dispatch({ type: 'REGENERATE_PLANS', payload: overrideUser || null });
    },

    setActiveDay: (day) => {
      dispatch({ type: 'SET_ACTIVE_DAY', payload: day });
    },

    updatePreferences: (prefs) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: prefs });
    },

    setActiveWorkoutDay: (idx) => {
      dispatch({ type: 'SET_ACTIVE_WORKOUT_DAY', payload: idx });
    },

    logProgress: (entry) => {
      dispatch({
        type: 'LOG_PROGRESS',
        payload: { ...entry, date: entry.date || new Date().toISOString().split('T')[0] },
      });
    },

    // Fires on every navigation (passive presence signal)
    trackPageVisit: (page) => {
      void page;
      dispatch({
        type:    'TRACK_APP_VISIT',
        payload: { date: new Date().toISOString().split('T')[0] },
      });
    },

    // Fires when the user explicitly marks workout done or meals logged
    // actType: 'workout' | 'diet'
    // date: optional 'YYYY-MM-DD'
    trackActivity: (actType, dateOverride) => {
      dispatch({
        type:    'TRACK_ACTIVITY',
        payload: { actType, date: dateOverride || new Date().toISOString().split('T')[0] },
      });
    },
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}
