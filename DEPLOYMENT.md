# Deployment Guide

This guide covers deploying SafeLanka to production environments.

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] Change default admin credentials
- [ ] Set up environment variables
- [ ] Configure production database (PostgreSQL/MySQL)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set DEBUG=False in Django settings
- [ ] Configure static file serving
- [ ] Set up monitoring and logging
- [ ] Create database backups
- [ ] Test all API endpoints
- [ ] Review security settings

## 🔐 Security Configuration

### 1. Update Django Settings

Edit `backend/server/server/settings.py`:

```python
import os
from pathlib import Path

# Security Settings
DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')  # Use environment variable
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# HTTPS Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 2. Environment Variables

Create `.env` file (never commit this):

```env
# Django
DJANGO_SECRET_KEY=your-very-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL example)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=safelanka_db
DB_USER=safelanka_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password-here
```

## 🗄️ Production Database Setup

### Option 1: PostgreSQL (Recommended)

#### Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database

```bash
sudo -u postgres psql

CREATE DATABASE safelanka_db;
CREATE USER safelanka_user WITH PASSWORD 'your-secure-password';
ALTER ROLE safelanka_user SET client_encoding TO 'utf8';
ALTER ROLE safelanka_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE safelanka_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE safelanka_db TO safelanka_user;
\q
```

#### Update Django Settings

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

#### Install psycopg2

```bash
pip install psycopg2-binary
```

### Option 2: MySQL

#### Create Database

```sql
CREATE DATABASE safelanka_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'safelanka_user'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON safelanka_db.* TO 'safelanka_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Update Django Settings

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'safelanka_db',
        'USER': 'safelanka_user',
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

#### Install mysqlclient

```bash
pip install mysqlclient
```

## 🚀 Deployment Options

## Option 1: Traditional VPS/Server Deployment

### Backend Deployment (Django)

#### 1. Install Dependencies

```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx
```

#### 2. Setup Application

```bash
cd /var/www/safelanka
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

#### 3. Run Migrations

```bash
cd backend/server
python manage.py migrate
python manage.py collectstatic
python create_admin.py
```

#### 4. Configure Gunicorn

Create `/etc/systemd/system/safelanka.service`:

```ini
[Unit]
Description=SafeLanka Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/safelanka/backend/server
Environment="PATH=/var/www/safelanka/venv/bin"
EnvironmentFile=/var/www/safelanka/.env
ExecStart=/var/www/safelanka/venv/bin/gunicorn --workers 3 --bind unix:/var/www/safelanka/safelanka.sock server.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### 5. Start Gunicorn

```bash
sudo systemctl start safelanka
sudo systemctl enable safelanka
```

#### 6. Configure Nginx

Create `/etc/nginx/sites-available/safelanka`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        root /var/www/safelanka/backend/server;
    }

    location /media/ {
        root /var/www/safelanka/backend/server;
    }

    location /api/ {
        proxy_pass http://unix:/var/www/safelanka/safelanka.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://unix:/var/www/safelanka/safelanka.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/safelanka/frontend/safelanka-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/safelanka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Frontend Deployment

#### 1. Build for Production

```bash
cd frontend/safelanka-frontend
npm install
npm run build
```

#### 2. Deploy Build Files

The `dist/` folder will be served by Nginx as configured above.

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Option 2: Docker Deployment

### Create Dockerfile (Backend)

`backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./server/

WORKDIR /app/server

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "server.wsgi:application"]
```

### Create Dockerfile (Frontend)

`frontend/safelanka-frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

`docker-compose.yml`:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: safelanka_db
      POSTGRES_USER: safelanka_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  backend:
    build: ./backend
    command: gunicorn server.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend/server:/app/server
      - static_volume:/app/server/staticfiles
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db

  frontend:
    build: ./frontend/safelanka-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  static_volume:
```

### Deploy with Docker

```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python create_admin.py
```

## Option 3: Cloud Platform Deployment

### Heroku

#### 1. Create Procfile

```
web: gunicorn server.wsgi --log-file -
```

#### 2. Create runtime.txt

```
python-3.11.0
```

#### 3. Deploy

```bash
heroku login
heroku create safelanka
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run python manage.py migrate
```

### AWS Elastic Beanstalk

```bash
eb init -p python-3.11 safelanka
eb create safelanka-env
eb deploy
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

## 🔄 Continuous Deployment

### GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy SafeLanka

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 18

      - name: Deploy Backend
        run: |
          ssh user@yourserver.com 'cd /var/www/safelanka && git pull && systemctl restart safelanka'

      - name: Deploy Frontend
        run: |
          cd frontend/safelanka-frontend
          npm install
          npm run build
          scp -r dist/* user@yourserver.com:/var/www/safelanka/frontend/dist/
```

## 📊 Monitoring & Logging

### Application Monitoring

Install Sentry:

```bash
pip install sentry-sdk
```

Add to `settings.py`:

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Server Monitoring

- **Uptime**: Use services like UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: Papertrail, Loggly

## 🔧 Maintenance

### Database Backups

```bash
# PostgreSQL
pg_dump -U safelanka_user safelanka_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U safelanka_user safelanka_db < backup_20260216.sql
```

### Log Rotation

Create `/etc/logrotate.d/safelanka`:

```
/var/log/safelanka/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

### Updates

```bash
cd /var/www/safelanka
git pull
source venv/bin/activate
pip install -r backend/requirements.txt
python backend/server/manage.py migrate
python backend/server/manage.py collectstatic --noinput
sudo systemctl restart safelanka
```

## 🐛 Troubleshooting Production Issues

### Check Application Logs

```bash
sudo journalctl -u safelanka -f
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
sudo systemctl restart safelanka
sudo systemctl restart nginx
```

### Check Service Status

```bash
sudo systemctl status safelanka
sudo systemctl status nginx
```

---

For development setup, see [README.md](README.md).
For database management, see [DATABASE.md](DATABASE.md).
