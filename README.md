# 🚌 Bus Tracking System - Complete Setup Guide

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** (v8.0 or higher)
- **Firebase Account**
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd bus-tracking-system
```

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bus_tracking

JWT_SECRET=your_super_secret_jwt_key_min_32_chars

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Step 3: Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**
4. Go to **Project Settings > Service Accounts**
5. Click **Generate New Private Key**
6. Save the JSON file as `backend/src/config/serviceAccountKey.json`

### Step 4: Setup Database

Create MySQL database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE bus_tracking;
exit;
```

Run migrations:

```bash
npm run migrate
```

Run seeds (optional - sample data):

```bash
npm run seed
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Server should be running at `http://localhost:3000`

Test health endpoint:

```bash
curl http://localhost:3000/health
```

---

## 📱 Mobile App Setup

### Step 1: Install Dependencies

```bash
cd mobile-app
npm install
`