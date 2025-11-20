import Prediction from '../models/Prediction.js';
import Batch from '../models/Batch.js';
import ActivityLog from '../models/ActivityLog.js';
import { mlService } from './mlService.js';

export const predictionService = {
  createSingle: async ({ user, student, inputFeatures }) => {
    const mlResult = await mlService.singlePredict({ features: inputFeatures });

    const prediction = await Prediction.create({
      student: student?._id || student,
      inputFeatures,
      predictedLabel: mlResult.predicted_label,
      riskCategory: mlResult.risk_category,
      riskScore: mlResult.risk_score,
      featureImportance: mlResult.feature_importance,
      createdBy: user._id,
    });

    await ActivityLog.create({
      user: user._id,
      action: 'single_prediction_created',
      meta: { predictionId: prediction._id },
    });

    return prediction;
  },

  createBatch: async ({ user, batch, records }) => {
    await Batch.findByIdAndUpdate(batch._id, { status: 'processing' });

    try {
      // Extract only features for ML API (without name, roll_number, etc.)
      // Map assignments_completed to assignments_submitted for ML API
      const featuresOnly = records.map((record) => ({
        attendance: record.attendance,
        study_hours: record.study_hours,
        assignments_submitted: record.assignments_submitted || record.assignments_completed || 0,
        internal_marks: record.internal_marks || null,
        activities: record.activities || 'low',
      }));

      const mlResponse = await mlService.batchPredict({ records: featuresOnly });
      
      // ML API returns { items: [...] }, so extract the items array
      const mlResults = mlResponse.items || mlResponse || [];
      
      if (!Array.isArray(mlResults)) {
        console.error('ML API response is not an array:', mlResponse);
        throw new Error('Invalid response from ML API: expected array of results');
      }

      // Combine ML results with original records to preserve student info
      const docs = mlResults.map((mlResult, index) => {
        const originalRecord = records[index];
        return {
          batch: batch._id,
          inputFeatures: {
            // Include all original features plus student info
            attendance: originalRecord.attendance,
            study_hours: originalRecord.study_hours,
            assignments_submitted: originalRecord.assignments_submitted || originalRecord.assignments_completed || 0,
            assignments_completed: originalRecord.assignments_submitted || originalRecord.assignments_completed || 0, // Keep for backward compatibility
            internal_marks: originalRecord.internal_marks || null,
            activities: originalRecord.activities || 'low',
            // Preserve student information
            name: originalRecord.name || null,
            student_name: originalRecord.name || null,
            roll_number: originalRecord.roll_number || null,
            rollNumber: originalRecord.roll_number || null,
            email: originalRecord.email || null,
          },
          predictedLabel: mlResult.predicted_label,
          riskCategory: mlResult.risk_category,
          riskScore: mlResult.risk_score,
          featureImportance: mlResult.feature_importance || {},
          createdBy: user._id,
        };
      });

      await Prediction.insertMany(docs);

      await Batch.findByIdAndUpdate(batch._id, { status: 'completed' });

      await ActivityLog.create({
        user: user._id,
        action: 'batch_prediction_completed',
        meta: { batchId: batch._id, count: docs.length },
      });

      return docs;
    } catch (err) {
      await Batch.findByIdAndUpdate(batch._id, { status: 'failed' });
      throw err;
    }
  },
};
