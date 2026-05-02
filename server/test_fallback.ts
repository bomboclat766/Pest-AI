import { getLocalReply } from './fallback';

const queries = [
  `What's the fastest way to improve my morning routine so I feel more focused, energized, and ready for work? Provide practical habits, timing suggestions, and a simple weekly plan.`,
  `Design a 3-month learning plan to become conversational in Spanish, including weekly goals, practice activities, and recommended resources.`,
  `Compare three popular productivity methods for knowledge workers: Pomodoro Technique, Getting Things Done, and time blocking. Explain when each is best and how to get started.`,
  `A friend is nervous about public speaking at a team meeting. Give practical tips, a warm confidence-building routine, and simple strategies to stay calm.`
];

for (let i = 0; i < queries.length; i++) {
  const q = queries[i];
  const res = getLocalReply(q);
  console.log(`\n=== QUERY ${i + 1} ===`);
  console.log('input:', q);
  console.log('reply:', res.answer);
  console.log('note:', res.note);
}
