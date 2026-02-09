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
      score: 95,
      text: "I’ll start with a quick summary, then go step by step, and I’ll call out tradeoffs and assumptions as I go.",
      label: "Structured, clear, sets context",
    },
    {
      score: 75,
      text: "I would use Next.js for server-side rendering and handle forms with React Hook Form. That way I can manage state better and provide good validation.",
      label: "Direct, practical, explains reasoning",
    },
    {
      score: 60,
      text: "I think you could use async/await to handle requests, and maybe use Axios or fetch to get the data from the server.",
      label: "Reasonable approach, some elaboration",
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
      text: "Next.js handles server-side rendering, so you can fetch data on the server and pass it to components. For async operations, I'd use async/await with try-catch to handle errors properly.",
      label: "Correct understanding of framework concepts",
    },
    {
      score: 55,
      text: "I know about async/await and how to use libraries like Axios. I've worked with form libraries to manage state.",
      label: "Foundational knowledge, less detail on implementation",
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
      text: "I would suggest using relevant tools and patterns like React Hook Form for forms or async/await for asynchronous operations, then implement and test.",
      label: "Suggests practical tools and patterns",
    },
    {
      score: 55,
      text: "I'd look for an existing library or pattern that solves similar problems and apply that approach to this situation.",
      label: "Tool-oriented problem solving",
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
      text: "I prefer specific tools like Axios and React Hook Form because they work well for me, and I'm willing to learn new approaches if the team uses something different.",
      label: "Tool preference + adaptability",
    },
    {
      score: 55,
      text: "I have my preferred tools and I'm open to learning and adapting to what the team uses.",
      label: "Openness to learning",
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
      text: "I would use async/await to handle asynchronous operations. That's a solid approach and handles errors well with try-catch.",
      label: "Speaks with moderate confidence on familiar topics",
    },
    {
      score: 55,
      text: "I think that approach could work. There might be some hesitation or pauses when explaining unfamiliar concepts.",
      label: "Moderate confidence with some uncertainty",
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

function isNonAnswer(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return true;
  const nonAnswerPhrases = [
    "i don't know",
    "i dont know",
    "don't know",
    "dont know",
    "i don't have",
    "i dont have",
    "no answer",
    "skip",
    "pass",
    "not sure",
    "i'm not sure",
    "im not sure",
    "can't answer",
    "cant answer",
    "don't have an answer",
    "dont have an answer",
    "no idea",
    "next question",
    "move on",
  ];
  return nonAnswerPhrases.some((p) => t.includes(p) || t === p);
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

function normalizeMessage(msg) {
  if (!msg || typeof msg !== "object") return null;
  const content = msg.content ?? msg.transcript ?? msg.message ?? msg.text ?? "";
  if (typeof content !== "string") return null;
  return { role: msg.role, content: content.trim() };
}

function extractCandidateText(transcript) {
  if (!Array.isArray(transcript)) return "";
  // Vapi-style: role "user"/"caller" (candidate), "assistant" (interviewer).
  const candidateLines = transcript
    .map(normalizeMessage)
    .filter(Boolean)
    .filter((s) => {
      const r = String(s.role || "").toLowerCase();
      if (r === "user" || r === "candidate" || r === "caller") return true;
      if (r === "assistant" || r === "interviewer" || r === "agent") return false;
      return true; // Unknown: include
    })
    .map((s) => s.content)
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
  const qs = Array.isArray(questions) ? questions.filter(Boolean) : [];
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return qs.map((q) => ({ question: q, answer: "" }));
  }

  const isInterviewer = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "assistant" || r === "interviewer" || r === "agent";
  };

  const isCandidate = (role) => {
    const r = String(role || "").toLowerCase();
    return r === "user" || r === "candidate" || r === "caller";
  };

  const rawTurns = [];
  for (const raw of transcript) {
    const msg = normalizeMessage(raw);
    if (!msg || !msg.content) continue;
    const { role, content } = msg;

    if (isInterviewer(role)) {
      rawTurns.push({ prompt: content, answerParts: [] });
      continue;
    }

    if (isCandidate(role) || !isInterviewer(role)) {
      if (!rawTurns.length) rawTurns.push({ prompt: "", answerParts: [] });
      rawTurns[rawTurns.length - 1].answerParts.push(content);
    }
  }

  // Turn answers
  let turns = rawTurns
    .map((t) => ({
      prompt: t.prompt,
      answer: t.answerParts.join("\n").trim(),
    }))
    .filter((t) => t.prompt || t.answer);

  // Skip greeting turn so Q1 maps to first real Q&A (not "Hi")
  const isGreeting = (p) => {
    const s = (p || "").toLowerCase();
    return s.includes("hello") || s.includes("thank you for taking") || s.includes("how are you") || (s.length < 80 && /^(hi|hello|hey)\b/i.test(s));
  };
  if (turns.length > qs.length && turns[0] && isGreeting(turns[0].prompt)) {
    turns = turns.slice(1);
  }

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
  // Similarity threshold: only count matches above this
  let SIMILARITY_THRESHOLD = 0.28;
  let PENALTY_FACTOR = 1.0;

  if (categoryName === "Problem Solving") {
    SIMILARITY_THRESHOLD = 0.32;
    PENALTY_FACTOR = 1.0;
  } else if (categoryName === "Cultural Fit") {
    SIMILARITY_THRESHOLD = 0.32;
    PENALTY_FACTOR = 1.0;
  } else if (categoryName === "Confidence and Clarity") {
    SIMILARITY_THRESHOLD = 0.30;
    PENALTY_FACTOR = 1.0;
  }

  const weights = similarities.map((s) => Math.max(0, (Number(s) || 0) - SIMILARITY_THRESHOLD));
  const denom = weights.reduce((a, b) => a + b, 0);
  if (denom === 0 || !Number.isFinite(denom)) {
    return 40;
  }
  const numer = weights.reduce((sum, w, idx) => sum + w * (exemplars[idx]?.score ?? 50), 0);
  const rawScore = numer / denom;
  const result = (Number(rawScore) || 40) * PENALTY_FACTOR;
  return Number.isFinite(result) ? result : 40;
}

