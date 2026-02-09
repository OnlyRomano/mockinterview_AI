import { cosineSimilarity, embedMany } from "ai";
import { google } from "@ai-sdk/google";

// Deterministic, embedding-based scoring:
// - Embed the candidate's combined answers
// - Compare to labeled exemplars per category
// - Score = similarity-weighted average of exemplar scores (0..100)
//
// Notes:
// - Exemplars are intentionally role-agnostic; you can later specialize by role/level/type.
// - Comments/strengths/areas are generated deterministically (no LLM judging).

const EMBEDDING_MODEL = google.textEmbeddingModel("gemini-embedding-001");

// Keep category names aligned with `feedbackSchema` (src/constants/index.js).
const CATEGORIES = [
  "Communication Skills",
  "Technical Knowledge",
  "Problem Solving",
  "Cultural Fit",
  "Confidence and Clarity",
];

/**
 * Small, labeled exemplar snippets used for similarity scoring.
 * Add more exemplars over time for better calibration.
 */
const EXEMPLARS = {
  "Communication Skills": [
    {
      score: 90,
      text: "I’ll start with a quick summary, then go step by step, and I’ll call out tradeoffs and assumptions as I go.",
      label: "Structured, clear, sets context",
    },
    {
      score: 70,
      text: "I think the main idea is this, and then we can break it into a few parts and address them one by one.",
      label: "Mostly clear, some structure",
    },
    {
      score: 45,
      text: "Uh, I’m not totally sure. Maybe we just try something and see. It depends, I guess.",
      label: "Hesitant, unclear, meandering",
    },
  ],
  "Technical Knowledge": [
    {
      score: 90,
      text: "Time complexity is O(n log n) because we sort once, and the subsequent lookup is logarithmic per query. I’d also consider memory and edge cases like empty input.",
      label: "Correct + depth + details",
    },
    {
      score: 70,
      text: "I would use an index or a hash map for faster lookup, and I’d validate input types and handle null values.",
      label: "Generally correct, moderate depth",
    },
    {
      score: 40,
      text: "I’m not sure what the difference is, but I think it should work if we just store it somewhere.",
      label: "Vague/incorrect/low specificity",
    },
  ],
  "Problem Solving": [
    {
      score: 90,
      text: "First I’ll restate the problem, list constraints, propose an approach, then test with examples and discuss edge cases and tradeoffs.",
      label: "Methodical, checks work",
    },
    {
      score: 70,
      text: "I would break it down into steps and implement a straightforward solution, then optimize if needed.",
      label: "Reasonable approach, limited validation",
    },
    {
      score: 40,
      text: "I’ll just start coding and figure it out as I go. I’m not thinking about edge cases right now.",
      label: "Unstructured, misses validation",
    },
  ],
  "Cultural Fit": [
    {
      score: 90,
      text: "I like collaborating, I communicate early about risks, and I take ownership to unblock the team while being open to feedback.",
      label: "Ownership + collaboration",
    },
    {
      score: 70,
      text: "I work well with others and I try to be proactive about updates and priorities.",
      label: "Positive but less specific",
    },
    {
      score: 45,
      text: "I mostly prefer working alone and I don’t like changing my approach once I start.",
      label: "Potential misalignment",
    },
  ],
  "Confidence and Clarity": [
    {
      score: 90,
      text: "I’m confident in this approach. If an assumption changes, here’s how I’d adapt. I can explain my reasoning clearly.",
      label: "Confident, clear, adaptable",
    },
    {
      score: 70,
      text: "I think this should work. I’d verify with a quick test and adjust if needed.",
      label: "Moderate confidence, some uncertainty",
    },
    {
      score: 45,
      text: "I don’t know. I’m guessing here, and I’m not sure how to explain it.",
      label: "Low confidence/clarity",
    },
  ],
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeLevel(level) {
  const l = String(level || "").toLowerCase();
  if (l.includes("junior") || l.includes("entry")) return "junior";
  if (l.includes("senior") || l.includes("staff") || l.includes("lead")) return "senior";
  return "mid";
}

function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("behavior")) return "behavioral";
  if (t.includes("technical")) return "technical";
  if (t.includes("mixed")) return "mixed";
  return "mixed";
}

