import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    question: {
      type: [String],
      required: true,
    },
    techstack: {
      type: [String],
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    finalized: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Interview ||
  mongoose.model("Interview", InterviewSchema);
