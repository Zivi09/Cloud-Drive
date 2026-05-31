# Cloud Drive

A full-stack web application clone of Google Drive, allowing users to register securely, create nested folders of infinite depth, upload files, and manage their cloud storage securely.

## Features

- **Authentication System:** Secure JWT-based signup, login, and logout functionality.
- **Nested Folders:** Create folders inside of folders recursively, just like a real file system.
- **File Management:** Upload images (with names) into specific folders.
- **Storage Calculation:** Folders automatically calculate and display their total size (including all deeply nested child files).
- **Organization:** Move files between folders.
- **Trash & Starred:** Star important files and folders, and securely move items to the trash before permanently deleting them.
- **Privacy:** Every user operates in a complete silo; you can only see the folders and images you uploaded.
- **MCP Integration:** An optional Model Context Protocol (MCP) server allows AI assistants (like Claude Desktop) to connect and manage your Drive via natural language.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, bcryptjs
- **File Uploads:** Multer (Local storage)

## Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB cluster (Atlas) or local MongoDB instance

### 1. Clone & Setup Backend
Navigate to the `backend` folder:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Run the backend server:
```bash
npm run dev
```

### 2. Setup Frontend
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

## Deployment Guide

Because the frontend and backend are housed in a single monorepo, they should be deployed as two separate services. 

### Backend Deployment (e.g., Render, Railway, Heroku)
1. Create a new Web Service and link your GitHub repository.
2. Set the Root Directory to `backend` (if supported by your host) or specify the install/start commands specifically for the backend folder.
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
3. Add the Environment Variables (`MONGO_URI` and `JWT_SECRET`).
*Note on File Storage:* Since we use Multer to save files locally to an `/uploads` folder, utilizing free-tier ephemeral file systems (like Render's free tier) means your uploaded files will be wiped whenever the server spins down or redeploys. For a true production environment, consider swapping the Multer local storage engine for AWS S3 or Cloudinary.

### Frontend Deployment (e.g., Vercel, Netlify)
1. Import your GitHub repository to Vercel/Netlify.
2. Set the Root Directory to `frontend`.
3. Set the Build Command to `npm run build`.
4. Set the Output Directory to `dist`.
5. *Important:* Make sure to update the `axios` base URLs in your frontend code (or add a `.env.production` file for Vite) so they point to your newly deployed backend URL instead of `http://localhost:5000`.

## Claude Desktop / MCP Server Integration
This project comes out of the box with an MCP server!
1. Open your Claude Desktop config file.
2. Add the following to your `mcpServers` object:
```json
{
  "dobby-ads": {
    "command": "node",
    "args": ["mcp-server.js"],
    "cwd": "/absolute/path/to/your/backend",
    "env": {
      "MONGO_URI": "your_mongodb_connection_string"
    }
  }
}
```
3. Restart Claude Desktop and you can now ask Claude to create folders and manage your drive!
