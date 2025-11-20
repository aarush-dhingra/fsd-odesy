import Student from '../models/Student.js';
import { success, failure } from '../utils/responseFormatter.js';

export const createStudent = async (req, res, next) => {
  try {
    const body = req.body;
    const exists = await Student.findOne({ rollNumber: body.rollNumber });
    if (exists) return failure(res, 'Student already exists');

    const student = await Student.create({ ...body });
    return success(res, student, 'Student created');
  } catch (err) {
    next(err);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).limit(200);
    return success(res, students, 'Students list');
  } catch (err) {
    next(err);
  }
};
