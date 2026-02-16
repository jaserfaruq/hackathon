# Hackathon App

An application that analyzes interview notes and provides insights and recommendations.

## Features

- Accepts various interview notes as input
- Uses Claude AI to analyze patterns and themes
- Provides actionable insights and recommendations
- Interactive conversation-based interface

## Requirements

See [Requirements.md](Requirements.md) for detailed requirements.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API key:**
   - Copy `.env.example` to `.env`
   - Add your Anthropic API key to `.env`
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Run the app:**
   ```bash
   python app.py
   ```

## Usage

1. Start the app - it will display "Hello World"
2. Enter your interview notes (can span multiple lines)
3. Type `analyze` to get AI-powered insights and recommendations
4. Type `clear` to start fresh
5. Type `exit` to quit

## Documentation

- [Claude.md](Claude.md) - Claude integration documentation
