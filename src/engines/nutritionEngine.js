import { MEALS_DATA } from '../data/meals.js';
import { CUSTOM_MEALS } from '../data/mealsCustom.js';

const ALL_MEALS = [...MEALS_DATA, ...CUSTOM_MEALS];

// ─── STEP 1 & 2: Validate and clean meals dataset ─────────────────────────────
function getValidMeals() {
  return ALL_MEALS.filter(meal => {
    const cal = parseFloat(meal['Calories kcal']);
    const pro = parseFloat(meal['Protein g']);
    const carb = parseFloat(meal['Carbohydrates g']);
    const fat = parseFloat(meal['Fat g']);
    return (
      meal['Meal Name'] &&
      meal['Meal Category'] &&
      meal['Diet Type'] &&
      !isNaN(cal) && cal > 0 &&
      !isNaN(pro) && pro >= 0 &&
      !isNaN(carb) && carb >= 0 &&
      !isNaN(fat) && fat >= 0
    );
  });
}

// ─── STEP 3: BMR + TDEE (Mifflin-St Jeor) ────────────────────────────────────
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
  };
  return bmr * (multipliers[activityLevel] || 1.2);
}

function getTargetCalories(tdee, goal) {
  const adjustments = {
    fat_loss: -400,
    muscle_gain: +300,
    maintenance: 0,
  };
  return Math.round(tdee + (adjustments[goal] || 0));
}

// ─── STEP 4: Goal-based Protein — Range 1.5–2.2 g/kg ─────────────────────────
// Goal-specific multipliers within the science-backed 1.5–2.2 g/kg range:
//   muscle_gain  → 2.0 g/kg (optimal anabolic stimulus)
//   fat_loss     → 2.2 g/kg (higher to preserve lean mass in a deficit)
//   maintenance  → 1.6 g/kg (sufficient to sustain muscle)
const PROTEIN_MULTIPLIERS = {
  muscle_gain: 2.0,
  fat_loss: 2.2,
  maintenance: 1.6,
};

function calculateMacros(weight, targetCalories, goal) {
  const multiplier = PROTEIN_MULTIPLIERS[goal] || 2.0;
  const protein = Math.round(multiplier * weight);           // g

  const fatCals = targetCalories * 0.25;
  const fats = Math.round(fatCals / 9);                      // g

  const proteinCals = protein * 4;
  const carbCals = targetCalories - proteinCals - fatCals;
  const carbs = Math.round(Math.max(carbCals, 50) / 4);      // g, min 50g

  return { protein, fats, carbs };
}

// ─── STEP 5: Filter by diet preference ───────────────────────────────────────
function normalizeDietType(dietPref) {
  const map = {
    veg:     ['Vegetarian', 'Vegan'],
    non_veg: ['Vegetarian', 'Vegan', 'Non-Vegetarian'],
    vegan:   ['Vegan'],
  };
  return map[dietPref] || ['Vegetarian', 'Vegan', 'Non-Vegetarian'];
}

function filterByDiet(meals, dietPref) {
  const allowed = normalizeDietType(dietPref);
  return meals.filter(m => allowed.includes(m['Diet Type']));
}

// ─── STEP 6: 5-Meal Daily Distribution ───────────────────────────────────────
// 5 meals allow more protein spread and keep each meal manageable.
//   Breakfast    25%
//   Lunch        30%
//   Dinner       25%
//   Pre-Workout  10%
//   Snack        10%
export const MEAL_DISTRIBUTION = {
  breakfast:   0.25,
  lunch:       0.30,
  dinner:      0.25,
  pre_workout: 0.10,
  snack:       0.10,
};

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'pre_workout', 'snack'];

// Dataset category → internal slot mapping
function getCategoriesForSlot(slot) {
  const slotMap = {
    breakfast:   ['Breakfast'],
    lunch:       ['Lunch'],
    dinner:      ['Dinner'],
    pre_workout: ['Pre-Workout', 'Snack'],
    snack:       ['Snack', 'Post-Workout'],
  };
  return slotMap[slot] || [slot];
}

// ─── STEP 7: Smart Meal Selection — Prioritise High-Protein ──────────────────
function selectBestMeal(candidates, targetCals, targetProtein, usedMealIds, tolerancePct = 0.15) {
  const low  = targetCals * (1 - tolerancePct);
  const high = targetCals * (1 + tolerancePct);

  // Prefer high-protein meals within calorie range, not recently used
  const highProteinPool = candidates.filter(m =>
    m['Is High Protein'] === 'Yes' &&
    parseFloat(m['Calories kcal']) >= low &&
    parseFloat(m['Calories kcal']) <= high &&
    !usedMealIds.has(m['Meal ID'])
  );

  // Regular calorie-range pool (not recently used)
  const regularPool = candidates.filter(m =>
    parseFloat(m['Calories kcal']) >= low &&
    parseFloat(m['Calories kcal']) <= high &&
    !usedMealIds.has(m['Meal ID'])
  );

  // Loose calorie pool (±25%, not recently used)
  const loosePool = candidates.filter(m =>
    parseFloat(m['Calories kcal']) >= targetCals * 0.70 &&
    parseFloat(m['Calories kcal']) <= targetCals * 1.40 &&
    !usedMealIds.has(m['Meal ID'])
  );

  // Any not recently used
  const freshPool = candidates.filter(m => !usedMealIds.has(m['Meal ID']));

  // Fallback: allow reuse
  const pool =
    highProteinPool.length > 0 ? highProteinPool :
    regularPool.length  > 0   ? regularPool      :
    loosePool.length    > 0   ? loosePool         :
    freshPool.length    > 0   ? freshPool         :
    candidates;

  if (pool.length === 0) return null;

  // Sort: most protein first, then closest calories
  const sorted = [...pool].sort((a, b) => {
    const aProt = parseFloat(a['Protein g']) || 0;
    const bProt = parseFloat(b['Protein g']) || 0;
    const aCal  = parseFloat(a['Calories kcal']) || 0;
    const bCal  = parseFloat(b['Calories kcal']) || 0;
    // Primary: highest protein
    if (bProt !== aProt) return bProt - aProt;
    // Secondary: closest calories to target
    return Math.abs(aCal - targetCals) - Math.abs(bCal - targetCals);
  });

  return sorted[0];
}

