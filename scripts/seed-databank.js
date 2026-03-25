const mongoose = require("mongoose");
const fs = require("fs");

// Load .env.local for plain `node` runs (Next.js does this automatically).
function loadEnvLocal() {
  const envPath = `${process.cwd()}/.env.local`;
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvLocal();

// Reads: src/lib/databank/interview-questions.json
const interviewQuestions = require("../src/lib/databank/interview-questions.json");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing env var: "MONGODB_URI"');
  process.exit(1);
}

// Same shape as `src/lib/models/DatabankQuestion.js`
const DatabankQuestionSchema = new mongoose.Schema(
  {
    level: { type: String, required: true, index: true },
    techstack: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    question: { type: String, required: true },
  },
  { timestamps: true }
);

const DatabankQuestion =
  mongoose.models.DatabankQuestion ||
  mongoose.model("DatabankQuestion", DatabankQuestionSchema);

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    clear: args.includes("--clear"),
  };
}

async function main() {
  const { clear } = parseArgs();

  const seed = Array.isArray(interviewQuestions?.questions)
    ? interviewQuestions.questions.map((q) => ({
        level: q.level,
        techstack: q.techstack,
        type: q.type,
        question: q.question,
      }))
    : [];

  if (seed.length === 0) {
    console.error("No questions found in interview-questions.json");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  if (clear) {
    await DatabankQuestion.deleteMany({});
    console.log("Cleared existing DatabankQuestion documents.");
  }

  // Prevent duplicates by (level, techstack, type, question)
  await DatabankQuestion.collection.createIndex(
    { level: 1, techstack: 1, type: 1, question: 1 },
    { unique: true }
  );

  try {
    const result = await DatabankQuestion.insertMany(seed, { ordered: false });
    console.log(`Seed complete. Inserted ${result.length} questions.`);
  } catch (err) {
    // Duplicate key errors are expected if you already seeded once.
    // With ordered:false, Mongo continues inserting other documents.
    if (err && err.writeErrors) {
      console.log(
        `Seed complete with some errors. Inserted documents may be partial. Errors: ${err.writeErrors.length}`
      );
    } else {
      console.error("Seed failed:", err);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

