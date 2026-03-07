# AI Explorer Facilitation Portal - "The Hunt"

An interactive facilitation portal for a leadership workshop on AI use in education, themed around a retro 1980s adventure game. 

## Structure

- **frontend/**: A React (Vite) application styled with TailwindCSS.
- **backend/**: A Node.js + Socket.io server holding the live shared state of the workshop.

## Running the Application

This application requires both the backend API and the frontend client to be running concurrently.

### 1. Start the Backend API (Realtime Server)
```bash
cd backend
npm install
node server.js
```
The server runs on `http://localhost:3001`

### 2. Start the Frontend Application
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on your local IP or `http://localhost:5173`. 

## How to use

- **Facilitator Dashboard**: Go to `http://localhost:5173/facilitator`. From here, you can start the timer, control which phase the participants are currently on, and view live results. When finished with the session, click "Export Report" to download a JSON file of all data.
- **Participant Device**: Have participants navigate to `http://localhost:5173/` on their phones or laptops. They will be prompted to join a group with their peers.
