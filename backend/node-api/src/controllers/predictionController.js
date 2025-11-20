import Prediction from '../models/Prediction.js';
import Batch from '../models/Batch.js';
import { predictionService } from '../services/predictionService.js';
import { parseExcelBuffer } from '../utils/excelParser.js';
import { success, failure } from '../utils/responseFormatter.js';

export const createSinglePrediction = async (req, res, next) => {
  try {
    const inputFeatures = req.body;
    if (!inputFeatures || typeof inputFeatures !== 'object') {
      return failure(res, 'Invalid features payload');
    }

    const prediction = await predictionService.createSingle({
      user: req.user,
      student: req.body.studentId || null,
      inputFeatures,
    });

    return success(res, prediction, 'Single prediction created');
  } catch (err) {
    next(err);
  }
};

export const uploadBatch = async (req, res, next) => {
  try {
    if (!req.file) return failure(res, 'No file uploaded');

    const rows = parseExcelBuffer(req.file.buffer);

    const batch = await Batch.create({
      name: req.body.name || req.file.originalname,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
    });

    const records = rows.map((row) => ({ ...row }));

    const predictions = await predictionService.createBatch({
      user: req.user,
      batch,
      records,
    });

    return success(res, { batch, count: predictions.length }, 'Batch prediction created');
  } catch (err) {
    next(err);
  }
};

export const listPredictions = async (req, res, next) => {
  try {
    const preds = await Prediction.find().sort({ createdAt: -1 }).limit(100);
    return success(res, preds, 'Predictions list');
  } catch (err) {
    next(err);
  }
};

export const saveUserPrediction = async (req, res, next) => {
  try {
    console.log('saveUserPrediction called with body:', req.body);
    console.log('User:', req.user?.email);
    
    const { attendance, studyHours, assignmentsCompleted, internalMarks, prediction, riskScore, riskLevel } = req.body;

    // Validate required fields
    if (attendance === undefined || studyHours === undefined || assignmentsCompleted === undefined) {
      console.log('Validation failed: missing required fields');
      return failure(res, 'Attendance, study hours, and assignments completed are required', 400);
    }

    const predictionDoc = await Prediction.create({
      createdBy: req.user._id,
      inputFeatures: {
        attendance: parseFloat(attendance),
        study_hours: parseFloat(studyHours),
        assignments_completed: parseFloat(assignmentsCompleted),
        internal_marks: internalMarks ? parseFloat(internalMarks) : null,
      },
      predictedLabel: prediction || 'Pass',
      riskCategory: riskLevel || 'Safe',
      riskScore: parseFloat(riskScore) || 0,
    });

    console.log('Prediction saved successfully:', predictionDoc._id);
    return success(res, predictionDoc, 'Prediction saved');
  } catch (err) {
    console.error('Save prediction error:', err);
    next(err);
  }
};

export const getUserPredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    // Format for frontend
    const formatted = predictions.map((pred) => ({
      _id: pred._id,
      attendance: pred.inputFeatures?.attendance || 0,
      studyHours: pred.inputFeatures?.study_hours || pred.inputFeatures?.studyHours || 0,
      assignmentsCompleted: pred.inputFeatures?.assignments_completed || pred.inputFeatures?.assignmentsCompleted || 0,
      prediction: pred.predictedLabel || 'Pass',
      riskScore: pred.riskScore || 0,
      riskLevel: pred.riskCategory || 'Safe',
      createdAt: pred.createdAt,
      timestamp: pred.createdAt,
    }));

    return success(res, formatted, 'User predictions');
  } catch (err) {
    console.error('Get predictions error:', err);
    next(err);
  }
};