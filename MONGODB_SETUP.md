# MongoDB Atlas IP Whitelist Fix

## The Issue
Your MongoDB Atlas cluster is rejecting connections because your IP address isn't whitelisted. This is a security feature of MongoDB Atlas.

## Solution Options:

### Option 1: Whitelist Your IP Address (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in to your account
3. Navigate to your cluster
4. Click on "Network Access" in the left sidebar
5. Click "Add IP Address"
6. Either:
   - Click "Add Current IP Address" to whitelist your current IP
   - Or add "0.0.0.0/0" to allow access from anywhere (less secure)
7. Click "Confirm"
8. Wait a few minutes for the changes to take effect

### Option 2: Use Local MongoDB (Alternative)
If you prefer to use a local MongoDB instance:

1. Install MongoDB locally:
   ```bash
   # Download and install MongoDB Community Server from:
   # https://www.mongodb.com/try/download/community
   ```

2. Update your `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vape4you
   NEXTAUTH_SECRET=vape4you-super-secret-key-2024
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Start MongoDB service:
   ```bash
   # Windows (run as administrator)
   net start MongoDB
   ```

### Option 3: Create New Atlas Cluster
If you don't have admin access to the current cluster:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster
4. Set up database access (username/password)
5. Whitelist your IP (0.0.0.0/0 for testing)
6. Get your connection string
7. Update `.env.local` with your new connection string

## Current Connection String
```
mongodb+srv://sammyaa86_db_user:SGUs7jX99cBEvVhx@vape4you.rt2bwf4.mongodb.net/vape4you
```

This suggests you're using a cluster named "vape4you" - you'll need access to the MongoDB Atlas account that owns this cluster to whitelist your IP.

## Quick Test
After fixing the IP whitelist, test the connection:
```bash
npm run dev
# Then visit: http://localhost:3000/api/test
```

The database should connect successfully and you'll be able to register and login.