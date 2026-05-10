/**
 * activityEngine.js
 * Pure utility functions for activity tracking, streak calculation,
 * gap detection, and smart workout/meal recommendations.
 */

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Returns today's date as 'YYYY-MM-DD' */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Returns a date N days ago as 'YYYY-MM-DD' */
export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Difference in calendar days between two 'YYYY-MM-DD' strings (a - b) */
export function daysBetween(a, b) {
  const msPerDay = 86_400_000;
  return Math.round((new Date(a) - new Date(b)) / msPerDay);
}

// ─── Log helpers ─────────────────────────────────────────────────────────────

/** Find today's log entry (or null) */
export function getTodayLog(activityLog) {
  const today = todayStr();
  return activityLog.find((e) => e.date === today) || null;
}

/** Find the most recent log entry date */
export function getLastLogDate(activityLog) {
  if (!activityLog.length) return null;
  const sorted = [...activityLog].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted[0].date;
}

/**
 * How many calendar days since the last log entry.
 * Returns 0 if there's a log today, Infinity if log is empty.
 */
export function getDaysSinceLastLog(activityLog) {
  const last = getLastLogDate(activityLog);
  if (!last) return Infinity;
  return daysBetween(todayStr(), last);
}

// ─── Streak ───────────────────────────────────────────────────────────────────

/**
 * Counts consecutive days (ending today or yesterday) where both
 * workoutDone AND mealsLogged are true.
 */
