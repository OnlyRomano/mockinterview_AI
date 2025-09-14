import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            required: true, 
        },
        comment: {
            type: String,
            required: true,
        }
    }, { _id : false }, { timestamps: true }
)

const FeedbackSchema = new mongoose.Schema(
    {
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        totalScore: {
            type: Number,
            required: true,
        },
        categoryScore: {
            type: [CategorySchema],
            required: true,
        },
        strengths: {
            type: [String],
            required: true,
        },
        areasForImprovement: {
            type: [String],
            required: true,
        },
        finalAssessment: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);