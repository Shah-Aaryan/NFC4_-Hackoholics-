import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import userRouter from './routes/user.route.js';
import familyRouter from './routes/family.route.js';
import medicationRouter from './routes/medication.route.js';
import prescriptionRouter from './routes/prescription.route.js';
import vitalRouter from './routes/vital.route.js';
import emergencyRouter from './routes/emergency.route.js';
import aiAgentRouter from './routes/aiAgent.route.js';
import notificationRouter from './routes/notification.route.js';
import ocrRouter from './routes/ocr.route.js';
import agentRoutes from "./routes/agent.routes.js";
import geminiRouter from './routes/gemini.route.js';
import {chatRoute} from './routes/chat.js';
import profileRouter from './routes/profile.route.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nfc-4-hackoholics-sable.vercel.app'
  ],  // allow local dev and deployed frontend
  credentials: true,                // allow cookies and auth headers
};

const app = express();
app.use(cors(corsOptions));

app.use(cookieParser()); // For JWT cookies

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Static Files 
app.use('/audio', express.static(path.join(__dirname, 'tts_output')));
app.use('/prescriptions', express.static(path.join(__dirname, 'uploads/prescriptions')));

//  Public Routes
app.use('/api/v1/users', userRouter); 
app.use('/api/v1/ocr', ocrRouter); 


//Protected Routes 
app.use('/api/v1/families', familyRouter);
app.use('/api/v1/medications', medicationRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/vitals', vitalRouter);
app.use('/api/v1/emergency', emergencyRouter);

app.use('/api/v1/ai', aiAgentRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/gemini', geminiRouter);
app.use('/api/v1/profile', profileRouter);

app.use('/api/v1/chat', chatRoute);

// Error Handler Middleware (should be last)
app.use(errorHandler);

export default app;