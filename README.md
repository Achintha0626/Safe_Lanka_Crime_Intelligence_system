# SafeLanka - Crime Prediction & Analysis System

A comprehensive crime prediction and analysis platform for Sri Lanka, featuring AI-powered forecasting, interactive heatmaps, and patrol management.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** and npm - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone <repository-url>
cd safelanka
```

### 2. Backend Setup

#### Step 2.1: Navigate to Backend Directory

```bash
cd backend/server
```

#### Step 2.2: Install Python Dependencies

```bash
pip install -r ../requirements.txt
```

**Required packages include:**

- Django 4.x
- Django REST Framework
- Django CORS Headers
- scikit-learn
- pandas, numpy
- joblib

#### Step 2.3: Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 2.4: Create Admin User

```bash
python create_admin.py
```

**Default admin credentials:**

- Username: `admin`
- Password: `admin123`

#### Step 2.5: Seed Initial Data (Optional)

```bash
python manage.py seed_data
```

#### Step 2.6: Start Backend Server

```bash
python manage.py runserver 8002
```

The backend API will be available at: `http://localhost:8002`

### 3. Frontend Setup

#### Step 3.1: Navigate to Frontend Directory

```bash
cd frontend/safelanka-frontend
```

#### Step 3.2: Install Node Dependencies

```bash
npm install
```

**Key dependencies:**

- React 18
- Vite
- Recharts (for data visualization)
- Leaflet (for maps)
- html2pdf.js (for report generation)

#### Step 3.3: Start Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🗄️ Database Access

### Option 1: Django Admin Panel (Recommended)

1. Ensure the backend server is running (`python manage.py runserver 8002`)
2. Open your browser and go to: `http://localhost:8002/admin`
3. Login with admin credentials:
   - Username: `admin`
   - Password: `admin123`
4. You'll see the following database tables:
   - **Crime Records** - Historical and predicted crime data
   - **User Profiles** - User roles and permissions
   - **Patrol Plans** - Police patrol schedules

### Option 2: Django Shell

```bash
cd backend/server
python manage.py shell
```

Example queries:

```python
# Import models
from crime_api.models import CrimeRecord, UserProfile, PatrolPlan
from django.contrib.auth.models import User

# View all users
User.objects.all()

# View crime records
CrimeRecord.objects.filter(district='Colombo')

# View user profiles
UserProfile.objects.all()

# View patrol plans
PatrolPlan.objects.filter(status='ACTIVE')
```

### Option 3: SQLite Browser

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the database file: `backend/server/db.sqlite3`
3. Browse tables: crime_api_crimerecord, crime_api_userprofile, crime_api_patrolplan

## 📁 Project Structure

```
safelanka/
├── backend/
│   ├── requirements.txt          # Python dependencies
│   ├── server/
│   │   ├── manage.py             # Django management script
│   │   ├── db.sqlite3            # SQLite database
│   │   ├── create_admin.py       # Admin user creation script
│   │   ├── crime_api/            # Main Django app
│   │   │   ├── models.py         # Database models
│   │   │   ├── views.py          # API endpoints
│   │   │   ├── urls.py           # URL routing
│   │   │   ├── admin.py          # Admin panel config
│   │   │   └── serializers.py    # Data serialization
│   │   └── server/
│   │       └── settings.py       # Django settings
│   ├── data/                     # Crime datasets
│   └── src/                      # Data processing scripts
└── frontend/
    └── safelanka-frontend/
        ├── package.json          # Node dependencies
        ├── vite.config.js        # Vite configuration
        └── src/
            ├── App.jsx           # Main app component
            ├── components/       # React components
            │   ├── Dashboard.jsx
            │   ├── Research.jsx
            │   ├── AdminPanel.jsx
            │   └── SriLankaHeatmap.jsx
            ├── context/          # React context providers
            └── services/         # API service layer
```

## 🔐 User Roles & Permissions

The system supports 5 user roles:

1. **ADMIN** - Full system access, user management
2. **SUPERVISOR** - Oversee operations, approve reports
3. **OFFICER** - Submit reports, view patrol assignments
4. **ANALYST** - View analytics, generate reports
5. **GUEST** - Limited read-only access

## 🛠️ Development Workflow

### Running Both Servers Simultaneously

**Terminal 1 - Backend:**

```bash
cd backend/server
python manage.py runserver 8002
```

**Terminal 2 - Frontend:**

```bash
cd frontend/safelanka-frontend
npm run dev
```

### Making Database Changes

1. Modify models in `backend/server/crime_api/models.py`
2. Create migrations:
   ```bash
   python manage.py makemigrations
   ```
3. Apply migrations:
   ```bash
   python manage.py migrate
   ```

## 🔧 Troubleshooting

### Backend Issues

**Problem: "Module not found" errors**

```bash
pip install -r backend/requirements.txt
```

**Problem: Database errors**

```bash
cd backend/server
python manage.py migrate
```

**Problem: Admin login fails**

```bash
python create_admin.py
```

**Problem: Port 8002 already in use**

```bash
python manage.py runserver 8003  # Use different port
```

### Frontend Issues

**Problem: Dependencies not installed**

```bash
cd frontend/safelanka-frontend
npm install
```

**Problem: API connection errors**

- Ensure backend is running on port 8002
- Check `frontend/safelanka-frontend/src/services/crimeService.js` for correct API URL

**Problem: Port 5173 already in use**

```bash
npm run dev -- --port 5174  # Use different port
```

## 📊 API Endpoints

Key backend API endpoints:

- `GET /api/predict-risk/?district=Colombo&date=2026-02-17` - Predict crime risk
- `GET /api/predict-risk-year-detailed/?year=2027&crime_type=Total%20Crimes` - Annual predictions
- `GET /api/crime-data/` - Historical crime data
- `POST /api/login/` - User authentication
- `POST /api/register/` - User registration

## 🎨 Features

- **Interactive Crime Heatmap** - Visualize crime distribution across Sri Lanka
- **AI-Powered Forecasting** - Predict future crime trends using machine learning
- **Patrol Management** - Schedule and track police patrols
- **Analytics Dashboard** - Comprehensive crime statistics and insights
- **Role-Based Access** - Secure permissions system
- **Report Generation** - Export analytics as PDF

## 📝 Environment Variables

### Backend (Optional)

Create `backend/server/.env` for production:

```
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (Optional)

Create `frontend/safelanka-frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8002
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions:

- Check the troubleshooting section above
- Review Django admin at `http://localhost:8002/admin`
- Check browser console for frontend errors
- Check terminal output for backend errors

## 🔄 Quick Command Reference

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Setup database
cd backend/server
python manage.py migrate

# Create admin
python create_admin.py

# Run server
python manage.py runserver 8002

# Access admin panel
# http://localhost:8002/admin (admin/admin123)
```

### Frontend

```bash
# Install dependencies
cd frontend/safelanka-frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Access application
# http://localhost:5173
```

---

**Happy coding! 🚀**
