#!/usr/bin/env python3
"""
Interview Insights Web App

A Flask web application that accepts up to 20 sets of interview notes
(via file upload or manual text entry) and generates a report with
Key Findings and Recommendations using the Claude LLM.
"""

import os
import io
from flask import Flask, render_template, request, jsonify, session
from anthropic import Anthropic
from werkzeug.utils import secure_filename

# Conditionally import file parsers
try:
    from docx import Document as DocxDocument
    DOCX_SUPPORTED = True
except ImportError:
    DOCX_SUPPORTED = False

try:
    from PyPDF2 import PdfReader
    PDF_SUPPORTED = True
except ImportError:
    PDF_SUPPORTED = False

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max total

ALLOWED_EXTENSIONS = {'txt', 'md', 'pdf', 'doc', 'docx'}
MAX_UPLOADS = 20

client = Anthropic()

SYSTEM_PROMPT = """You are an expert interview analyst. The user will provide you with interview notes (up to 20 sets). Your job is to analyze ALL interview notes holistically and produce a structured report.

Your report MUST have exactly these two sections with these exact headings:

## Key Findings
Analyze all the interview notes and identify the most important themes, patterns, commonalities, and notable observations across all interviews. Be specific and reference patterns you see. Use bullet points for clarity.

## Recommendations
Based on your key findings, provide actionable, specific recommendations. Each recommendation should be clearly tied to the findings above. Use bullet points for clarity.

Be thorough, professional, and data-driven. Reference specific details from the interviews where relevant."""


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_file(file_storage):
    """Extract text content from an uploaded file."""
    filename = secure_filename(file_storage.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

    if ext in ('txt', 'md'):
        try:
            return file_storage.read().decode('utf-8')
        except UnicodeDecodeError:
            return file_storage.read().decode('latin-1')

    elif ext == 'pdf':
        if not PDF_SUPPORTED:
            return "[Error: PDF support not installed. Run: pip install PyPDF2]"
        try:
            reader = PdfReader(io.BytesIO(file_storage.read()))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip() if text.strip() else "[Error: Could not extract text from PDF]"
        except Exception as e:
            return f"[Error reading PDF: {str(e)}]"

    elif ext in ('doc', 'docx'):
        if not DOCX_SUPPORTED:
            return "[Error: Word document support not installed. Run: pip install python-docx]"
        try:
            doc = DocxDocument(io.BytesIO(file_storage.read()))
            text = "\n".join([para.text for para in doc.paragraphs])
            return text.strip() if text.strip() else "[Error: Could not extract text from document]"
        except Exception as e:
            return f"[Error reading Word document: {str(e)}]"

    return f"[Unsupported file format: {ext}]"


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and text submissions, then analyze with Claude."""
    notes = []

    # Process uploaded files
    files = request.files.getlist('files')
    for f in files:
        if f and f.filename and allowed_file(f.filename):
            text = extract_text_from_file(f)
            if text:
                notes.append({
                    'source': f.filename,
                    'content': text
                })

    # Process manual text entries
    manual_texts = request.form.getlist('manual_text')
    for i, text in enumerate(manual_texts):
        text = text.strip()
        if text:
            notes.append({
                'source': f'Manual Entry {i + 1}',
                'content': text
            })

    if not notes:
        return jsonify({'error': 'No interview notes provided. Please upload files or enter text.'}), 400

    if len(notes) > MAX_UPLOADS:
        return jsonify({'error': f'Maximum {MAX_UPLOADS} sets of notes allowed. You provided {len(notes)}.'}), 400

    # Build the prompt with all interview notes
    notes_text = ""
    for i, note in enumerate(notes, 1):
        notes_text += f"\n--- Interview Notes Set {i} (Source: {note['source']}) ---\n"
        notes_text += note['content']
        notes_text += "\n"

    user_message = f"""I have {len(notes)} set(s) of interview notes for you to analyze. Please read through all of them and provide a comprehensive report.

{notes_text}

Please analyze all of these interview notes and provide your report with Key Findings and Recommendations."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{
                'role': 'user',
                'content': user_message
            }]
        )

        analysis = response.content[0].text

        return jsonify({
            'success': True,
            'analysis': analysis,
            'notes_count': len(notes),
            'sources': [n['source'] for n in notes]
        }), 200

    except Exception as e:
        return jsonify({'error': f'Analysis error: {str(e)}'}), 500


if __name__ == '__main__':
    print("\n=== Interview Insights Web App ===")
    print(f"PDF support: {'Yes' if PDF_SUPPORTED else 'No (pip install PyPDF2)'}")
    print(f"Word support: {'Yes' if DOCX_SUPPORTED else 'No (pip install python-docx)'}")
    print("\nStarting server at http://localhost:5000\n")
    app.run(debug=True)
