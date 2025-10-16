# 🍽️ MessApp Server

Express.js + MongoDB server with Google OAuth and JWT authentication for mess management.

---

## 🚀 Tech Stack

- **Node.js & Express.js** - Backend framework
- **MongoDB & Mongoose** - Database
- **Google OAuth 2.0** - Student authentication
- **JWT** - Admin authentication
- **Multer & CSV Parser** - File uploads

---

## 📊 Models

- **Student** - User profiles with special tokens
- **Admin** - Admin accounts with mess assignment
- **Menu** - Weekly menu management
- **UpdatedMenu** - Menu overrides
- **TokenSession** - Special dinner token sessions

---

## 🛠️ Complete Setup Guide

Follow these steps **before** you start coding or running the server:

### Step 1: Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (recommended)
3. Install it (this also installs npm)
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install MongoDB

**Option A: Local Installation**

1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Download MongoDB Community Server for your OS
3. Install MongoDB following the installer
4. **Windows:** MongoDB installs as a service automatically
5. **Mac (Homebrew):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```
6. **Linux:**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   sudo apt-get install -y mongodb-org
   ```

7. Start MongoDB:
   - **Windows:** MongoDB starts automatically, or run `net start MongoDB`
   - **Mac:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`

8. Verify MongoDB is running:
   ```bash
   mongosh
   # You should see MongoDB shell
   # Type 'exit' to quit
   ```

**Option B: MongoDB Atlas (Cloud - Easier)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Click **"Build a Database"**
4. Choose **FREE** tier (M0)
5. Select a cloud provider and region (choose nearest to you)
6. Click **"Create Cluster"** (takes 3-5 minutes)
7. **Create Database User:**
   - Go to **Database Access** (left sidebar)
   - Click **"Add New Database User"**
   - Choose **Password** authentication
   - Create username and password (save these!)
   - Set privileges to **"Read and write to any database"**
   - Click **"Add User"**
8. **Whitelist Your IP:**
   - Go to **Network Access** (left sidebar)
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (for development)
   - Click **"Confirm"**
9. **Get Connection String:**
   - Go to **Database** (left sidebar)
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add database name at the end: `mongodb+srv://username:password@cluster.mongodb.net/mess`

### Step 3: Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** or select existing project
3. Enter project name (e.g., "MessApp")
4. Disable Google Analytics (optional)
5. Click **"Create Project"**

### Step 4: Enable Google Authentication in Firebase

1. In Firebase Console, click **"Authentication"** (left sidebar)
2. Click **"Get Started"** if first time
3. Go to **"Sign-in method"** tab
4. Find **"Google"** in the provider list
5. Click on **"Google"**
6. Toggle **"Enable"** switch to ON
7. Select a **"Support email"** from dropdown
8. Click **"Save"**

### Step 5: Get Google Client ID

1. Still in the Google provider settings
2. Look for **"Web SDK configuration"** section
3. Expand it if collapsed
4. You'll see **"Web client ID"**
5. Copy this entire ID (format: `123456789-abc...xyz.apps.googleusercontent.com`)
6. **Save this** - you'll need it for `.env` file

### Step 6: Clone the Repository

```bash
git clone <your-repo-url>
cd MessApp-Server
```

### Step 7: Install Dependencies

```bash
npm install
```

This installs all required packages: express, mongoose, dotenv, cors, google-auth-library, jsonwebtoken, bcryptjs, multer, csv-parser

### Step 8: Create Environment File

1. In the project root, create a new file named `.env`
2. Add the following configuration:

```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/mess
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=my-super-secret-jwt-key-2024
```

3. **Replace the values:**
   - **MONGODB_URI:** 
     - Local: Keep `mongodb://localhost:27017/mess`
     - Atlas: Use the connection string from Step 2
   - **GOOGLE_CLIENT_ID:** Paste the Web client ID from Step 5
   - **JWT_SECRET:** Change to any random secure string (used for admin tokens)

**Example with MongoDB Atlas:**
```env
PORT=5002
MONGODB_URI=mongodb+srv://admin:mypass123@cluster0.abc123.mongodb.net/mess
GOOGLE_CLIENT_ID=123456789012-abcdefghijk.apps.googleusercontent.com
JWT_SECRET=my-super-secret-jwt-key-2024
```

### Step 9: Create Admin Account in Database

Since admins need to exist before they can log in, you need to create one:

1. Start MongoDB shell:
   ```bash
   mongosh
   # Or if using Atlas:
   mongosh "your-atlas-connection-string"
   ```

2. Switch to your database:
   ```bash
   use mess
   ```

3. Create an admin user:
   ```javascript
   db.admins.insertOne({
     username: "admin",
     password: "admin123",
     role: "admin",
     messName: "Mess A"
   })
   ```

4. Verify admin was created:
   ```bash
   db.admins.find()
   ```

5. Exit MongoDB shell:
   ```bash
   exit
   ```

### Step 10: Verify Everything is Ready

**Checklist:**
- ✅ Node.js installed
- ✅ MongoDB running (local) or Atlas cluster created
- ✅ Firebase project created
- ✅ Google Authentication enabled in Firebase
- ✅ Google Client ID copied
- ✅ Repository cloned
- ✅ Dependencies installed (`node_modules` folder exists)
- ✅ `.env` file created with all 4 variables
- ✅ Admin account created in database

---

## ▶️ Running the Server

Now you're ready to run the server:

```bash
node server.js
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

**Test the server:**
```bash
curl http://localhost:5000
# Should return a response
```

---

## 📡 API Routes

### Student Routes (`/api/student`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/check-init` | Check initialization | ❌ |
| POST | `/login` | Google OAuth login | ❌ |
| POST | `/upload-photo` | Upload mess card photo | ✅ |
| GET | `/details` | Get student details | ✅ |
| POST | `/sync-token` | Redeem special token | ✅ |
| GET | `/menu` | View today's menu | ✅ |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Admin login | ❌ |
| POST | `/upload-csv` | Upload students CSV | ✅ |
| DELETE | `/students/clear` | Clear students | ✅ |
| PUT | `/menu/upload-week-csv` | Upload weekly menu | ✅ |
| PUT | `/menu/update/:day` | Update day menu | ✅ |
| POST | `/special-dinner/start` | Start special tokens | ✅ |
| POST | `/special-dinner/end` | End special tokens | ✅ |
| GET | `/tokenSession` | Token session status | ✅ |

---

## 🔐 Authentication

**Students:** Google OAuth tokens from Firebase
```
Authorization: Bearer <google-id-token>
```

**Admins:** JWT tokens (10h expiry)
```bash
# Login to get JWT
curl -X POST http://localhost:5002/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 🐛 Common Issues

**"MongoDB connection failed"**
- Check if MongoDB is running: `mongosh`
- Verify MONGODB_URI in `.env` is correct
- For Atlas: Check username, password, and IP whitelist

**"Invalid Google token"**
- Ensure GOOGLE_CLIENT_ID matches your Firebase project
- Get fresh token from Firebase (tokens expire in 1 hour)

**"Cannot find module"**
- Run `npm install` again
- Delete `node_modules` and run `npm install`

**"Port 5002 already in use"**
- Change PORT in `.env` to 5001 or another port
- Or kill the process using port 5002
