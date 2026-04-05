# 🚀 Ad Agency Platform - Full Stack Developer Assessment

## 📋 Project Overview

A comprehensive advertising agency platform featuring campaign management, AI-powered creative brief generation, real-time notifications, and analytics dashboard.

### ✨ Features Implemented

#### Frontend (React + Tailwind)
- ✅ **Campaign Dashboard** - Interactive dashboard with KPI cards, charts, and tables
- ✅ **Sidebar Navigation** - Clients, Campaigns, Analytics, Settings
- ✅ **Date Range Picker** - Preset ranges (7d, 30d, 90d) and custom selection
- ✅ **Sortable/Filterable Table** - Sort by any column, filter by status, search
- ✅ **Dark Mode** - Theme persistence in localStorage
- ✅ **Responsive Design** - Works on 1440px, 1024px, 768px breakpoints
- ✅ **AI Creative Brief Builder** - 4-step form with AI integration
- ✅ **PDF Export** - Download briefs as PDF documents
- ✅ **Real-time Notifications** - WebSocket alerts with bell icon and dropdown

#### Backend (Node.js + Express + PostgreSQL)
- ✅ **RESTful API** - Full CRUD operations for campaigns
- ✅ **JWT Authentication** - Secure login and protected routes
- ✅ **Rate Limiting** - 100 requests per minute per IP
- ✅ **Input Validation** - Comprehensive validation with error messages
- ✅ **Soft Delete** - Campaigns archived instead of permanently deleted
- ✅ **Filter/Sort/Pagination** - Advanced query parameters
- ✅ **WebSocket Server** - Real-time notifications with Socket.io
- ✅ **Alert Rule Engine** - Automatic alerts for low CTR, budget exceeded, etc.

#### AI Microservice (Node.js + Groq)
- ✅ **Content Generation** - Ad copy, social captions, hashtags
- ✅ **SSE Streaming** - Real-time streaming responses
- ✅ **Docker Ready** - Dockerfile and docker-compose included
- ✅ **Request Logging** - Unique request IDs for tracking
- ✅ **Health Checks** - Service status monitoring

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Tailwind CSS, Vite, Recharts, Socket.io-client |
| Backend | Node.js, Express, PostgreSQL, JWT, Socket.io |
| AI Service | Node.js, Express, Groq API, SSE, Docker |
| Tools | Git, Postman, Cursor AI, npm |

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Docker Desktop (optional, for AI service)
- Git

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/ad-agency-platform.git
cd ad-agency-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install AI service dependencies
cd ../ai-service
npm install

# Return to root
cd ..