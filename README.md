# Interview Insights

A web application that accepts up to 20 sets of interview notes and generates an AI-powered analysis report with Key Findings and Recommendations.

## Features

- Upload up to 20 interview note files (.txt, .md, .pdf, .docx)
- Manual text entry for pasting notes directly
- Mix of file uploads and manual entries
- Claude AI analysis with structured report output
- Clean, responsive web interface

## Setup

1. Install dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

2. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   ```

3. Run the app:
   ```bash
   python3 web_app.py
   ```

4. Open http://localhost:5000 in your browser.

## Usage

1. Upload interview notes via drag-and-drop, file picker, or paste text manually
2. Add up to 20 sets of notes
3. Click **Analyze Interview Notes**
4. View the report with Key Findings and Recommendations

## Documentation

- [Claude.md](Claude.md) - Claude API integration details
- [Requirements.md](Requirements.md) - Project requirements
