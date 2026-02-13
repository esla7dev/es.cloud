# Business Search CRM

A modern web application for business search and customer relationship management with Arabic language support.

## Features

- **Business Search**: Find businesses using Google Places API with location-based filtering
- **CRM System**: Manage customer relationships, notes, and business interactions
- **Campaign Management**: Create and manage marketing campaigns
- **Analytics Dashboard**: Track business metrics and performance
- **Multi-language Support**: Arabic and English interface
- **Task Management**: Organize and track business-related tasks
- **Message Templates**: Pre-configured templates for business communications

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **APIs**: Google Places API for business data
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see Environment Setup below)
4. Run development server: `npm run dev`

## Environment Setup

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Deployment

The application can be deployed to any static hosting service. Build the project with:

```bash
npm run build
```
