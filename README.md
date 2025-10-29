# PariCare Agent System

A comprehensive healthcare management system with AI-powered monitoring, prescription processing, and real-time health alerts.

## Features

### 🤖 AI Health Monitoring
- Automated health parameter monitoring
- Real-time alerts for abnormal vital signs
- Smart agent system for patient and family monitoring

### 📋 Prescription Management
- OCR-powered prescription scanning and digitization
- AI-based medication extraction using Google Gemini
- Automatic medication scheduling and reminders

### 🚨 Health Alerts
- Real-time health status monitoring
- Instant alerts for critical health parameters
- Customizable alert thresholds
- Family member notification system

### 👨‍👩‍👧‍👦 Family Health Management
- Multi-user family accounts
- Centralized health monitoring for family members
- Shared access to health records and prescriptions

### 📱 User Interface
- Modern, responsive web interface
- Real-time updates and notifications
- Interactive dashboards and graphs
- Mobile-friendly design

## Tech Stack

### Frontend
- Next.js 13+ (React Framework)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB
- Google Cloud Vision API (OCR)
- Google Gemini AI
- WebSocket for real-time updates

## Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB instance
- Google Cloud Vision API credentials
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/uncodingthecode/NFC4_-Hackoholics-.git
cd NFC4_-Hackoholics-
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd ../backend
npm install
```

4. Set up environment variables

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend (.env):
```env
PORT=8000
MONGODB_URI=your_mongodb_uri
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

5. Start the development servers

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Features Usage

### Prescription Processing
1. Upload a prescription image through the interface
2. The system will automatically:
   - Extract text using OCR
   - Identify medications and dosages
   - Schedule reminders based on prescriptions

### Health Monitoring
1. Connect health monitoring devices
2. View real-time health parameters
3. Receive instant alerts for abnormal readings

### Family Management
1. Create a family account
2. Add family members
3. Monitor health parameters for all members
4. Receive notifications for family health alerts

## Project Structure

```
├── frontend/
│   ├── app/               # Next.js pages and routes
│   ├── components/        # Reusable UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── utils/            # Helper functions
│
├── backend/
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── ai-agents/        # AI monitoring agents
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Google Cloud Vision API](https://cloud.google.com/vision)
- [Google Gemini AI](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/gemini)