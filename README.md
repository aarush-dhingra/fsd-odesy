# 🎓 Student Performance Predictor

A full-stack web application that uses machine learning to predict student academic performance based on attendance, study hours, assignments, internal marks, and extracurricular activities. The system helps educators identify at-risk students early and provides actionable insights for improving student outcomes.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Python%20%7C%20MongoDB-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### For Students
- **Personal Performance Prediction**: Get AI-powered predictions about your academic performance
- **Risk Assessment**: Understand your risk level (Safe, At-Risk, or Critical)
- **What-If Scenarios**: Simulate different scenarios to see how changes affect your performance
- **Performance History**: View your prediction history and track improvements
- **Confidence Levels**: See how confident the model is in its predictions

### For Faculty
- **Batch Predictions**: Upload Excel files with multiple students for bulk analysis
- **Dashboard Analytics**: Comprehensive dashboard with student statistics and trends
- **Batch Management**: Create, view, and manage student batches
- **Student Details**: View detailed information for each student including name, roll number, and email
- **Risk Categorization**: Automatically categorize students by risk level
- **Batch Deletion**: Manage and clean up batch data

### Technical Features
- **Random Forest ML Model**: High-accuracy predictions using ensemble learning
- **Real-time Predictions**: Fast API responses for instant feedback
- **Excel File Processing**: Support for batch uploads via Excel files
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access**: Separate dashboards for students and faculty
- **Responsive Design**: Modern, mobile-friendly UI with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **XLSX** - Excel file parsing

### Machine Learning API
- **Python 3.8+** - Programming language
- **FastAPI** - Modern Python web framework
- **Scikit-learn** - Machine learning library
- **Random Forest** - ML algorithm
- **Pandas** - Data manipulation
- **Joblib** - Model serialization

## 📁 Project Structure

```
fsd-odesy/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── node-api/            # Node.js/Express API
│   │   ├── src/
│   │   │   ├── controllers/ # Route controllers
│   │   │   ├── models/      # MongoDB models
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   └── middleware/  # Auth, error handling
│   │   ├── server.js        # Server entry point
│   │   └── package.json
│   │
│   └── ml-api/              # Python/FastAPI ML service
│       ├── app/
│       │   ├── routers/     # API endpoints
│       │   ├── services/     # Prediction logic
│       │   └── core/         # Configuration
│       ├── main.py           # FastAPI app
│       ├── train_model.py    # Model training script
│       ├── requirements.txt
│       └── model.pkl         # Trained model (generated)
│
└── README.md                 # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) and npm
- **Python** (3.8 or higher) and pip
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fsd-odesy
```

### 2. Set Up the Backend (Node.js API)

```bash
cd backend/node-api
npm install
```

Create a `.env` file in `backend/node-api/`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
ML_API_BASE_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
```

### 3. Set Up the Machine Learning API

```bash
cd backend/ml-api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Train the ML Model

**⚠️ Important**: You must train the model before starting the ML API.

```bash
# Ensure your dataset file is in backend/ml-api/
# (e.g., student_performance_balanced.xlsx)

python train_model.py
```

This will:
- Load and merge training datasets
- Train a Random Forest classifier
- Save the model as `model.pkl`
- Display accuracy metrics

### 5. Set Up the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🏃 Running the Application

### Start All Services

You need to run three services simultaneously. Open three separate terminal windows:

#### Terminal 1: ML API (Python/FastAPI)

```bash
cd backend/ml-api
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac
uvicorn main:app --reload --port 8000
```

The ML API will be available at: `http://localhost:8000`

#### Terminal 2: Node.js API

```bash
cd backend/node-api
npm run dev
```

The Node API will be available at: `http://localhost:5000`

#### Terminal 3: Frontend (React)

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:5173` (or the port shown in terminal)

### Verify Services

- **ML API Health**: `http://localhost:8000/health`
- **Node API Health**: `http://localhost:5000/api/health`
- **Frontend**: `http://localhost:5173`

## 📖 Usage

### For Students

1. **Sign Up**: Create an account with your email, name, and role as "student"
2. **Login**: Access your student dashboard
3. **Make Predictions**: Enter your attendance, study hours, assignments, and activities
4. **View Results**: See your predicted performance, risk level, and confidence score
5. **Explore Scenarios**: Use the "What-If Simulator" to test different inputs
6. **View History**: Check your previous predictions in the dashboard

### For Faculty

