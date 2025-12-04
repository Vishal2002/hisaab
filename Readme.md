# Hisaab ₹

A Hinglish Telegram bot to track your ghar ka khata (home expenses).

## What it does

Talk to the bot in Hinglish to track your daily expenses:

- **"Sabji - 450"** → Adds ₹450 to sabji
- **"Kitne paise bache?"** → Shows remaining money
- **"Is mahine ka total?"** → Shows monthly summary

## Quick Start

### 1. Setup

```bash
# Clone
git clone https://github.com/yourusername/hisaab.git
cd hisaab

# Install
npm install

# Setup database
docker-compose up -d db
npm run db:push

# Create .env file
cp .env.example .env
# Add your OPENAI_API_KEY and TELEGRAM_BOT_TOKEN
```

### 2. Run

```bash
# Development
npm run dev

# With Docker
docker-compose up -d
```

### 3. Deploy to Railway

```bash
# Push to GitHub
git push origin main

# Then on Railway:
# 1. New Project → Deploy from GitHub
# 2. Add PostgreSQL
# 3. Add environment variables
# 4. Done!
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=...
```

## Features

- 🗣️ **Hinglish support** - Talk naturally
- 💰 **Expense tracking** - Quick format: "Sabji - 450"
- 📊 **Monthly summaries** - Category-wise breakdown
- 🔍 **Smart insights** - Compare months, find patterns
- 🤖 **AI-powered** - Understands natural language

## Tech Stack

- TypeScript + Node.js
- OpenAI Agents SDK
- PostgreSQL + Prisma
- Telegram Bot API
- Docker

## Commands

```bash
npm run dev          # Start development
npm run db:push      # Update database
npm run db:studio    # View database
docker-compose up    # Run with Docker
```


---

Made with ❤️ by Vishal