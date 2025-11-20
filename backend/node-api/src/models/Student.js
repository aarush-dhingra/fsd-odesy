import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rollNumber: { type: String, required: true, unique: true },
    department: String,
    year: Number,
    extraInfo: Object,
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