1. **Sign Up**: Create an account with your email, name, and role as "faculty"
2. **Login**: Access your faculty dashboard
3. **Upload Batch**: 
   - Go to "Batch Upload"
   - Download the template Excel file
   - Fill in student data (name, roll number, email, attendance, study hours, etc.)
   - Upload the file with a batch name
4. **View Batches**: See all uploaded batches in the batch dashboard
5. **View Predictions**: Click on a batch to see individual student predictions
6. **Manage Batches**: Delete batches if needed

### Excel Template Format

The batch upload Excel file should have the following columns:

| Column Name | Description | Required |
|------------|-------------|----------|
| `name` | Student name | Yes |
| `roll_number` | Student roll number | Yes |
| `email` | Student email | Yes |
| `attendance` | Attendance percentage (0-100) | Yes |
| `study_hours` | Hours studied per week | Yes |
| `assignments_submitted` | Number of assignments completed | Yes |
| `internal_marks` | Internal test marks | Optional |
| `activities` | Activity level: "low", "medium", or "high" | Yes |

## 🔌 API Endpoints

### Node.js API (`http://localhost:5000/api`)

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)

#### Predictions
- `POST /predictions` - Create single prediction (protected)
- `GET /predictions` - Get user's predictions (protected)
- `GET /predictions/:id` - Get specific prediction (protected)

#### Batches
- `POST /batches/upload` - Upload batch Excel file (faculty only)
- `GET /batches` - Get all batches (faculty only)
- `GET /batches/:id` - Get batch details (faculty only)
- `DELETE /batches/:id` - Delete batch (faculty only)

### ML API (`http://localhost:8000`)

- `GET /health` - Health check
- `POST /predict/single` - Single prediction
- `POST /predict/batch` - Batch prediction
- `GET /diagnostic/model-status` - Model information
- `GET /docs` - Swagger API documentation

For detailed ML API documentation, see [backend/ml-api/README.md](backend/ml-api/README.md)

## 🎯 Model Details

### Algorithm
- **Random Forest Classifier** (Ensemble of 200 decision trees)
- Handles class imbalance with `class_weight="balanced"`
- Out-of-bag scoring for validation

### Features
- **Numeric**: `attendance`, `study_hours`, `internal_marks`, `assignments_submitted`
- **Categorical**: `activities` (low/medium/high)

### Risk Categories
- **Safe**: Risk score < 40% (Low probability of failing)
- **At-Risk**: Risk score 40-70% (Moderate risk)
- **Critical**: Risk score ≥ 70% (High probability of failing)

### Model Performance
- Typical accuracy: **90-95%+**
- Precision and recall balanced for both Pass/Fail classes
- Feature importance analysis available

## 🔧 Configuration

### Environment Variables

#### Node.js API (`.env` in `backend/node-api/`)
```env
MONGODB_URI=mongodb://localhost:27017/student-predictor
JWT_SECRET=your-secret-key-here
ML_API_BASE_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
```

#### Frontend (`.env` in `frontend/`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🧪 Testing

### Test ML API

```bash
cd backend/ml-api
python verify_model.py
```

### Test Node API

```bash
cd backend/node-api
npm test  # If tests are configured
```

## 🐛 Troubleshooting

### ML API Issues

**Problem**: Model not found / Using dummy model
- **Solution**: Run `python train_model.py` to train the model

**Problem**: Import errors
- **Solution**: Ensure virtual environment is activated and run `pip install -r requirements.txt`

### Node API Issues

**Problem**: MongoDB connection error
- **Solution**: Check `MONGODB_URI` in `.env` file and ensure MongoDB is running

**Problem**: ML API not found
- **Solution**: Ensure ML API is running on port 8000 before starting Node API

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check `VITE_API_BASE_URL` in `.env` and ensure backend services are running

**Problem**: Build errors
- **Solution**: Run `npm install` again and clear `node_modules` if needed

## 📝 Development

### Code Structure

- **Frontend**: Component-based architecture with React hooks
- **Backend**: MVC pattern with Express.js
- **ML API**: Service-oriented architecture with FastAPI

### Adding New Features

1. **Frontend**: Add components in `frontend/src/components/`
2. **Backend**: Add routes in `backend/node-api/src/routes/`
3. **ML API**: Add endpoints in `backend/ml-api/app/routers/`

### Retraining the Model

1. Update dataset in `backend/ml-api/`
2. Run `python train_model.py`
3. Restart ML API server

### Demo Video
https://drive.google.com/file/d/140cnhEsJtSB7LTnJYO27TjzAxhov53im/view?usp=sharing