function getWeights({ type }) {
  // These weights are deterministic and configurable.
  const base = {
    "Communication Skills": 0.2,
    "Technical Knowledge": 0.3,
    "Problem Solving": 0.25,
    "Cultural Fit": 0.1,
    "Confidence and Clarity": 0.15,
  };

  const nt = normalizeType(type);
  if (nt === "technical") {
    return {
      ...base,
      "Technical Knowledge": 0.35,
      "Problem Solving": 0.3,
      "Cultural Fit": 0.07,
      "Communication Skills": 0.18,
      "Confidence and Clarity": 0.1,
    };
  }
  if (nt === "behavioral") {
    return {
      ...base,
      "Communication Skills": 0.3,
      "Cultural Fit": 0.25,
      "Confidence and Clarity": 0.2,
      "Technical Knowledge": 0.1,
      "Problem Solving": 0.15,
    };
  }
  return base; // mixed/default
}

function extractCandidateText(transcript) {
  if (!Array.isArray(transcript)) return "";
  // Vapi-style transcripts usually use role: "user" (candidate) and "assistant" (interviewer).
  // If roles differ, fallback to including everything that isn't clearly the interviewer.
  const candidateLines = transcript
    .filter((s) => s && typeof s.content === "string")
    .filter((s) => {
      const r = String(s.role || "").toLowerCase();
      if (r === "user" || r === "candidate") return true;
      if (r === "assistant" || r === "interviewer") return false;
      // Unknown role: include (better than dropping all content)
      return true;
    })
    .map((s) => s.content.trim())
    .filter(Boolean);

  return candidateLines.join("\n");
}

