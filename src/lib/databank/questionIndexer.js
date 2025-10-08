import interviewQuestions from './interview-questions.json';

class QuestionIndexer {
  constructor() {
    this.questions = interviewQuestions.questions;
    this.indexes = this.buildIndexes();
  }

  buildIndexes() {
    const indexes = {
      byLevel: {},
      byType: {},
      byTechstack: {},
      byCombination: {}
    };

    this.questions.forEach((question, index) => {
      // Level index
      if (!indexes.byLevel[question.level]) {
        indexes.byLevel[question.level] = [];
      }
      indexes.byLevel[question.level].push(index);

      // Type index
      if (!indexes.byType[question.type]) {
        indexes.byType[question.type] = [];
      }
      indexes.byType[question.type].push(index);

      // Tech stack index
      if (!indexes.byTechstack[question.techstack]) {
        indexes.byTechstack[question.techstack] = [];
      }
      indexes.byTechstack[question.techstack].push(index);

      // Combination index (most efficient)
      const combo = `${question.level}-${question.type}-${question.techstack}`;
      if (!indexes.byCombination[combo]) {
        indexes.byCombination[combo] = [];
      }
      indexes.byCombination[combo].push(index);
    });

    return indexes;
  }

  getReferenceQuestions(level, techstack, type) {
    const techstackArray = techstack.split(",").map(tech => tech.trim());
    
    // Strategy 1: Try exact combination first (O(1))
    for (const tech of techstackArray) {
      const exactKey = `${level}-${type}-${tech}`;
      if (this.indexes.byCombination[exactKey]) {
        return this.indexes.byCombination[exactKey].map(i => this.questions[i].question);
      }
    }

    // Strategy 2: Try any tech stack with same level and type
    const levelTypeQuestions = this.getIntersection(
      this.indexes.byLevel[level] || [],
      this.indexes.byType[type] || []
    );

    if (levelTypeQuestions.length > 0) {
      // Filter by tech stack similarity
      const techstackMatches = levelTypeQuestions.filter(index => {
        const question = this.questions[index];
        return techstackArray.some(tech => 
          this.isTechStackMatch(question.techstack, tech)
        );
      });

      if (techstackMatches.length > 0) {
        return techstackMatches.map(i => this.questions[i].question);
      }
    }

    // Strategy 3: Fallback to level + any type
    const levelQuestions = this.indexes.byLevel[level] || [];
    const techstackMatches = levelQuestions.filter(index => {
      const question = this.questions[index];
      return techstackArray.some(tech => 
        this.isTechStackMatch(question.techstack, tech)
      );
    });

    return techstackMatches.map(i => this.questions[i].question);
  }

  getIntersection(arr1, arr2) {
    return arr1.filter(x => arr2.includes(x));
  }

  isTechStackMatch(questionTech, userTech) {
    const q = questionTech.toLowerCase();
    const u = userTech.toLowerCase();
    return q.includes(u) || u.includes(q);
  }

  // Get question statistics for debugging
  getStats() {
    return {
      totalQuestions: this.questions.length,
      levels: Object.keys(this.indexes.byLevel),
      types: Object.keys(this.indexes.byType),
      techstacks: Object.keys(this.indexes.byTechstack),
      combinations: Object.keys(this.indexes.byCombination).length
    };
  }
}

// Singleton instance
const questionIndexer = new QuestionIndexer();

export default questionIndexer;
