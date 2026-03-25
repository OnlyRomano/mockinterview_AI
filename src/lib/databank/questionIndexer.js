import interviewQuestions from "./interview-questions.json";
import dbConnect from "../db";
import DatabankQuestion from "../models/DatabankQuestion";

class QuestionIndexer {
  constructor() {
    this.questions = [];
    this.indexes = this.buildEmptyIndexes();
    this.loaded = false;
    this.loadingPromise = null;
  }

  buildEmptyIndexes() {
    return {
      byLevel: {},
      byType: {},
      byTechstack: {},
      byCombination: {},
    };
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

  async loadQuestions() {
    await dbConnect();

    const existingCount = await DatabankQuestion.countDocuments();
    if (existingCount === 0) {
      const seed = Array.isArray(interviewQuestions?.questions)
        ? interviewQuestions.questions.map((q) => ({
            level: q.level,
            techstack: q.techstack,
            type: q.type,
            question: q.question,
          }))
        : [];

      if (seed.length > 0) {
        await DatabankQuestion.insertMany(seed, { ordered: false });
      }
    }

    const questions = await DatabankQuestion.find({})
      .select("level techstack type question")
      .lean();

    this.questions = questions;
    this.indexes = this.buildIndexes();
    this.loaded = true;
  }

  async ensureLoaded() {
    if (this.loaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.loadQuestions()
      .catch((err) => {
        this.loaded = false;
        throw err;
      })
      .finally(() => {
        this.loadingPromise = null;
      });

    return this.loadingPromise;
  }

  async reload() {
    this.loaded = false;
    this.questions = [];
    this.indexes = this.buildEmptyIndexes();
    return this.ensureLoaded();
  }

  async getReferenceQuestions(level, techstack, type) {
    await this.ensureLoaded();

    const techstackArray = String(techstack || "")
      .split(",")
      .map((tech) => tech.trim());
    
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
