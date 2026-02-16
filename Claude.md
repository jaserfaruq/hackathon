# Claude Integration

This document describes how Claude AI is integrated into the Interview Insights App.

## Overview

The app uses the Anthropic Claude API to analyze interview notes and provide intelligent insights and recommendations.

## API Usage

### Model
- **Model:** claude-3-5-sonnet-20241022
- **API:** Anthropic Anthropic Python Client

### Implementation Details

1. **Interview Confirmation:** When you submit interview notes, Claude confirms receipt
2. **Analysis Request:** When you type `analyze`, Claude processes all submitted notes and provides:
   - Key Themes: Main patterns identified
   - Notable Insights: Important findings
   - Recommendations: Actionable next steps

### System Prompts

The app uses specialized system prompts:
- **Analysis Prompt:** Focuses on extracting themes, patterns, strengths, and providing recommendations
- **Confirmation Prompt:** Simple acknowledgment of received notes

## Configuration

Set your API key in the `.env` file:
```
ANTHROPIC_API_KEY=your_key_here
```

## Error Handling

The app gracefully handles API errors and maintains conversation history for retry capability.

## Future Enhancements

- Export analysis to PDF
- Batch processing of multiple interviews
- Custom analysis templates
- Historical data trending

