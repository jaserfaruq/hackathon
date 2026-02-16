# Claude Integration

## Overview

This app uses the Anthropic Claude API (claude-sonnet-4-20250514) to analyze interview notes and generate structured reports.

## How It Works

1. User uploads files (.txt, .md, .pdf, .docx) or types notes manually
2. The backend extracts text from all uploaded files
3. All interview notes are combined into a single prompt sent to Claude
4. Claude analyzes the notes and returns a report with **Key Findings** and **Recommendations**

## System Prompt

Claude is configured as an expert interview analyst with instructions to:
- Analyze all interview notes holistically
- Identify themes, patterns, and commonalities
- Produce a report with exactly two sections: Key Findings and Recommendations
- Be specific, professional, and data-driven

## Configuration

Set `ANTHROPIC_API_KEY` in a `.env` file or as an environment variable.
