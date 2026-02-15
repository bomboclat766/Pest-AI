import { getLocalReply } from './fallback';

const queries = [
  `I found small brown droppings behind my kitchen cabinets, small holes in wooden skirting, and occasional rust-colored stains on walls. Pets sometimes scratch at night. Provide a differential diagnosis (most likely pests), key diagnostic signs to inspect, immediate containment steps, recommended short-term and long-term treatments (chemical and non-chemical), safety precautions for pets and children, and quick references relevant to Kenya.`,
  `Design a 6-month integrated pest management (IPM) plan for a medium-sized commercial bakery in Nairobi dealing with rodents, flour moths, and phorid flies. Include monitoring/inspection schedule, sanitation protocols, proofing/exclusion measures, baiting/trapping strategy, targeted insecticide classes if necessary, staff training schedule, record-keeping metrics, and success criteria.`,
  `Compare three classes of insecticides for German cockroach control: pyrethroids, carbamates, and insect growth regulators. For each: mode of action, typical residual life, effectiveness against populations with known resistance, resistance management tips, mixing/application restrictions, required PPE, and safe disposal notes.`,
  `A homeowner asks about making homemade poison baits using toxins found at a farm, but has young children. Provide a safety-first answer: legal and ethical considerations, safer alternatives, step-by-step safe implementation only if absolutely necessary, and guidance for communicating risk to the homeowner.`
];

for (let i = 0; i < queries.length; i++) {
  const q = queries[i];
  const res = getLocalReply(q);
  console.log(`\n=== QUERY ${i + 1} ===`);
  console.log('input:', q);
  console.log('reply:', res.answer);
  console.log('note:', res.note);
}
