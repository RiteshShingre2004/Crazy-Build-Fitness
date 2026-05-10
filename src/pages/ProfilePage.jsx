import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import { Save, RefreshCw, User, Activity, Target, Utensils } from 'lucide-react';

const GOALS = [
  { value: 'fat_loss',    label: 'Fat Loss',    emoji: '🔥' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { value: 'maintenance', label: 'Maintain',    emoji: '⚖️' },
];
const ACTIVITY = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'moderate',  label: 'Moderate' },
  { value: 'active',    label: 'Very Active' },
];
const DIET = [
  { value: 'veg',     label: 'Vegetarian', emoji: '🥗' },
  { value: 'non_veg', label: 'Non-Veg',    emoji: '🍗' },
  { value: 'vegan',   label: 'Vegan',      emoji: '🌱' },
];

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { state, updateUser, regeneratePlans, updatePreferences } = useApp();
  const user = state.user || {};
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [notifications, setNotifications] = useState(state.preferences?.notifications ?? true);
  const [workoutDays, setWorkoutDays] = useState(state.preferences?.workoutDays ?? [1, 2, 3, 4, 5]);

  const toggleWorkoutDay = (dayIndex) => {
    setWorkoutDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Build merged user so regeneration uses the latest form values immediately
    const updatedUser = { ...state.user, ...form,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
    };
    updateUser(updatedUser);
    if (updatePreferences) updatePreferences({ notifications, workoutDays });
    regeneratePlans(updatedUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = "input-field";

  // Compute BMI
  const bmi = form.weight && form.height
    ? (form.weight / ((form.height / 100) ** 2)).toFixed(1)
    : '—';
  const bmiLabel =
    bmi < 18.5 ? 'Underweight'
    : bmi < 25  ? 'Normal'
    : bmi < 30  ? 'Overweight'
    : bmi !== '—' ? 'Obese' : '—';
  const bmiColor = bmi < 18.5 ? '#60a5fa' : bmi < 25 ? '#34d399' : bmi < 30 ? '#fbbf24' : '#f87171';

  return (
    <div className="page-container">
      <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-5">

        {/* Avatar + Name header */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
            {form.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{form.name || 'Athlete'}</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>{form.email || 'athlete@crazy.fit'}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
                {form.goal?.replace(/_/g, ' ') || 'Goal'}
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>
                BMI: <span style={{ color: bmiColor, fontWeight: 700 }}>{bmi}</span> {bmiLabel !== '—' ? `(${bmiLabel})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={15} style={{ color: '#3b82f6' }} />
            <h4 className="text-sm font-bold text-white">Personal Info</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full Name">
              <input className={inputClass} placeholder="John Doe" value={form.name || ''}
                onChange={e => set('name', e.target.value)} />
            </FormField>
            <FormField label="Age">
              <input type="number" min="15" max="80" className={inputClass} placeholder="25"
                value={form.age || ''} onChange={e => set('age', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Weight (kg)">
              <input type="number" step="0.1" min="30" max="250" className={inputClass} placeholder="75"
                value={form.weight || ''} onChange={e => set('weight', e.target.value)} />
            </FormField>
            <FormField label="Height (cm)">
              <input type="number" min="100" max="250" className={inputClass} placeholder="175"
                value={form.height || ''} onChange={e => set('height', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Gender">
            <div className="grid grid-cols-2 gap-2">
              {['male', 'female'].map(g => (
                <button type="button" key={g} onClick={() => set('gender', g)}
                  className="py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                  style={form.gender === g
                    ? { background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                    : { background: 'rgba(37,99,235,0.04)', color: '#64748b', border: '1px solid rgba(37,99,235,0.08)' }
                  }>{g}</button>
              ))}
            </div>
          </FormField>
        </div>

        {/* Fitness Settings */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={15} style={{ color: '#3b82f6' }} />
            <h4 className="text-sm font-bold text-white">Fitness Settings</h4>
          </div>

          <FormField label="Goal">
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map(g => (
                <button type="button" key={g.value} onClick={() => set('goal', g.value)}
                  className="p-3 rounded-xl text-center transition-all"
                  style={form.goal === g.value
                    ? { background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)' }
                    : { background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }
                  }>
                  <div className="text-lg">{g.emoji}</div>
                  <div className="text-xs font-semibold text-white mt-1">{g.label}</div>
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Activity Level">
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY.map(a => (
                <button type="button" key={a.value} onClick={() => set('activityLevel', a.value)}
                  className="py-2 px-3 rounded-xl text-sm font-semibold transition-all"
                  style={form.activityLevel === a.value
                    ? { background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                    : { background: 'rgba(37,99,235,0.04)', color: '#64748b', border: '1px solid rgba(37,99,235,0.08)' }
                  }>{a.label}</button>
              ))}
            </div>
          </FormField>

          <FormField label="Diet Preference">
            <div className="grid grid-cols-3 gap-2">
              {DIET.map(d => (
                <button type="button" key={d.value} onClick={() => set('dietPreference', d.value)}
                  className="py-2 rounded-xl text-center transition-all"
                  style={form.dietPreference === d.value
                    ? { background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)' }
                    : { background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }
                  }>
                  <div className="text-lg">{d.emoji}</div>
                  <div className="text-xs font-semibold text-white mt-1">{d.label}</div>
                </button>
              ))}
            </div>
          </FormField>

          {/* Smart Re-engagement Notifications */}
          <FormField label="Smart Re-engagement Notifications">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }}>
              <div>
                <p className="text-sm font-semibold text-white">Push Notifications</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Reminders, streak alerts, and comeback nudges</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${notifications ? 'bg-blue-600' : 'bg-gray-600'}`}
              >
                <motion.div
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: notifications ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </FormField>

          {/* Flexible Scheduling (Active Days) */}
          <FormField label="Flexible Scheduling">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }}>
              <div className="mb-3">
                <p className="text-sm font-semibold text-white">Active Workout Days</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Select your planned training days. Rest days don't break your streak!</p>
              </div>
              <div className="flex justify-between gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                  const isActive = workoutDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleWorkoutDay(idx)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                      style={{
                        background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : '#94a3b8',
                        border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </FormField>

          {/* Connected Apps for Gap Filling */}
          <FormField label="Connected Apps (Auto-Import)">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">🍎</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Apple HealthKit</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Auto-fill missed workouts & steps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Simulating Apple Health OAuth... Connected!")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Google Fit</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Auto-fill missed workouts & steps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Simulating Google Fit OAuth... Connected!")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  Connect
                </button>
              </div>
            </div>
          </FormField>
        </div>

        {/* Save button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base font-bold"
          style={saved ? { background: 'linear-gradient(135deg, #059669, #10b981)' } : {}}
        >
          {saved ? (
            <><span>✓</span> Saved & Plans Updated!</>
          ) : (
            <><Save size={16} /> Save & Regenerate Plans</>
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}