export function getStreakCount(activityLog, workoutDays = [1, 2, 3, 4, 5]) {
  if (!activityLog.length) return 0;

  const logMap = new Map(activityLog.map((e) => [e.date, e]));

  let streak = 0;
  let cursor = new Date();
  let availableFreezes = 1; // 1 freeze allowed per streak by default

  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dayOfWeek = cursor.getDay(); // 0=Sun, 1=Mon, etc.
    const isActiveDay = workoutDays.includes(dayOfWeek);
    const entry = logMap.get(dateStr);

    const isDone = isActiveDay 
      ? (entry?.workoutDone && entry?.mealsLogged) 
      : entry?.mealsLogged; // Rest day only needs meals

    if (isDone) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      // Optional: Regenerate a freeze every 7 streak days
      if (streak > 0 && streak % 7 === 0) availableFreezes++;
    } else if (i === 0) {
      // Grace: if today isn't logged yet, check if yesterday starts the streak
      cursor.setDate(cursor.getDate() - 1);
    } else if (availableFreezes > 0) {
      // Streak Freeze used
      availableFreezes--;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

export function getMissedTypes(activityLog, days = 1) {
  let missedWorkout = false;
  let missedMeal    = false;

  for (let i = 1; i <= days; i++) {
    const dateStr = daysAgoStr(i);
    const entry   = activityLog.find((e) => e.date === dateStr);
    if (!entry || !entry.workoutDone)  missedWorkout = true;
    if (!entry || !entry.mealsLogged)  missedMeal    = true;
  }

  return { workout: missedWorkout, meal: missedMeal };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function goalPhrase(goal) {
  return {
    muscle_gain: 'muscle growth',
    fat_loss:    'fat loss progress',
    maintenance: 'your maintenance targets',
  }[goal] || 'your goals';
}

/**
 * Returns the focus label of the next scheduled non-rest day in the workout plan.
 */
function getNextWorkoutFocus(workoutPlan) {
  const plan = workoutPlan?.weeklyPlan;
  if (!plan) return null;
  const next = plan.find((d) => !d.isRest);
  return next?.focus || null;
}

// ─── Smart Recommendations ────────────────────────────────────────────────────

/**
 * Generates an array of smart, prescriptive recommendation cards.
 *
 * Each card has:
 *   id, type ('tip' | 'warning' | 'danger' | 'comeback'),
 *   icon, title, body (multi-sentence plan), action, actionPage
 */
export function getSmartRecommendations(activityLog, workoutPlan, mealPlan, user) {
  const gap      = getDaysSinceLastLog(activityLog);
  const todayLog = getTodayLog(activityLog);
  const goal     = user?.goal || 'maintenance';
  const protein  = mealPlan?.daily_targets?.protein || null;
  const calories = mealPlan?.daily_targets?.calories || null;
  const focus    = getNextWorkoutFocus(workoutPlan);
  const split    = workoutPlan?.splitName || 'your workout plan';
  const gPhrase  = goalPhrase(goal);
  const recs     = [];

  // ── A) Today partially done ───────────────────────────────────────────────
  if (todayLog) {
    if (todayLog.workoutDone && !todayLog.mealsLogged) {
      recs.push({
        id:         'today-meal-missing',
        type:       'tip',
        icon:       '🍽️',
        title:      'Great workout — now lock in your nutrition!',
        body:       `You crushed today's session but haven't logged your meals yet. I suggest: eat a high-protein meal within 30 minutes (chicken + rice, or a whey shake works). Your daily target is${protein ? ` ${protein}g protein and ${calories} kcal` : ' listed in your diet plan'} — hit that to convert your effort into actual ${goal === 'muscle_gain' ? 'muscle' : 'results'}.`,
        action:     'View Meal Plan',
        actionPage: 'diet',
      });
    }

    if (!todayLog.workoutDone && todayLog.mealsLogged) {
      recs.push({
        id:         'today-workout-missing',
        type:       'tip',
        icon:       '💪',
        title:      `You've fuelled up — don't skip today's session!`,
        body:       `You've already logged your meals, so your body has fuel. I suggest you complete ${focus ? `today's ${focus} session` : 'your scheduled workout'} now before the day ends. Even a 30-minute session is far better than skipping — partial effort still drives adaptation.`,
        action:     'Go to Workouts',
        actionPage: 'workouts',
      });
    }

    // Both done — no recs needed, return empty
    return recs;
  }

  // ── B) First time ever / no history ───────────────────────────────────────
  if (gap === Infinity) {
    recs.push({
      id:         'first-time',
      type:       'tip',
      icon:       '🚀',
      title:      `Ready to start? Log your first activity today!`,
      body:       `I suggest beginning with ${focus ? `your ${focus} workout` : 'your first workout session'} and tracking your meals. Logging consistently from day one is the single biggest predictor of long-term success for ${gPhrase}. Tap the check-in buttons above to get started!`,
      action:     'View Workouts',
      actionPage: 'workouts',
    });
    return recs;
  }

  // ── C) Nothing logged today yet ───────────────────────────────────────────
  if (gap === 0) {
    recs.push({
      id:         'checkin-today',
      type:       'tip',
      icon:       '📋',
      title:      `Don't forget to check in today!`,
      body:       `Your streak is alive — don't let it die today. I suggest completing ${focus ? `your ${focus} session` : 'your workout'} first, then log both activities above to maintain momentum for ${gPhrase}.`,
      action:     'Check In Now',
      actionPage: 'dashboard',
    });
    return recs;
  }

  // ── D) Missed 1 day ───────────────────────────────────────────────────────
  if (gap === 1) {
    const { workout, meal } = getMissedTypes(activityLog, 1);

    if (workout && meal) {
      recs.push({
        id:         'miss-1day-both',
        type:       'warning',
        icon:       '⚠️',
        title:      `You skipped yesterday — here's how to bounce back today`,
        body:       `Missing one day is completely recoverable. To get back on track I suggest: (1) Complete ${focus ? `your ${focus} session` : 'today\'s workout'} today — don\'t try to "make up" yesterday\'s, just do today\'s. (2) Stick to your ${calories ? `${calories} kcal` : 'calorie'} target and prioritize${protein ? ` ${protein}g protein` : ' protein'} above all else. One missed day doesn't break progress — two days in a row does.`,
        action:     'View Today\'s Plan',
        actionPage: 'workouts',
      });
    } else if (workout) {
      recs.push({
        id:         'miss-1day-workout',
        type:       'warning',
        icon:       '🏋️',
        title:      `You skipped yesterday's workout — let's fix that today`,
        body:       `Your nutrition was on point yesterday, which is great. For the workout gap: I suggest doing ${focus ? `your ${focus} session` : 'today\'s scheduled workout'} today as planned. Don\'t try to double up or "punish" yourself — just get back to the routine. Consistency beats intensity.`,
        action:     'View Workouts',
        actionPage: 'workouts',
      });
    } else if (meal) {
      recs.push({
        id:         'miss-1day-meal',
        type:       'warning',
        icon:       '🥗',
        title:      `Yesterday's meals were untracked — refocus today`,
        body:       `Untracked meals can silently wreck ${gPhrase}. To get back on track: start today with a protein-rich breakfast (aim for 40–50g protein in the first 2 meals), then stay within your ${calories ? `${calories} kcal` : 'daily calorie'} target for the rest of the day. Don't restrict — just get back to the plan.`,
        action:     'View Diet Plan',
        actionPage: 'diet',
      });
    }
    return recs;
  }

  // ── E) Missed 2–3 days ────────────────────────────────────────────────────
  if (gap >= 2 && gap <= 3) {
    recs.push({
      id:         `miss-${gap}days-main`,
      type:       'warning',
      icon:       '🔔',
      title:      `You've been away ${plural(gap, 'day')} — time to get back on track`,
      body:       `${plural(gap, 'day')} off is significant but 100% recoverable. Here's your re-entry plan: **Today** — do ${focus ? `your ${focus} session` : 'a full workout'} at your normal intensity (your body remembers more than you think). **Diet** — aim for${protein ? ` ${protein}g protein` : ' your protein target'} today; skip the urge to restrict calories thinking you'll "make up" for the gap.${goal === 'muscle_gain' ? ' Muscle is only lost after 5–7+ days of zero stimulus — you\'re still safe.' : ''}`,
      action:     'Check In & Log',
      actionPage: 'dashboard',
    });

    recs.push({
      id:         `miss-${gap}days-workout`,
      type:       'tip',
      icon:       '🏃',
      title:      `Re-entry workout tip: don't try to cram two sessions into one`,
      body:       `After ${plural(gap, 'day')} off, just execute today's scheduled ${focus || 'session'} as written in your ${split}. Attempting to "catch up" with extra volume risks injury and overtraining. Keep the same sets and reps — your strength will feel the same or very close.`,
      action:     'View Workouts',
      actionPage: 'workouts',
    });

    return recs;
  }

  // ── F) Missed 4–6 days ────────────────────────────────────────────────────
  if (gap >= 4 && gap <= 6) {
    recs.push({
      id:         `miss-${gap}days-danger`,
      type:       'danger',
      icon:       '🚨',
      title:      `${plural(gap, 'day')} without activity — here's your recovery protocol`,
      body:       `${gap} days is in the danger zone for ${gPhrase}. ${goal === 'muscle_gain' ? 'Muscle protein synthesis drops significantly after 4–5 days without stimulus.' : goal === 'fat_loss' ? 'Extended breaks spike cortisol and can trigger fat storage even on normal calories.' : 'Your baseline fitness is declining day by day.'} Here's exactly what I suggest today: (1) Start with a **lower-volume workout** — cut your normal sets by 1 per exercise to avoid extreme soreness that would force another rest day. (2) Eat at your normal target (${calories ? `${calories} kcal` : 'your calorie goal'}) — don't skip meals thinking it compensates.`,
      action:     'Check In & Restart',
      actionPage: 'dashboard',
    });

    recs.push({
      id:         `miss-${gap}days-nutrition`,
      type:       'warning',
      icon:       '🥩',
      title:      `Priority #1 this week: hit your protein every single day`,
      body:       `After a ${gap}-day gap, your muscle retention depends almost entirely on protein intake going forward. I suggest making${protein ? ` ${protein}g of protein` : ' your protein target'} non-negotiable today. Practical tip: spread it across all 5 meals — have a protein source at every single meal slot (breakfast, lunch, pre-workout, dinner, snack).`,
      action:     'View Diet Plan',
      actionPage: 'diet',
    });

    return recs;
  }

  // ── G) Missed 7+ days ─────────────────────────────────────────────────────
  if (gap >= 7) {
    const weeks = Math.floor(gap / 7);
    const weekLabel = weeks === 1 ? 'a week' : `${weeks} weeks`;

    recs.push({
      id:         'miss-7plus-comeback',
      type:       'comeback',
      icon:       '🔥',
      title:      `You've been away for ${weekLabel} — here's your full Comeback Protocol`,
      body:       `Welcome back! Being away for ${gap} days is a real setback, but it's fully reversible. Here's your structured comeback plan:\n\n📅 **Week 1 (Days 1–3):** Reduce all workout weights by 25–30%. Focus on form, not load. Your nervous system needs to re-sync.\n📅 **Days 4–7:** Bring intensity back to 80% of your previous level.\n📅 **Week 2:** Return to full load.\n\n🍱 **Nutrition reset:** For the first 3 days, focus only on hitting${protein ? ` ${protein}g protein` : ' your protein target'} — don't stress total calories yet. Protein retention is priority #1 after a long break.`,
      action:     'Start Comeback',
      actionPage: 'dashboard',
    });

    recs.push({
      id:         'miss-7plus-workout-tip',
      type:       'danger',
      icon:       '💪',
      title:      `Don't go full-intensity on your first session back`,
      body:       `After ${weekLabel} off, your connective tissue (tendons, ligaments) decondition faster than your muscles. Going heavy on Day 1 back is a guaranteed injury. I suggest: do today's ${focus ? focus : 'workout'} with 70% of your normal weights, full range of motion, controlled tempo. You'll feel stronger than you think — still hold back. Protect the comeback.`,
      action:     'View Workouts',
      actionPage: 'workouts',
    });

    recs.push({
      id:         'miss-7plus-diet-reset',
      type:       'danger',
      icon:       '🍱',
      title:      `Reset your nutrition with one simple rule this week`,
      body:       `Don't try to follow every macro perfectly on Day 1 back — that's too overwhelming and leads to quitting again. This week's single rule: eat${protein ? ` ${protein}g protein` : ' your protein target'} every day, no matter what else. Once that's consistent for 3 days, layer in calorie tracking. Small wins compound fast.`,
      action:     'View Diet Plan',
      actionPage: 'diet',
    });

    return recs;
  }

  return recs;
}
