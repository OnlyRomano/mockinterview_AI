const fs = require("fs");
const path = "src/lib/scoring/feedbackScorer.js";
let s = fs.readFileSync(path, "utf8");

const old = /if \(!candidateText\) \{\s+const neutral = 40;\s+return \{\s+totalScore: neutral,\s+categoryScores: CATEGORIES\.map\(\(name\) => \(\{\s+name,\s+score: neutral,\s+comment: "Not enough transcript content to score reliably\.",\s+\}\)\),\s+strengths: \[\],\s+areasForImprovement: \["Provide more detailed answers so scoring can be more accurate\.\"\],\s+finalAssessment:\s+"We couldn[\u0027\u2019]t compute a reliable score because the transcript was empty or missing candidate responses\.",\s+\};\s+\}/;

const neu = `if (!candidateText) {
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
  }`;

if (!old.test(s)) {
  console.error("Old block not found");
  process.exit(1);
}
s = s.replace(old, "  " + neu);
fs.writeFileSync(path, s);
console.log("Patched early-return block.");
