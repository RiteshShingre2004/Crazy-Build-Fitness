import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import { RefreshCw, ChevronLeft, ChevronRight, Clock, Zap, AlertCircle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { SectionHeader, Badge, MacroBar } from '../components/UI.jsx';
import { getTodayLog, getDaysSinceLastLog, daysAgoStr } from '../engines/activityEngine.js';

// ─── Parse a key-ingredient string e.g. "160g roasted chicken breast" ─────────
// Returns { qty: '160g', name: 'roasted chicken breast' }
function parseIngredient(raw) {
  const str = raw.trim();
  const m = str.match(/^(\d+(?:\.\d+)?\s*(?:g|ml|kg|pcs?|pieces?|whole|medium|large|small|tbsp|tsp|scoop|slices?|squares?|cups?)(?:\s+\w+)?)(?=\s)/);
  if (m) return { qty: m[1].trim(), name: str.slice(m[1].length).trim() };
  return { qty: null, name: str };
}

const SLOT_CONFIG = {
  breakfast:   { icon: '🌅', label: 'Breakfast',    color: '#f59e0b', pct: '25%' },
  lunch:       { icon: '☀️', label: 'Lunch',         color: '#10b981', pct: '30%' },
  dinner:      { icon: '🌙', label: 'Dinner',        color: '#6366f1', pct: '25%' },
  pre_workout: { icon: '⚡', label: 'Pre-Workout',   color: '#3b82f6', pct: '10%' },
  snack:       { icon: '🍎', label: 'Snack',         color: '#ef4444', pct: '10%' },
};

// ─── Protein gap indicator ────────────────────────────────────────────────────
function ProteinStatus({ actual, target }) {
  const pct   = target > 0 ? (actual / target) * 100 : 0;
  const gap   = target - actual;
  const good  = pct >= 80;
  const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex items-center gap-2 text-xs">
      {good
        ? <CheckCircle size={13} style={{ color: '#34d399' }} />
        : <AlertCircle size={13} style={{ color }}/>
      }
      <span style={{ color }}>
        {good
          ? `Protein: ${actual}g ✓ (${Math.round(pct)}% of target)`
          : `Protein: ${actual}g — ${gap}g below target (add protein shake or egg whites)`
        }
      </span>
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ slot, meal }) {
  const [expanded, setExpanded] = useState(false);
  const config = SLOT_CONFIG[slot] || SLOT_CONFIG.snack;

  return (
    <motion.div
      layout
      className="meal-card cursor-pointer"
      onClick={() => setExpanded(e => !e)}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: config.color }}>
              {config.label}
            </span>
            <span className="text-xs" style={{ color: '#334155' }}>{config.pct} of day</span>
            {meal.isHighProtein && <Badge color="green">High Protein</Badge>}
            {meal.isLowCalorie  && <Badge color="cyan">Low Cal</Badge>}
          </div>
          <p className="text-sm font-semibold text-white truncate">{meal.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white">{meal.calories}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>kcal</p>
        </div>
      </div>

      {/* Macro pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="tag tag-green">🥩 {meal.protein}g P</span>
        <span className="tag tag-orange">🍞 {meal.carbs}g C</span>
        <span className="tag tag-blue">🧈 {meal.fats}g F</span>
        {meal.fiber > 0 && (
          <span className="tag tag-purple">🌿 {meal.fiber}g Fiber</span>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 space-y-2"
              style={{ borderTop: '1px solid rgba(37,99,235,0.1)' }}>
              {meal.keyIngredients && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>
                    📦 Ingredients &amp; Portions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meal.keyIngredients.split(' · ').map((item, idx) => {
                      const { qty, name } = parseIngredient(item);
                      return (
                        <span
                          key={idx}
                          className="text-xs rounded-lg font-medium flex items-center overflow-hidden"
                          style={{ border: '1px solid rgba(59,130,246,0.22)' }}
                        >
                          {qty && (
                            <span style={{
                              background: 'rgba(59,130,246,0.28)',
                              color: '#93c5fd',
                              padding: '2px 7px',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              letterSpacing: '0.03em',
                              flexShrink: 0,
                            }}>
                              {qty}
                            </span>
                          )}
                          <span style={{
                            color: '#cbd5e1',
                            padding: '2px 7px',
                            paddingLeft: qty ? '5px' : '7px',
                          }}>
                            {name}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#64748b' }}>
                {meal.prepTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Prep: {meal.prepTime} min
                  </span>
                )}
                {meal.cookTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap size={11} /> Cook: {meal.cookTime} min
                  </span>
                )}
                <span>{meal.servingSize} {meal.servingUnit}</span>
                <span className="capitalize" style={{ color: '#475569' }}>{meal.dietType}</span>
              </div>
              {meal.fitnessGoal && (
                <p className="text-xs mt-1" style={{ color: '#3b82f6' }}>
                  🎯 {meal.fitnessGoal}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Today Meals Banner ────────────────────────────────────────────────────────
function TodayMealsBanner({ todayLog, onMarkLogged }) {
  const done = todayLog?.mealsLogged;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4"
      style={{
        background: done
          ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(234,88,12,0.06) 100%)'
          : 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(99,102,241,0.06) 100%)',
        border: done ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(37,99,235,0.2)',
      }}
    >
      <div className="text-2xl select-none">{done ? '✅' : '🍽️'}</div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: done ? '#f59e0b' : '#e2e8f0' }}>
          {done ? "Today's meals are logged — on track!" : "Have you followed today's meal plan?"}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
          {done
            ? 'Nutrition logged. Dashboard will reflect your full daily streak.'
            : 'Tap to confirm and keep your streak alive.'}
        </p>
      </div>
      {!done && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMarkLogged}
          id="mark-meals-logged-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
          }}
        >
          <CheckCircle2 size={16} /> Meals Logged
        </motion.button>
      )}
      {done && <CheckCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />}
    </motion.div>
  );
}

// ── DietPage ──────────────────────────────────────────────────────────────────
export default function DietPage() {
  const { state, setActiveDay, regeneratePlans, trackActivity } = useApp();
  const { mealPlan, activeDay, activityLog = [] } = state;
  const scrollRef = useRef(null);
  const todayLog  = getTodayLog(activityLog);
  const daysInactive = getDaysSinceLastLog(activityLog);

  // Check if yesterday was missed
  const missedYesterday = daysInactive === 1 || 
    (daysInactive > 1 && !activityLog.find(e => e.date === daysAgoStr(1))?.mealsLogged);

  if (!mealPlan) {
    return (
      <div className="page-container flex items-center justify-center">
        <p style={{ color: '#64748b' }}>No meal plan found. Please log in again.</p>
      </div>
    );
  }

  const { daily_targets: targets, plan, proteinMultiplier } = mealPlan;
  const dayData = plan[activeDay - 1];

  const scrollDays = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += dir * 200;
  };

  // Protein gap data
  const proteinPct = targets.protein > 0
    ? (dayData.totals.protein / targets.protein) * 100
    : 0;

  return (
    <div className="page-container space-y-5">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">30-Day Diet Plan</h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            5 meals/day · {targets.calories} kcal · {targets.protein}g protein
            {proteinMultiplier && (
              <span style={{ color: '#3b82f6' }}> ({proteinMultiplier}g/kg)</span>
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={regeneratePlans}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Regenerate
        </motion.button>
      </motion.div>

      {/* ✅ Today Meals Completion Banner */}
      <TodayMealsBanner
        todayLog={todayLog}
        onMarkLogged={() => trackActivity('diet')}
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
            <p className="text-sm font-bold text-white">Did you follow your diet yesterday?</p>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Protect your streak by logging it retroactively.
            </p>
          </div>
          <button
            onClick={() => trackActivity('diet', daysAgoStr(1))}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#f59e0b', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}
          >
            Log Yesterday
          </button>
        </motion.div>
      )}

      {/* ── Daily Targets Summary ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Calories', value: targets.calories, unit: 'kcal', color: '#3b82f6' },
            { label: 'Protein',  value: `${targets.protein}g`,  unit: '', color: '#10b981' },
            { label: 'Carbs',    value: `${targets.carbs}g`,    unit: '', color: '#f59e0b' },
            { label: 'Fats',     value: `${targets.fats}g`,     unit: '', color: '#ef4444' },
          ].map((m, i) => (
            <div key={i} className="rounded-xl p-3 text-center"
              style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
              <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Day Selector ── */}
      <div className="flex items-center gap-2">
        <button onClick={() => scrollDays(-1)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center btn-ghost p-0">
          <ChevronLeft size={16} />
        </button>
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto flex-1 pb-1"
          style={{ scrollbarWidth: 'none' }}>
          {plan.map((d) => (
            <button key={d.day} onClick={() => setActiveDay(d.day)}
              className={`day-pill ${activeDay === d.day ? 'active' : ''}`}>
              Day {d.day}
            </button>
          ))}
        </div>
        <button onClick={() => scrollDays(1)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center btn-ghost p-0">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Day Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeDay}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.28 }}
        >
          {/* Day Summary Card */}
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white">Day {activeDay} Summary</h3>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#64748b' }}>
                <span>{dayData.totals.calories} / {targets.calories} kcal</span>
                <span style={{ color: '#10b981' }}>{dayData.totals.protein}g / {targets.protein}g protein</span>
              </div>
            </div>

            {/* Macro bars */}
            <div className="space-y-2 mb-3">
              <MacroBar label="Calories" value={dayData.totals.calories} total={targets.calories} color="#3b82f6" unit=" kcal" />
              <MacroBar label="Protein"  value={dayData.totals.protein}  total={targets.protein}  color="#10b981" />
              <MacroBar label="Fats"     value={dayData.totals.fats}     total={targets.fats}     color="#ef4444" />
            </div>

            {/* ── Daily Carbs Progress Bar ── */}
            {(() => {
              const carbPct   = Math.min((dayData.totals.carbs / targets.carbs) * 100, 100);
              const carbColor = carbPct >= 90 ? '#34d399' : carbPct >= 60 ? '#f59e0b' : '#fb923c';
              return (
                <div className="rounded-xl p-3 mb-3"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>🍞 Daily Carbs</span>
                    <span className="text-xs font-bold" style={{ color: carbColor }}>
                      {dayData.totals.carbs}g / {targets.carbs}g ({Math.round(carbPct)}%)
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(245,158,11,0.12)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${carbPct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg, #f59e0b, ${carbColor})`, borderRadius: 999 }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                    {carbPct >= 90
                      ? '✅ Carb goal reached — great fuel for training!'
                      : `${targets.carbs - dayData.totals.carbs}g remaining — add rice, sweet potato, oats or banana`
                    }
                  </p>
                </div>
              );
            })()}

            {/* Protein status indicator */}
            <ProteinStatus actual={dayData.totals.protein} target={targets.protein} />

            {/* Protein gap tip */}
            {proteinPct < 80 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 rounded-xl p-3 text-xs"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="font-semibold mb-1" style={{ color: '#60a5fa' }}>
                  💡 Protein Tip
                </p>
                <p style={{ color: '#64748b' }}>
                  The Indian meal dataset has moderate protein content. To hit your {targets.protein}g target,
                  consider adding: <span style={{ color: '#94a3b8' }}>1–2 scoops whey protein · boiled eggs · paneer · grilled chicken</span> as supplements to any meal.
                </p>
              </motion.div>
            )}
          </div>

          {/* Meal Cards — 2-col grid on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dayData.meals).map(([slot, meal]) => (
              <MealCard key={slot} slot={slot} meal={meal} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

