import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    inputFeatures: { type: Object, required: true }, // Can include name, roll_number, etc.
    predictedLabel: String,
    riskCategory: String,
    riskScore: Number,
    featureImportance: { type: Object },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Prediction', predictionSchema);
