export function getLocalReply(question: string): { answer: string; note: string } {
  const q = question.toLowerCase().trim();

  const has = (words: string[]) => {
    return words.some((w) => q.includes(w));
  };

  // Ask clarifying questions when ambiguous
  if (q.length < 10 || has(['what is', 'who is', 'help', 'tell me'])) {
    return {
      answer: "Hi — I can help with pest prevention, identification, and treatment advice. Tell me what pest you have (rats, termites, cockroaches, mosquitoes, bedbugs, ants, fleas, flies), where you see them, and any photos or symptoms. I will then give step-by-step, safe guidance.",
      note: 'using local fallback'
    };
  }

  // Rodents
  if (has(['rodent', 'rat', 'rats', 'mice', 'mouse'])) {
    const steps = [
      "Inspect: look for droppings, gnaw marks, and entry points around walls, pipes, and skirting.",
      "Sanitation: remove food sources (store food in sealed containers), clean crumbs/spills, secure pet food.",
      "Exclude: seal holes and gaps larger than 6mm using steel wool, metal mesh, or expanding foam on exterior and interior entry points.",
      "Trapping: use snap traps or secure indoor live traps; place alongside walls where droppings are found. Avoid poison inside homes where pets/children are present.",
      "Professional help: call professionals if infestation is large, if you suspect baiting is required outdoors, if you have health concerns, or if exclusion is difficult."
    ];
    return {
      answer: "For rodents: " + steps.join(' ') + " If you want, tell me where you mainly see them (kitchen, roof, store-room) and I can give a tailored plan.",
      note: 'using local fallback'
    };
  }

  // Termites
  if (has(['termite', 'termites', 'woodworm'])) {
    const steps = [
      "Check for mud tubes on foundations and soft or hollow-sounding timber.",
      "Reduce wood-to-soil contact and remove damp timber where possible.",
      "Avoid DIY insecticide drenches for large infestations — contact a licensed pest control company for inspection and a treatment plan (chemical or baiting).",
      "Prevent: improve drainage, ventilate crawl spaces, store firewood away from the house."
    ];
    return {
      answer: "Termite guidance: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Cockroaches
  if (has(['cockroach', 'cockroaches', 'roach'])) {
    const steps = [
      "Sanitation: remove crumbs, wash dishes promptly, keep bins sealed.",
      "Baiting: use gel baits in cracks and crevices, away from children/pets.",
      "Crack sealing: seal gaps behind appliances and around pipes.",
      "Call professionals if you see many cockroaches or if baits are ineffective."
    ];
    return {
      answer: "Cockroach steps: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Mosquitoes
  if (has(['mosquito', 'mosquitoes', 'aedes'])) {
    const steps = [
      "Eliminate standing water (pots, drains, puddles) where mosquitoes breed.",
      "Use screens, bed nets, and repellents when necessary.",
      "Consider larvicidal treatment of persistent water sources if appropriate (professional advice recommended)."
    ];
    return {
      answer: "Mosquito prevention: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Bed bugs
  if (has(['bed bug', 'bed bugs', 'bedbugs'])) {
    const steps = [
      "Confirm: look for blood spots on sheets and small brown insects in mattress seams.",
      "Contain: wash bedding in hot water, vacuum mattress seams, and use mattress encasements.",
      "Professional heat treatment or insecticide treatment is usually required for elimination."
    ];
    return {
      answer: "Bed bug advice: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Ants
  if (has(['ant', 'ants'])) {
    const steps = [
      "Identify entry trails and remove food sources.",
      "Use bait stations rather than sprays to target colonies.",
      "Seal entry points and keep surfaces clean."
    ];
    return {
      answer: "Ant control: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Fleas
  if (has(['flea', 'fleas'])) {
    const steps = [
      "Treat pets with vet-approved flea control, wash bedding, and vacuum carpets frequently.",
      "Consider insecticidal treatment for indoor heavy infestations and treat outdoor resting areas."
    ];
    return {
      answer: "Flea control: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Flies
  if (has(['fly', 'flies'])) {
    const steps = [
      "Manage waste and keep bins sealed.",
      "Use screens and fly traps where appropriate.",
      "Remove breeding material such as exposed food or animal waste."
    ];
    return {
      answer: "Fly control: " + steps.join(' '),
      note: 'using local fallback'
    };
  }

  // Generic: safety
  if (has(['poison', 'mix', 'drink', 'inject', 'harmful', 'toxic'])) {
    return {
      answer: "I cannot provide instructions that could be dangerous or harmful. For chemical or medical interventions, consult a licensed professional and follow product labels and local regulations.",
      note: 'safety-first'
    };
  }

  // Default
  return {
    answer: "I can help with pest ID, prevention, and safe treatment. Tell me: which pest (or describe what you see), where it is (kitchen, bedroom, yard), and any photos or details. I will then provide step-by-step advice and indicate when to call a professional.",
    note: 'using local fallback'
  };
}
