import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import { RefreshCw, ChevronDown, ChevronUp, Clock, Dumbbell, CheckCircle2, Trophy } from 'lucide-react';
import { Badge, SectionHeader } from '../components/UI.jsx';
import { getMuscleColor } from '../engines/workoutEngine.js';
import { getTodayLog, getDaysSinceLastLog, daysAgoStr } from '../engines/activityEngine.js';

const DAY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#64748b'];

function ExerciseRow({ ex, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="exercise-card flex items-center gap-3"
    >
      {/* Index */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: 'rgba(37,99,235,0.2)' }}>
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: getMuscleColor(ex.muscleGroup) }}>
            {ex.muscleGroup}
          </span>
          <span style={{ color: '#334155', fontSize: '10px' }}>•</span>
          <span className="text-xs" style={{ color: '#64748b' }}>{ex.equipment}</span>
          <span style={{ color: '#334155', fontSize: '10px' }}>•</span>
          <span className="text-xs" style={{ color: '#475569' }}>{ex.movement}</span>
        </div>
      </div>

      {/* Sets × Reps */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>
          {ex.sets} × {ex.reps}
        </p>
        <p className="text-xs" style={{ color: '#475569' }}>
          {ex.type === 'Compound' ? 'Compound' : 'Isolation'}
        </p>
      </div>
    </motion.div>
  );
}

function WorkoutDayCard({ dayData, index, isActive, onToggle }) {
  const color = DAY_COLORS[index % DAY_COLORS.length];

  if (dayData.isRest) {
    return (
      <div className="card opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.2)' }}>
            😴
          </div>
          <div>
            <p className="text-sm font-bold text-white">{dayData.dayName}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{dayData.focus}</p>
          </div>
          <div className="ml-auto">
            <Badge color="blue">Rest Day</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div layout className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Day header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Color indicator */}
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />

        {/* Day info */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Dumbbell size={18} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{dayData.dayName}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>{dayData.focus}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold" style={{ color }}>
              {dayData.exercises.length} exercises
            </p>
            <p className="text-xs" style={{ color: '#475569' }}>{dayData.estimatedDuration}</p>
          </div>
          {isActive
            ? <ChevronUp size={16} style={{ color: '#64748b' }} />
            : <ChevronDown size={16} style={{ color: '#64748b' }} />}
        </div>
      </button>

      {/* Muscle group tags */}
      {!isActive && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {dayData.muscleGroups?.map(mg => (
            <span key={mg} className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${getMuscleColor(mg)}15`, color: getMuscleColor(mg), border: `1px solid ${getMuscleColor(mg)}30` }}>
              {mg}
            </span>
          ))}
        </div>
      )}

      {/* Expanded exercises */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2"
              style={{ borderTop: '1px solid rgba(37,99,235,0.08)' }}>
              <div className="flex items-center gap-3 pt-3 pb-1 flex-wrap">
                {dayData.muscleGroups?.map(mg => (
                  <span key={mg} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${getMuscleColor(mg)}15`, color: getMuscleColor(mg), border: `1px solid ${getMuscleColor(mg)}30` }}>
                    {mg}
                  </span>
                ))}
                <span className="text-xs ml-auto flex items-center gap-1" style={{ color: '#475569' }}>
                  <Clock size={11} /> {dayData.estimatedDuration}
                </span>
              </div>
              {dayData.exercises.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Today Workout Banner ──────────────────────────────────────────────────────
function TodayWorkoutBanner({ todayLog, onMarkDone }) {
  const done = todayLog?.workoutDone;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4"
      style={{
        background: done
          ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.06) 100%)'
          : 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(99,102,241,0.06) 100%)',
        border: done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(37,99,235,0.2)',
      }}
    >
      <div className="text-2xl select-none">{done ? '🏆' : '💪'}</div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: done ? '#10b981' : '#e2e8f0' }}>
          {done ? 'Today\'s workout is done — great work!' : 'Did you complete today\'s workout?'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
          {done
            ? 'This day is logged. Dashboard will show your streak update.'
            : 'Mark it done to update your streak and get personalized recommendations.'}
        </p>
      </div>
      {!done && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMarkDone}
          id="mark-workout-done-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
          }}
        >
          <CheckCircle2 size={16} /> Mark Done
        </motion.button>
      )}
      {done && <Trophy size={20} style={{ color: '#10b981', flexShrink: 0 }} />}
    </motion.div>
  );
}

export default function WorkoutsPage() {
  const { state, regeneratePlans, trackActivity } = useApp();
  const { workoutPlan, activityLog = [] } = state;
  const [activeDay, setActiveDay] = useState(null);
  const todayLog = getTodayLog(activityLog);
  const daysInactive = getDaysSinceLastLog(activityLog);

  // Check if yesterday was missed
  const missedYesterday = daysInactive === 1 || 
    (daysInactive > 1 && !activityLog.find(e => e.date === daysAgoStr(1))?.workoutDone);

  if (!workoutPlan) {
    return (
      <div className="page-container flex items-center justify-center">
        <p style={{ color: '#64748b' }}>No workout plan found. Please log in again.</p>
      </div>
    );
  }

  const { splitName, weeklyPlan } = workoutPlan;
  const totalExercises = weeklyPlan.reduce((s, d) => s + d.exercises.length, 0);
  const workDays = weeklyPlan.filter(d => !d.isRest).length;

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">{splitName}</h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {workDays} training days • {totalExercises} total exercises
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={regeneratePlans}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Regenerate
        </motion.button>
      </motion.div>

      {/* ✅ Today's Workout Completion Banner */}
      <TodayWorkoutBanner
        todayLog={todayLog}
        onMarkDone={() => trackActivity('workout')}
      />

      {/* ⏪ Retroactive Logging Banner (Streak Protection) */}
      {missedYesterday && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col sm:flex-row items-center gap-4"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="text-2xl select-none">⏪</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-white">Did you work out yesterday?</p>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Protect your streak by logging it retroactively.
            </p>
          </div>
          <button
            onClick={() => trackActivity('workout', daysAgoStr(1))}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#f59e0b', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}
          >
            Log Yesterday
          </button>
        </motion.div>
      )}


      {/* Weekly summary pills */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {weeklyPlan.map((d, i) => (
            <button key={i}
              onClick={() => setActiveDay(activeDay === i ? null : i)}
              className={`day-pill flex-shrink-0 ${activeDay === i ? 'active' : ''}`}>
              {d.dayName.slice(0, 3)}
              {d.isRest && ' 😴'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Split info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Split Type</p>
          <p className="text-sm font-bold text-white">{splitName}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Goal</p>
          <p className="text-sm font-bold text-white capitalize">{workoutPlan.goal?.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Level</p>
          <p className="text-sm font-bold text-white capitalize">{workoutPlan.activityLevel}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Training Days</p>
          <p className="text-sm font-bold text-white">{workDays} / 7</p>
        </div>
      </motion.div>

      {/* Day Cards */}
      <div className="space-y-3">
        {weeklyPlan.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <WorkoutDayCard
              dayData={day}
              index={i}
              isActive={activeDay === i}
              onToggle={() => setActiveDay(activeDay === i ? null : i)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