const MIN_WORDS_FOR_SCORING = 15; // Require substantive answers; short replies (yes/no, I don't know) = insufficient

export async function scoreFeedbackDeterministic({ transcript, faceDetectionData, interview }) {
  const candidateText = extractCandidateText(transcript);
  const answerChunks = splitIntoAnswerChunks(transcript);
  const candidateWordCount = (candidateText || "").split(/\s+/).filter(Boolean).length;
  const hasInsufficientAnswers = !candidateText || candidateWordCount < MIN_WORDS_FOR_SCORING;

  if (hasInsufficientAnswers) {
    const neutral = 0;
    const faceResult = computeFaceDetectionScore(faceDetectionData);
    const faceCategory = {
      name: FACE_DETECTION_CATEGORY,
      score: faceResult.score,
      comment: faceResult.comment,
    };
    const baseCategories = CATEGORIES.map((name) => ({
      name,
      score: neutral,
      comment:
        candidateWordCount === 0
          ? "No transcript content to score."
          : "Insufficient answers provided to score reliably (too few words).",
    }));
    return {
      totalScore: neutral,
      categoryScores: [...baseCategories, faceCategory],
      strengths: [],
      areasForImprovement: [
        "Provide more detailed answers so the 5 transcript-based categories can be scored.",
      ],
      finalAssessment:
        candidateWordCount === 0
          ? "No candidate responses were recorded. Please answer the interview questions to receive scores."
          : "Answers were too brief to score reliably. Please provide more detailed responses to receive meaningful feedback.",
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

  // Embed answer chunks + per-question inputs + exemplars
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

  const totalQuestions = Math.max(1, turns.length);
  const substantiveChunks = chunkInputs.filter(
    (c) => (c || "").split(/\s+/).filter(Boolean).length >= 5
  ).length;
  const substantiveAnswers = Math.max(substantiveChunks, turns.filter(
    (t) => (t?.answer || "").split(/\s+/).filter(Boolean).length >= 5
  ).length);
  // Avoid zeroing out when we have content but answers are fragmented
  let completenessFactor =
    substantiveAnswers > 0
      ? Math.min(1, substantiveAnswers / totalQuestions)
      : Math.max(0.25, 1 / totalQuestions);
  // If all content is in one chunk (e.g. only user msgs, no assistant) and it's substantial, don't penalize
  if (
    substantiveAnswers < totalQuestions &&
    chunkInputs.length === 1 &&
    (chunkInputs[0] || "").split(/\s+/).filter(Boolean).length >= 30
  ) {
    completenessFactor = 1;
  }

  for (const categoryName of CATEGORIES) {
    const ex = EXEMPLARS[categoryName];
    const perChunkScores = [];
    let best = ex[0];
    let bestSim = -1;

    for (const emb of chunkEmbeddings) {
      const sims = ex.map((_, i) => cosineSimilarity(emb, exemplarEmbeddings[offset + i]));
      const rawScore = similarityWeightedScore(sims, ex, categoryName);
      perChunkScores.push(rawScore);
      const localBest = sims.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s)[0];
      if (localBest && localBest.s > bestSim) {
        bestSim = localBest.s;
        best = ex[localBest.i];
      }
    }

    const sortedScores = perChunkScores.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    const rawScore =
      sortedScores.length === 0
        ? 50
        : sortedScores.length % 2 === 1
          ? sortedScores[mid]
          : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
    let score = clamp(Math.round(Number(rawScore) || 0), 0, 100);
    score = Math.round(score * completenessFactor);

    categoryScores.push({
      name: categoryName,
      score,
      comment: `Closest match: ${best.label}. ${substantiveAnswers}/${totalQuestions} substantive answer(s).`,
    });

    for (let qi = 0; qi < perQuestionEmbeddings.length; qi++) {
      const turn = turns[qi];
      const answerText = (turn?.answer || "").trim();
      const emb = perQuestionEmbeddings[qi];
      const sims = ex.map((_, i) => cosineSimilarity(emb, exemplarEmbeddings[offset + i]));
      const raw = similarityWeightedScore(sims, ex, categoryName);
      const wordCount = answerText.split(/\s+/).filter(Boolean).length;
      let s;
      if (isNonAnswer(answerText)) {
        s = 0;
      } else if (wordCount >= 5) {
        s = clamp(Math.round(raw), 0, 100);
      } else {
        s = score; // Short but not non-answer (misalignment) – use overall
      }
      perQuestionCategoryScores[qi].push({
        name: categoryName,
        score: clamp(s, 0, 100),
        comment: isNonAnswer(answerText)
          ? "No substantive answer."
          : wordCount >= 5
            ? "Derived from semantic similarity."
            : "Short answer; using overall impression.",
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

  perQuestionScores.forEach((pq, i) => {
    const qPreview = ((pq.question || "") + "").slice(0, 60);
    console.log(`[Score] Question ${i + 1}: ${pq.totalScore}/100 | ${qPreview}${qPreview.length >= 60 ? "..." : ""}`);
    pq.categoryScore?.forEach((c) => {
      console.log(`  - ${c.name}: ${c.score}/100`);
    });
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

