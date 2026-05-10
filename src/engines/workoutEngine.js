import { EXERCISES_DATA } from '../data/exercises.js';

// ─── Workout splits per goal ──────────────────────────────────────────────────
const GOAL_SPLITS = {
  muscle_gain: {
    name: 'PPL (Push Pull Legs)',
    days: [
      { dayName: 'Monday',    focus: 'Push (Chest + Shoulders + Triceps)', muscleGroups: ['Chest', 'Shoulder', 'Triceps'] },
      { dayName: 'Tuesday',   focus: 'Pull (Back + Biceps)',                muscleGroups: ['Back', 'Biceps'] },
      { dayName: 'Wednesday', focus: 'Legs',                               muscleGroups: ['Legs'] },
      { dayName: 'Thursday',  focus: 'Push (Chest + Shoulders + Triceps)', muscleGroups: ['Chest', 'Shoulder', 'Triceps'] },
      { dayName: 'Friday',    focus: 'Pull (Back + Biceps)',                muscleGroups: ['Back', 'Biceps'] },
      { dayName: 'Saturday',  focus: 'Legs + Core',                        muscleGroups: ['Legs'] },
      { dayName: 'Sunday',    focus: 'Rest & Recovery',                    muscleGroups: [], isRest: true },
    ],
    setsReps: { compound: { sets: 4, reps: '8-10' }, isolation: { sets: 3, reps: '12-15' } },
  },
  fat_loss: {
    name: 'Upper / Lower Split',
    days: [
      { dayName: 'Monday',    focus: 'Upper Body',         muscleGroups: ['Chest', 'Back', 'Shoulder'] },
      { dayName: 'Tuesday',   focus: 'Lower Body',         muscleGroups: ['Legs'] },
      { dayName: 'Wednesday', focus: 'Active Recovery',    muscleGroups: [], isRest: true },
      { dayName: 'Thursday',  focus: 'Upper Body + Arms',  muscleGroups: ['Chest', 'Back', 'Biceps', 'Triceps'] },
      { dayName: 'Friday',    focus: 'Lower Body',         muscleGroups: ['Legs'] },
      { dayName: 'Saturday',  focus: 'Full Body Circuit',  muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulder'] },
      { dayName: 'Sunday',    focus: 'Rest & Recovery',    muscleGroups: [], isRest: true },
    ],
    setsReps: { compound: { sets: 3, reps: '12-15' }, isolation: { sets: 3, reps: '15-20' } },
  },
  maintenance: {
    name: 'Full Body 3x Week',
    days: [
      { dayName: 'Monday',    focus: 'Full Body A',        muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulder'] },
      { dayName: 'Tuesday',   focus: 'Active Rest',        muscleGroups: [], isRest: true },
      { dayName: 'Wednesday', focus: 'Full Body B',        muscleGroups: ['Chest', 'Back', 'Legs', 'Biceps', 'Triceps'] },
      { dayName: 'Thursday',  focus: 'Active Rest',        muscleGroups: [], isRest: true },
      { dayName: 'Friday',    focus: 'Full Body C',        muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulder', 'Biceps'] },
      { dayName: 'Saturday',  focus: 'Mobility & Core',    muscleGroups: [], isRest: true },
      { dayName: 'Sunday',    focus: 'Rest & Recovery',    muscleGroups: [], isRest: true },
    ],
    setsReps: { compound: { sets: 3, reps: '10-12' }, isolation: { sets: 3, reps: '12-15' } },
  },
};

// ─── Activity level caps ──────────────────────────────────────────────────────
const EXERCISE_COUNT = {
  sedentary:  { compound: 2, isolation: 2 },
  moderate:   { compound: 2, isolation: 3 },
  active:     { compound: 3, isolation: 4 },
};

// ─── Shuffle helper ───────────────────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Select exercises for a session ──────────────────────────────────────────
function selectExercisesForDay(muscleGroups, setsReps, counts, usedIds) {
  const allExercises = EXERCISES_DATA;

  // Get exercises for the required muscle groups
  const pool = allExercises.filter(e => muscleGroups.includes(e['Muscle_Group']));

  const compounds = pool.filter(e => e['Exercise_Type'] === 'Compound');
  const isolations = pool.filter(e => e['Exercise_Type'] === 'Isolation');

  const selected = [];
  const newUsedIds = new Set(usedIds);

  // Pick compounds
  const availableCompounds = shuffleArray(compounds.filter(e => !newUsedIds.has(e['Exerice_id'])));
  const fallbackCompounds = shuffleArray(compounds);
  const compoundPool = availableCompounds.length >= counts.compound
    ? availableCompounds : fallbackCompounds;

  const pickedCompounds = compoundPool.slice(0, counts.compound);
  pickedCompounds.forEach(e => {
    selected.push({
      id: e['Exerice_id'],
      name: e['Targeted_Exercises'],
      muscleGroup: e['Muscle_Group'],
      equipment: e['Equipment'],
      type: e['Exercise_Type'],
      movement: e['Movement_pattern'],
      sets: setsReps.compound.sets,
      reps: setsReps.compound.reps,
    });
    newUsedIds.add(e['Exerice_id']);
  });

  // Pick isolations
  const availableIsolations = shuffleArray(isolations.filter(e => !newUsedIds.has(e['Exerice_id'])));
  const fallbackIsolations = shuffleArray(isolations);
  const isolationPool = availableIsolations.length >= counts.isolation
    ? availableIsolations : fallbackIsolations;

  const pickedIsolations = isolationPool.slice(0, counts.isolation);
  pickedIsolations.forEach(e => {
    selected.push({
      id: e['Exerice_id'],
      name: e['Targeted_Exercises'],
      muscleGroup: e['Muscle_Group'],
      equipment: e['Equipment'],
      type: e['Exercise_Type'],
      movement: e['Movement_pattern'],
      sets: setsReps.isolation.sets,
      reps: setsReps.isolation.reps,
    });
    newUsedIds.add(e['Exerice_id']);
  });

  return selected;
}

// ─── Main Workout Engine ──────────────────────────────────────────────────────
export function generateWorkoutPlan(userData) {
  const { goal, activityLevel } = userData;

  const split = GOAL_SPLITS[goal] || GOAL_SPLITS.maintenance;
  const counts = EXERCISE_COUNT[activityLevel] || EXERCISE_COUNT.moderate;

  const weeklyPlan = split.days.map((dayConfig, idx) => {
    if (dayConfig.isRest || dayConfig.muscleGroups.length === 0) {
      return {
        dayIndex: idx,
        dayName: dayConfig.dayName,
        focus: dayConfig.focus,
        isRest: true,
        exercises: [],
        estimatedDuration: '—',
      };
    }

    const exercises = selectExercisesForDay(
      dayConfig.muscleGroups,
      split.setsReps,
      counts,
      new Set()
    );

    const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    const estimatedMinutes = totalSets * 3 + 10; // ~3 min per set + warmup

    return {
      dayIndex: idx,
      dayName: dayConfig.dayName,
      focus: dayConfig.focus,
      muscleGroups: dayConfig.muscleGroups,
      isRest: false,
      exercises,
      estimatedDuration: `${estimatedMinutes} min`,
    };
  });

  return {
    splitName: split.name,
    goal,
    activityLevel,
    weeklyPlan,
  };
}

// ─── Muscle group color map ───────────────────────────────────────────────────
export const MUSCLE_COLORS = {
  Chest: '#3b82f6',
  Back: '#8b5cf6',
  Shoulder: '#10b981',
  Biceps: '#f59e0b',
  Triceps: '#ef4444',
  Legs: '#06b6d4',
};

export function getMuscleColor(muscleGroup) {
  return MUSCLE_COLORS[muscleGroup] || '#6366f1';
}