// ─── STEP 8 & 9: 30-Day Plan with Variety Engine ─────────────────────────────
export function generateMealPlan(userData) {
  const { weight, height, age, gender, activityLevel, goal, dietPreference } = userData;

  // Calculations
  const bmr           = calculateBMR(weight, height, age, gender);
  const tdee          = calculateTDEE(bmr, activityLevel);
  const targetCalories = getTargetCalories(tdee, goal);
  const { protein, fats, carbs } = calculateMacros(weight, targetCalories, goal);

  const dailyTargets = { calories: targetCalories, protein, carbs, fats };

  // Validated + diet-filtered meals
  const validMeals    = getValidMeals();
  const filteredMeals = filterByDiet(validMeals, dietPreference);

  // Per-slot pools
  const mealPools = {};
  for (const slot of MEAL_SLOTS) {
    const cats = getCategoriesForSlot(slot);
    const pool = filteredMeals.filter(m => cats.includes(m['Meal Category']));
    // Fallback to all filtered meals if pool is tiny
    mealPools[slot] = pool.length >= 3 ? pool : filteredMeals;
  }

  // 30-day generation with 3-day rolling variety window per slot
  const plan = [];
  const recentIds = Object.fromEntries(MEAL_SLOTS.map(s => [s, []]));

  for (let day = 1; day <= 30; day++) {
    const dayMeals = {};
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;

    for (const slot of MEAL_SLOTS) {
      const ratio          = MEAL_DISTRIBUTION[slot];
      const slotTargetCals = targetCalories * ratio;
      const slotTargetProt = protein * ratio;
      const usedSet        = new Set(recentIds[slot]);

      const selected = selectBestMeal(
        mealPools[slot], slotTargetCals, slotTargetProt, usedSet
      );

      if (selected) {
        dayMeals[slot] = {
          id:             selected['Meal ID'],
          name:           selected['Meal Name'],
          category:       selected['Meal Category'],
          dietType:       selected['Diet Type'],
          calories:       Math.round(parseFloat(selected['Calories kcal']) || 0),
          protein:        Math.round(parseFloat(selected['Protein g']) || 0),
          carbs:          Math.round(parseFloat(selected['Carbohydrates g']) || 0),
          fats:           Math.round(parseFloat(selected['Fat g']) || 0),
          fiber:          Math.round(parseFloat(selected['Fiber g']) || 0),
          prepTime:       Math.round(parseFloat(selected['Prep Time min']) || 0),
          cookTime:       Math.round(parseFloat(selected['Cook Time min']) || 0),
          servingSize:    selected['Serving Size'] || '1',
          servingUnit:    selected['Serving Unit'] || 'serving',
          keyIngredients: selected['Key Ingredients'] || '',
          fitnessGoal:    selected['Fitness Goal'] || '',
          isHighProtein:  selected['Is High Protein'] === 'Yes',
          isLowCalorie:   selected['Is Low Calorie'] === 'Yes',
        };
        totalCals  += dayMeals[slot].calories;
        totalProt  += dayMeals[slot].protein;
        totalCarbs += dayMeals[slot].carbs;
        totalFats  += dayMeals[slot].fats;

        // Rolling 3-day window
        recentIds[slot].push(selected['Meal ID']);
        if (recentIds[slot].length > 3) recentIds[slot].shift();
      }
    }

    plan.push({
      day,
      meals: dayMeals,
      totals: { calories: totalCals, protein: totalProt, carbs: totalCarbs, fats: totalFats },
    });
  }

  return {
    daily_targets: dailyTargets,
    bmr:  Math.round(bmr),
    tdee: Math.round(tdee),
    proteinMultiplier: PROTEIN_MULTIPLIERS[goal] || 2.0,
    plan,
  };
}

// ─── Utility: targets only (for dashboard preview) ───────────────────────────
export function getDailyTargets(userData) {
  const { weight, height, age, gender, activityLevel, goal } = userData;
  const bmr            = calculateBMR(weight, height, age, gender);
  const tdee           = calculateTDEE(bmr, activityLevel);
  const targetCalories = getTargetCalories(tdee, goal);
  const { protein, fats, carbs } = calculateMacros(weight, targetCalories, goal);
  return {
    calories: targetCalories,
    protein,
    carbs,
    fats,
    bmr:  Math.round(bmr),
    tdee: Math.round(tdee),
  };
}
