import Batch from '../models/Batch.js';
import Prediction from '../models/Prediction.js';
import { parseExcelBuffer } from '../utils/excelParser.js';
import { predictionService } from '../services/predictionService.js';
import { success, failure } from '../utils/responseFormatter.js';

export const listBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('uploadedBy', 'name email');
    
    // Calculate stats for each batch
    const batchesWithStats = await Promise.all(
      batches.map(async (batch) => {
        const predictions = await Prediction.find({ batch: batch._id });
        const safeCount = predictions.filter((p) => p.riskCategory === 'Safe' || p.riskCategory === 'low').length;
        const atRiskCount = predictions.filter((p) => p.riskCategory === 'At-Risk' || p.riskCategory === 'medium').length;
        const criticalCount = predictions.filter((p) => p.riskCategory === 'Critical' || p.riskCategory === 'high').length;
        
        return {
          ...batch.toObject(),
          totalStudents: predictions.length,
          safeCount,
          atRiskCount,
          criticalCount,
        };
      })
    );
    
    return success(res, batchesWithStats, 'Batches list');
  } catch (err) {
    next(err);
  }
};

export const getBatchDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id).populate('uploadedBy', 'name email');
    
    if (!batch) {
      return failure(res, 'Batch not found', 404);
    }
    
    const predictions = await Prediction.find({ batch: id })
      .sort({ createdAt: -1 })
      .populate('student', 'name rollNumber');
    
    // Format predictions for frontend
    const students = predictions.map((pred) => {
      const features = pred.inputFeatures || {};
      return {
        _id: pred._id,
        name: features.name || features.student_name || `Student ${pred._id}`,
        rollNumber: features.roll_number || features.rollNumber || null,
        attendance: features.attendance || 0,
        studyHours: features.study_hours || features.studyHours || 0,
        assignmentsCompleted: features.assignments_completed || features.assignmentsCompleted || 0,
        internalMarks: features.internal_marks || features.internalMarks || null,
        prediction: pred.predictedLabel === 'at_risk' ? 'Fail' : 'Pass',
        riskScore: Math.round((pred.riskScore || 0) * 100), // Convert 0-1 to 0-100 if needed
        riskLevel: pred.riskCategory === 'high' ? 'Critical' : pred.riskCategory === 'medium' ? 'At-Risk' : 'Safe',
      };
    });
    
    return success(res, { batch, students }, 'Batch details');
  } catch (err) {
    next(err);
  }
};

export const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find batch and verify ownership
    const batch = await Batch.findById(id);
    
    if (!batch) {
      return failure(res, 'Batch not found', 404);
    }
    
    // Check if user owns the batch or is admin
    if (batch.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return failure(res, 'You do not have permission to delete this batch', 403);
    }
    
    // Delete all predictions associated with this batch
    await Prediction.deleteMany({ batch: id });
    
    // Delete the batch
    await Batch.findByIdAndDelete(id);
    
    console.log(`Batch ${id} deleted by user ${req.user.email}`);
    
    return success(res, { id }, 'Batch deleted successfully');
  } catch (err) {
    console.error('Delete batch error:', err);
    next(err);
  }
};

export const uploadBatch = async (req, res, next) => {
  try {
    console.log('Batch upload request received');
    console.log('File:', req.file?.originalname);
    console.log('Batch name:', req.body.name);
    
    if (!req.file) {
      return failure(res, 'No file uploaded', 400);
    }

    const batchName = req.body.name || req.body.batchName || `Batch ${new Date().toLocaleDateString()}`;
    
    // Parse Excel file
    const rows = parseExcelBuffer(req.file.buffer);
    
    if (!rows || rows.length === 0) {
      return failure(res, 'Excel file is empty or could not be parsed', 400);
    }

    console.log(`Parsed ${rows.length} rows from Excel file`);

    // Create batch
    const batch = await Batch.create({
      name: batchName,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      status: 'processing',
    });

    console.log(`Created batch: ${batch._id}`);

    // Prepare records for ML API (extract features, preserve student names)
    const records = rows.map((row) => {
      // Extract features for ML API (only the 4 numeric + 1 categorical)
      const features = {
        attendance: parseFloat(row.attendance) || parseFloat(row.Attendance) || 0,
        study_hours: parseFloat(row.study_hours) || parseFloat(row['study hours']) || parseFloat(row['Study Hours']) || 0,
        assignments_submitted: parseFloat(row.assignments_submitted) || parseFloat(row.assignments_completed) || parseFloat(row['assignments submitted']) || parseFloat(row['assignments completed']) || parseFloat(row['Assignments']) || 0,
        internal_marks: row.internal_marks || row['internal marks'] || row['Internal Marks'] ? parseFloat(row.internal_marks || row['internal marks'] || row['Internal Marks']) : null,
        activities: row.activities || row.Activities || row['Activities'] || 'low',
      };
      
      // Preserve student information
      return {
        ...features,
        name: row.name || row.Name || row.student_name || row['Student Name'] || null,
        roll_number: row.roll_number || row.rollNumber || row['Roll Number'] || row['Roll No'] || null,
        email: row.email || row.Email || null,
      };
    });

    // Create batch predictions
    let predictions;
    try {
      predictions = await predictionService.createBatch({
        user: req.user,
        batch,
        records,
      });
    } catch (err) {
      console.error('Error creating batch predictions:', err);
      await Batch.findByIdAndUpdate(batch._id, { status: 'failed' });
      throw err;
    }

    console.log(`Created ${predictions.length} predictions for batch ${batch._id}`);

    // Calculate statistics
    const safeCount = predictions.filter((p) => p.riskCategory === 'low' || p.riskCategory === 'Safe').length;
    const atRiskCount = predictions.filter((p) => p.riskCategory === 'medium' || p.riskCategory === 'At-Risk').length;
    const criticalCount = predictions.filter((p) => p.riskCategory === 'high' || p.riskCategory === 'Critical').length;

    return success(
      res,
      {
        batch: {
          ...batch.toObject(),
          totalStudents: predictions.length,
          safeCount,
          atRiskCount,
          criticalCount,
        },
        count: predictions.length,
      },
      'Batch uploaded and processed successfully'
    );
  } catch (err) {
    console.error('Batch upload error:', err);
    next(err);
  }
};
