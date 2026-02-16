#!/usr/bin/env python3
"""
Interview Insights Web App

A Flask web application that allows users to upload interview notes
and receive AI-powered insights and recommendations using Claude.
"""

import os
import json
from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Anthropic client
client = Anthropic()

# Store conversation history per session
conversations = {}

SYSTEM_PROMPT = """You are an expert interview analyst. Your role is to:
1. Analyze interview notes provided by the user
2. Extract key themes and patterns
3. Identify strengths and areas for improvement
4. Provide actionable recommendations

Format your response with clear sections for:
- Key Themes
- Notable Insights
- Recommendations

Be concise, professional, and data-driven in your analysis."""

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and store the content."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Read file content
        content = file.read().decode('utf-8')
        
        # Get or create conversation ID
        session_id = request.form.get('session_id', 'default')
        if session_id not in conversations:
            conversations[session_id] = []
        
        # Add to conversation history
        conversations[session_id].append({
            'role': 'user',
            'content': f"Interview Notes from uploaded file:\n\n{content}"
        })
        
        # Get confirmation from Claude
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=256,
            system="You are a helpful assistant confirming receipt of interview notes. Keep your response brief and encouraging.",
            messages=conversations[session_id]
        )
        
        confirmation = response.content[0].text
        conversations[session_id].append({
            'role': 'assistant',
            'content': confirmation
        })
        
        return jsonify({
            'success': True,
            'message': confirmation,
            'session_id': session_id
        }), 200
    
    except UnicodeDecodeError:
        return jsonify({'error': 'File must be a text file (UTF-8)'}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze the interview notes in the conversation."""
    data = request.json
    session_id = data.get('session_id', 'default')
    
    if session_id not in conversations or not conversations[session_id]:
        return jsonify({'error': 'No interview notes to analyze'}), 400
    
    try:
        # Add analysis request
        conversations[session_id].append({
            'role': 'user',
            'content': 'Please analyze these interview notes and provide insights and recommendations.'
        })
        
        # Get analysis from Claude
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=conversations[session_id]
        )
        
        analysis = response.content[0].text
        conversations[session_id].append({
            'role': 'assistant',
            'content': analysis
        })
        
        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200
    
    except Exception as e:
        # Remove failed request from history
        conversations[session_id].pop()
        return jsonify({'error': f'Analysis error: {str(e)}'}), 500

@app.route('/clear', methods=['POST'])
def clear_conversation():
    """Clear the conversation history."""
    data = request.json
    session_id = data.get('session_id', 'default')
    
    if session_id in conversations:
        conversations[session_id] = []
    
    return jsonify({'success': True}), 200

@app.route('/api/system-check', methods=['GET'])
def system_check():
    """Check if API key is configured."""
    api_key_configured = bool(os.getenv('ANTHROPIC_API_KEY'))
    return jsonify({
        'api_key_configured': api_key_configured,
        'message': 'API key is configured' if api_key_configured else 'Please configure ANTHROPIC_API_KEY in .env'
    })

if __name__ == '__main__':
    print("Hello World")
    print("\n=== Interview Insights Web App ===")
    print("Starting Flask server...")
    print("Visit http://localhost:5000 in your browser\n")
    app.run(debug=True)
