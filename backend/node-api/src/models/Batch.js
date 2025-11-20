import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Batch', batchSchema);
