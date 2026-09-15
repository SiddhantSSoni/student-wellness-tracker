// Wellness Engine — Simple Classification / Recommendation (SDG 3)
// Transparent rule-based AI for 2nd Year Track - interpretable, no black box.

export type Mood = "great" | "good" | "okay" | "low";
export type WellnessLevel = "Thriving" | "Balanced" | "Needs Attention" | "Action Needed";

export interface DailyLog {
  date: string; // YYYY-MM-DD
  sleepHours: number;
  activityMinutes: number;
  waterLiters: number;
  mood: Mood;
  wellnessScore: number;
  wellnessLevel: WellnessLevel;
  suggestions: Suggestion[];
}

export interface Suggestion {
  category: "sleep" | "activity" | "hydration" | "mind" | "general";
  title: string;
  detail: string;
  icon: string;
}

export function calcScore(sleep: number, activity: number, water: number): number {
  let s = 0;
  if (sleep >= 7 && sleep <= 9) s += 35;
  else if ((sleep >= 6 && sleep < 7) || (sleep > 9 && sleep <= 10)) s += 22;
  else if (sleep >= 5 && sleep < 6) s += 12;
  else s += 5;

  if (activity >= 60) s += 35;
  else if (activity >= 30) s += 26;
  else if (activity >= 15) s += 14;
  else s += 5;

  if (water >= 2 && water <= 3) s += 30;
  else if ((water >= 1.5 && water < 2) || (water > 3 && water <= 3.5)) s += 20;
  else if (water >= 1 && water < 1.5) s += 10;
  else s += 5;

  return Math.min(100, s);
}

export function classify(score: number): { level: WellnessLevel; color: string; bg: string; emoji: string } {
  if (score >= 80) return { level: "Thriving", color: "text-emerald-700", bg: "bg-emerald-500", emoji: "🌿" };
  if (score >= 60) return { level: "Balanced", color: "text-teal-700", bg: "bg-teal-500", emoji: "🌊" };
  if (score >= 40) return { level: "Needs Attention", color: "text-amber-700", bg: "bg-amber-500", emoji: "🌤️" };
  return { level: "Action Needed", color: "text-rose-700", bg: "bg-rose-500", emoji: "🌙" };
}

export function generateSuggestions(sleep: number, activity: number, water: number, mood: Mood): Suggestion[] {
  const out: Suggestion[] = [];

  if (sleep < 7) {
    out.push({
      category: "sleep",
      title: sleep < 5 ? "Sleep debt detected" : "Boost your sleep",
      detail: sleep < 5 ? "Aim for 7-9h. Keep a fixed bedtime, dim lights 1h before sleep, avoid caffeine after 4pm." : "Try 7-9h. No screens 30min before bed + consistent wake time improves recovery.",
      icon: "🌙",
    });
  } else if (sleep > 9.5) {
    out.push({ category: "sleep", title: "Oversleep check", detail: "Long sleep can leave you groggy. Keep wake time consistent, get morning sunlight.", icon: "☀️" });
  } else {
    out.push({ category: "sleep", title: "Sleep on track", detail: "Great consistency! Keep the same bedtime even on weekends.", icon: "✨" });
  }

  if (activity < 30) {
    out.push({
      category: "activity",
      title: activity < 10 ? "Move more today" : "Add a quick walk",
      detail: activity < 10 ? "15-min walk between lectures or 20 bodyweight squats boosts focus & mood." : "30 min daily is the sweet spot — brisk walk, cycle, or campus sports counts.",
      icon: "🏃",
    });
  } else if (activity >= 60) {
    out.push({ category: "activity", title: "Active & strong", detail: "Excellent! Add stretching/cool-down to avoid fatigue.", icon: "💪" });
  } else {
    out.push({ category: "activity", title: "Keep momentum", detail: "You hit the healthy range. Try 10-min stretch after study sessions.", icon: "🧘" });
  }

  if (water < 2) {
    out.push({
      category: "hydration",
      title: water < 1 ? "Hydration low" : "Drink more water",
      detail: "Aim 2-3L/day (~8 glasses). Keep a bottle at your desk, sip hourly. Add lemon if plain water is hard.",
      icon: "💧",
    });
  } else if (water > 3.5) {
    out.push({ category: "hydration", title: "Hydration high", detail: "Over 3.5L may not be needed unless very active/hot. Listen to thirst.", icon: "💦" });
  } else {
    out.push({ category: "hydration", title: "Hydrated well", detail: "Perfect range! Maintain steady intake rather than gulping at once.", icon: "🥤" });
  }

  if (mood === "low") {
    out.push({ category: "mind", title: "Mind check-in", detail: "Low mood + poor sleep often link. Try 5-min breathing, talk to a friend/counselor. You're not alone.", icon: "🤍" });
  } else if (mood === "okay" && (sleep < 6 || activity < 15)) {
    out.push({ category: "mind", title: "Small wins", detail: "Today do 1 tiny win: 10-min walk + early bedtime. Momentum lifts mood.", icon: "🌱" });
  }

  // cap to 3 most relevant to keep UI clean
  return out.slice(0, 3);
}

export function analyze(sleep: number, activity: number, water: number, mood: Mood) {
  const wellnessScore = calcScore(sleep, activity, water);
  const { level } = classify(wellnessScore);
  const suggestions = generateSuggestions(sleep, activity, water, mood);
  return { wellnessScore, wellnessLevel: level as WellnessLevel, suggestions };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
