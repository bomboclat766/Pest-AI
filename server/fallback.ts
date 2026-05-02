export function getLocalReply(question: string): { answer: string; note: string } {
  const q = question.toLowerCase().trim();

  const has = (words: string[]) => words.some((w) => q.includes(w));

  if (q.length < 10 || has(['what is', 'who is', 'help', 'tell me', 'how do i', 'how can i'])) {
    return {
      answer: "Hi — I'm MarwaBuddy, your friendly generalist peer. Ask me anything about work, learning, creativity, or everyday life, and I'll give you a clear, useful answer.",
      note: 'using local fallback'
    };
  }

  if (has(['poison', 'harmful', 'dangerous', 'medical', 'inject', 'consume'])) {
    return {
      answer: "I cannot provide instructions that could be dangerous or harmful. For medical, legal, or chemical advice, consult a licensed professional and follow safe, local guidance.",
      note: 'safety-first'
    };
  }

  return {
    answer: "I can help with many topics — from learning and productivity to everyday decisions. Just ask a question about what you need, and I'll offer thoughtful, friendly guidance.",
    note: 'using local fallback'
  };
}
