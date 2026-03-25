import mongoose from "mongoose";

const DatabankQuestionSchema = new mongoose.Schema(
  {
    level: { type: String, required: true, index: true },
    techstack: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    question: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.DatabankQuestion ||
  mongoose.model("DatabankQuestion", DatabankQuestionSchema);