function splitIntoAnswerChunks(transcript) {
  // Break transcript into "candidate answer" chunks between interviewer turns.
  // This gives more stable scoring than embedding one giant blob.
  if (!Array.isArray(transcript) || transcript.length === 0) return [];

  const chunks = [];
  let current = [];

  const isInterviewer = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "assistant" || r === "interviewer";
  };

  const isCandidate = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "user" || r === "candidate";
  };

  for (const msg of transcript) {
    if (!msg || typeof msg.content !== "string") continue;
    const role = msg.role;
    const content = msg.content.trim();
    if (!content) continue;

    if (isInterviewer(role)) {
      if (current.length) {
        chunks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    if (isCandidate(role) || !isInterviewer(role)) {
      current.push(content);
    }
  }

  if (current.length) chunks.push(current.join("\n"));

  // Avoid tiny chunks (e.g. "yes") dominating: merge very small chunks into neighbors.
  const merged = [];
  for (const c of chunks) {
    const wordCount = c.split(/\s+/).filter(Boolean).length;
    if (wordCount < 6 && merged.length) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}\n${c}`;
    } else {
      merged.push(c);
    }
  }
  return merged;
}

function buildTurns({ transcript, questions }) {
  // Attempts to align transcript to interview questions.
  // Deterministic heuristic:
  // - Collect interviewer utterances (assistant/interviewer) as question prompts.
  // - Each prompt starts a new turn; candidate messages attach to the latest turn.
  // - Assign interview.question[i] to turns sequentially; later we can improve alignment by
  //   embedding-similarity matching interviewer prompts to question strings.
  const qs = Array.isArray(questions) ? questions.filter(Boolean) : [];
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return qs.map((q) => ({ question: q, answer: "" }));
  }

  const isInterviewer = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "assistant" || r === "interviewer";
  };

  const isCandidate = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "user" || r === "candidate";
  };

  const rawTurns = [];
  for (const msg of transcript) {
    if (!msg || typeof msg.content !== "string") continue;
    const content = msg.content.trim();
    if (!content) continue;

    if (isInterviewer(msg.role)) {
      rawTurns.push({ prompt: content, answerParts: [] });
      continue;
    }

    if (isCandidate(msg.role) || !isInterviewer(msg.role)) {
      if (!rawTurns.length) rawTurns.push({ prompt: "", answerParts: [] });
      rawTurns[rawTurns.length - 1].answerParts.push(content);
    }
  }

  // Turn answers
  const turns = rawTurns
    .map((t) => ({
      prompt: t.prompt,
      answer: t.answerParts.join("\n").trim(),
    }))
    .filter((t) => t.prompt || t.answer);

  // Assign questions sequentially (best-effort).
  // If there are fewer turns than questions, create empty-answer turns for remaining questions.
  const mapped = [];
  for (let i = 0; i < qs.length; i++) {
    mapped.push({
      question: qs[i],
      prompt: turns[i]?.prompt ?? "",
      answer: turns[i]?.answer ?? "",
    });
  }

  // If we have transcript turns but no question list, still return turns.
  if (!qs.length) {
    return turns.map((t, i) => ({
      question: `Question ${i + 1}`,
      prompt: t.prompt,
      answer: t.answer,
    }));
  }

  return mapped;
}

const FACE_DETECTION_CATEGORY = "Face Detection";

/**
 * Separate face-detection scoring (0–100). Own category; not mixed with
 * Confidence and Clarity or transcript-based categories.
 */
function computeFaceDetectionScore(faceDetectionData) {
  if (!faceDetectionData) {
    return { score: 0, comment: "No face detection data recorded." };
  }
  if (faceDetectionData.isDetected === false) {
    return { score: 0, comment: "No face detected during the call." };
  }

  const lookingAwayRatio = faceDetectionData.lookingAwayRatio ?? 0.5;
  const gazeAwayRatio = faceDetectionData.gazeAwayRatio ?? 0.5;
  const multiPersonRatio = faceDetectionData.multiPersonRatio ?? 0;
  const avgConfidence = faceDetectionData.averageConfidence ?? 0.5;

  let score = 50;
  if (typeof avgConfidence === "number") score += (avgConfidence - 0.5) * 40;
  if (typeof lookingAwayRatio === "number") score += (0.5 - lookingAwayRatio) * 30;
  if (typeof gazeAwayRatio === "number") score += (0.5 - gazeAwayRatio) * 20;
  if (typeof multiPersonRatio === "number") score -= Math.min(20, multiPersonRatio * 100);
  score = clamp(Math.round(score), 0, 100);

  const parts = [];
  if (typeof avgConfidence === "number") parts.push(`${(avgConfidence * 100).toFixed(0)}% face confidence`);
  if (typeof lookingAwayRatio === "number") parts.push(`${(lookingAwayRatio * 100).toFixed(0)}% looking away`);
  if (typeof gazeAwayRatio === "number") parts.push(`${(gazeAwayRatio * 100).toFixed(0)}% gaze away`);
  if (typeof multiPersonRatio === "number" && multiPersonRatio > 0) parts.push(`${(multiPersonRatio * 100).toFixed(0)}% multi-person`);
  const comment = parts.length
    ? `Engagement from camera: ${parts.join("; ")}.`
    : "Engagement score from face detection.";

  return { score, comment };
}

function similarityWeightedScore(similarities, exemplars, categoryName) {
  // Stricter scoring: only count similarities above threshold
  // This prevents weak matches from inflating scores
  // Use higher thresholds and penalty factors for subjective categories
  let SIMILARITY_THRESHOLD = 0.35;
  let PENALTY_FACTOR = 0.80;

  // Apply stricter scoring to subjective categories where AI commentary tends to be more critical
  if (categoryName === "Problem Solving") {
    SIMILARITY_THRESHOLD = 0.40;
    PENALTY_FACTOR = 0.75;
  } else if (categoryName === "Cultural Fit") {
    SIMILARITY_THRESHOLD = 0.40;
    PENALTY_FACTOR = 0.72;
  } else if (categoryName === "Confidence and Clarity") {
    SIMILARITY_THRESHOLD = 0.38;
    PENALTY_FACTOR = 0.75;
  }

  const weights = similarities.map((s) => Math.max(0, s - SIMILARITY_THRESHOLD));
  const denom = weights.reduce((a, b) => a + b, 0);
  if (denom === 0) {
    // If no strong matches, default to lower score (more strict)
    return 30;
  }
  const numer = weights.reduce((sum, w, idx) => sum + w * exemplars[idx].score, 0);
  const rawScore = numer / denom;
  // Apply conservative penalty factor to make scores more strict
  return rawScore * PENALTY_FACTOR;
}

export async function scoreFeedbackDeterministic({ transcript, faceDetectionData, interview }) {
  const candidateText = extractCandidateText(transcript);
  const answerChunks = splitIntoAnswerChunks(transcript);

  if (!candidateText) {
    const neutral = 40;
    const faceResult = computeFaceDetectionScore(faceDetectionData);
    const faceCategory = {
      name: FACE_DETECTION_CATEGORY,
      score: faceResult.score,
      comment: faceResult.comment,
    };
    const baseCategories = CATEGORIES.map((name) => ({
      name,
      score: neutral,
      comment: "Not enough transcript content to score reliably.",
    }));
    return {
      totalScore: neutral,
      categoryScores: [...baseCategories, faceCategory],
      strengths: [],
      areasForImprovement: ["Provide more detailed answers so scoring can be more accurate."],
      finalAssessment:
        "We couldn't compute a reliable score because the transcript was empty or missing candidate responses.",
      perQuestionScores: [],
    };
  }

  const weights = getWeights({ type: interview?.type });

  // Per-question scoring (turn-based)
  const turns = buildTurns({
    transcript,
    questions: interview?.question,
  });

  const perQuestionInputs = turns.map((t) => {
    const q = (t.question || "").trim();
    const a = (t.answer || "").trim();
    return `Question:\n${q}\n\nAnswer:\n${a || "(no answer recorded)"}\n`;
  });

  // Embed each answer chunk, plus all exemplars once.
  const exemplarList = CATEGORIES.flatMap((cat) => EXEMPLARS[cat]);
  const chunkInputs = answerChunks.length ? answerChunks : [candidateText];
  const inputs = [...chunkInputs, ...perQuestionInputs, ...exemplarList.map((e) => e.text)];

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: inputs,
  });

  const chunkEmbeddings = embeddings.slice(0, chunkInputs.length);
  const perQuestionEmbeddings = embeddings.slice(
    chunkInputs.length,
    chunkInputs.length + perQuestionInputs.length
  );
  const exemplarEmbeddings = embeddings.slice(chunkInputs.length + perQuestionInputs.length);

  let offset = 0;
  const categoryScores = [];
  const perQuestionCategoryScores = turns.map(() => []);

  for (const categoryName of CATEGORIES) {
    const ex = EXEMPLARS[categoryName];
    const perChunkScores = [];
    let best = ex[0];
    let bestSim = -1;

    for (const emb of chunkEmbeddings) {
      const sims = ex.map((_, i) => cosineSimilarity(emb, exemplarEmbeddings[offset + i]));
      const rawScore = similarityWeightedScore(sims, ex, categoryName);
      perChunkScores.push(rawScore);

      // Track global best match for deterministic comment
      const localBest = sims
        .map((s, i) => ({ s, i }))
        .sort((a, b) => b.s - a.s)[0];
      if (localBest && localBest.s > bestSim) {
        bestSim = localBest.s;
        best = ex[localBest.i];
      }
    }

    // Aggregate across chunks (median is robust; fall back to mean)
    const sortedScores = perChunkScores.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    const rawScore =
      sortedScores.length % 2 === 1
        ? sortedScores[mid]
        : (sortedScores[mid - 1] + sortedScores[mid]) / 2;

    let score = clamp(Math.round(rawScore), 0, 100);
    categoryScores.push({
      name: categoryName,
      score,
      comment: `Closest match: ${best.label}. Score derived from semantic similarity to labeled exemplars across ${chunkEmbeddings.length} answer chunk(s).`,
    });

    // Per-question scores for this category
    for (let qi = 0; qi < perQuestionEmbeddings.length; qi++) {
      const emb = perQuestionEmbeddings[qi];
      const sims = ex.map((_, i) => cosineSimilarity(emb, exemplarEmbeddings[offset + i]));
      const raw = similarityWeightedScore(sims, ex, categoryName);
      perQuestionCategoryScores[qi].push({
        name: categoryName,
        score: clamp(Math.round(raw), 0, 100),
        comment: `Derived from semantic similarity to labeled exemplars.`,
      });
    }

    offset += ex.length;
  }

  const faceResult = computeFaceDetectionScore(faceDetectionData);
  const faceCategory = {
    name: FACE_DETECTION_CATEGORY,
    score: faceResult.score,
    comment: faceResult.comment,
  };

  const perQuestionScores = turns.map((t, i) => {
    const cats = perQuestionCategoryScores[i];
    const total = clamp(
      Math.round(cats.reduce((sum, c) => sum + c.score * (weights[c.name] ?? 0), 0)),
      0,
      100
    );
    return {
      question: t.question,
      totalScore: total,
      categoryScore: cats,
    };
  });

  const totalScore = clamp(
    Math.round(
      categoryScores.reduce((sum, c) => sum + c.score * (weights[c.name] ?? 0), 0)
    ),
    0,
    100
  );

  // Deterministic strengths / improvement areas (stricter thresholds)
  const sorted = [...categoryScores].sort((a, b) => b.score - a.score);
  const strengths = sorted
    .filter((c) => c.score >= 65)
    .slice(0, 3)
    .map((c) => `${c.name} (${c.score}/100)`);
  const areasForImprovement = [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .filter((c) => c.score <= 60)
    .slice(0, 3)
    .map((c) => `${c.name} (${c.score}/100)`);

  const level = normalizeLevel(interview?.level);
  const type = normalizeType(interview?.type);
  const finalAssessment = `Overall score ${totalScore}/100. Strongest areas: ${
    strengths.length ? strengths.join(", ") : "none detected"
  }. Focus areas: ${
    areasForImprovement.length ? areasForImprovement.join(", ") : "none detected"
  }. (Interview type: ${type}, level: ${level}).`;

  const categoryScoresWithFace = [...categoryScores, faceCategory];

  return {
    totalScore,
    categoryScores: categoryScoresWithFace,
    strengths,
    areasForImprovement,
    finalAssessment,
    perQuestionScores,
  };
}

