class SmartSampler {
  constructor() {
    this.usedQuestions = new Set(); // Track recently used questions
    this.maxHistory = 50; // Keep last 50 used questions
  }

  // Weighted random selection for better diversity
  weightedRandomSelect(questions, amount) {
    if (questions.length <= amount) {
      return questions;
    }

    // Calculate weights (recently used questions get lower weight)
    const weightedQuestions = questions.map(q => ({
      question: q,
      weight: this.calculateWeight(q)
    }));

    // Sort by weight (higher weight = more likely to be selected)
    weightedQuestions.sort((a, b) => b.weight - a.weight);

    // Select top candidates with some randomness
    const topCandidates = weightedQuestions.slice(0, amount * 2);
    const selected = [];

    for (let i = 0; i < amount && selected.length < amount; i++) {
      const randomIndex = Math.floor(Math.random() * Math.min(topCandidates.length, amount + i));
      const selectedQuestion = topCandidates[randomIndex].question;
      
      if (!selected.includes(selectedQuestion)) {
        selected.push(selectedQuestion);
        this.markAsUsed(selectedQuestion);
      }
    }

    return selected;
  }

  calculateWeight(question) {
    let weight = 1.0;
    
    // Reduce weight if recently used
    if (this.usedQuestions.has(question)) {
      weight *= 0.3;
    }

    // Add some randomness to avoid always picking the same questions
    weight *= (0.8 + Math.random() * 0.4);

    return weight;
  }

  markAsUsed(question) {
    this.usedQuestions.add(question);
    
    // Keep history manageable
    if (this.usedQuestions.size > this.maxHistory) {
      const oldest = this.usedQuestions.values().next().value;
      this.usedQuestions.delete(oldest);
    }
  }

  // Reset usage history (useful for testing or periodic cleanup)
  resetHistory() {
    this.usedQuestions.clear();
  }
}

export default new SmartSampler();
