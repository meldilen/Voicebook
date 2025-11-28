# VoiceBook

Voice Diary for Emotional State Tracking with Artificial Intelligence

## Project Overview

VoiceBook is a web application that enables users to maintain a voice diary for analyzing and tracking their emotional state. The system automatically processes audio recordings, detects emotional patterns, and provides detailed analytics.

## Key Features

### Core Functionality
- **Voice Recording** - Record and upload audio messages
- **Automatic Emotion Analysis** - AI model detects emotional states (joy, sadness, neutrality, etc.)
- **Text Summaries** - Automatic generation of text summaries from recordings
- **Insights and Analytics** - AI generates personalized recommendations and insights

### Analytics and Statistics
- Emotional dynamics visualization
- Statistics by emotion types
- Mood change timeline
- Personal recording analytics

### Achievement System
- Gamification mechanics for diary maintenance motivation
- Rewards for regularity and progress
- In-app currency system (Emocoins)

## Technical Architecture

### Frontend
- **React** with functional components and hooks
- **Redux Toolkit** for state management
- **RTK Query** for API interactions
- Responsive design with mobile support
- Audio recording via Web Audio API

### Backend
- **FastAPI** - modern Python framework
- **SQLAlchemy** - ORM for database operations
- **JWT Authentication** - secure authorization system
- **Pydantic** - data validation and schemas

### Database
- Relational structure with tables:
  - Users
  - Audio records
  - Sessions
  - Achievements
  - User-achievement relationships

### Machine Learning
- Separate ML service for audio processing
- Emotion analysis based on voice characteristics
- Text summary and insights generation
- REST API integration

## Installation and Setup

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd back
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables
Configure `.env` file with:
- Database configuration
- JWT secrets
- ML service settings

## Development

### Core Technologies
- **Frontend**: React 18, Redux Toolkit, CSS3
- **Backend**: FastAPI, Python 3.9+, SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Audio Processing**: Web Audio API, custom ML models

### Development Principles
- Component-based frontend architecture
- Service-oriented backend architecture
- Type safety via PropTypes/Pydantic
- Comprehensive error handling
- RESTful API design

## Future Enhancements

- Multi-language support
- Advanced emotion detection models
- Social features (sharing insights)
- Mobile applications
- Integration with health platforms
- Advanced analytics and reporting