// Session ID for conversation tracking
const sessionId = 'session_' + Date.now();
let hasNotes = false;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadButton = document.querySelector('.upload-button');
const uploadStatus = document.getElementById('uploadStatus');
const conversationDisplay = document.getElementById('conversationDisplay');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const analysisSection = document.getElementById('analysisSection');
const analysisDisplay = document.getElementById('analysisDisplay');
const apiWarning = document.getElementById('api-warning');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkApiConfiguration();
    setupEventListeners();
});

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileUpload);
    uploadButton.addEventListener('click', () => fileInput.click());
    analyzeBtn.addEventListener('click', analyzeNotes);
    clearBtn.addEventListener('click', clearConversation);

    // Drag and drop
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.backgroundColor = '#e8eaff';
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.backgroundColor = '#f8f9ff';
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.backgroundColor = '#f8f9ff';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    });
}

function checkApiConfiguration() {
    fetch('/api/system-check')
        .then(response => response.json())
        .then(data => {
            if (!data.api_key_configured) {
                apiWarning.style.display = 'block';
                analyzeBtn.disabled = true;
            }
        })
        .catch(error => console.error('Error checking API:', error));
}

function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        showStatus('Please upload a text or markdown file', 'error');
        return;
    }

    // Validate file size (limit to 5MB for text)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('File is too large (max 5MB)', 'error');
        return;
    }

    showStatus('Uploading...', 'loading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            hasNotes = true;
            analyzeBtn.disabled = false;
            showStatus(`✓ File uploaded: ${file.name}`, 'success');
            addMessageToConversation('user', `Uploaded file: ${file.name}`);
            addMessageToConversation('assistant', data.message);
            fileInput.value = ''; // Clear input
        })
        .catch(error => {
            showStatus('Error uploading file: ' + (error.error || error.message), 'error');
            console.error('Upload error:', error);
        });
}

function analyzeNotes() {
    if (!hasNotes) {
        showStatus('No interview notes to analyze', 'error');
        return;
    }

    analyzeBtn.disabled = true;
    showStatus('Analyzing...', 'loading');

    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            showStatus('Analysis complete!', 'success');
            displayAnalysis(data.analysis);
            analyzeBtn.disabled = false;
        })
        .catch(error => {
            showStatus('Error during analysis: ' + (error.error || error.message), 'error');
            console.error('Analysis error:', error);
            analyzeBtn.disabled = false;
        });
}

function displayAnalysis(analysis) {
    analysisSection.style.display = 'block';
    analysisDisplay.innerHTML = markdownToHtml(analysis);
    analysisSection.scrollIntoView({ behavior: 'smooth' });
}

function addMessageToConversation(role, message) {
    // Remove placeholder if it exists
    const placeholder = conversationDisplay.querySelector('.placeholder-text');
    if (placeholder) {
        placeholder.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div class="message-label">${role === 'user' ? '👤 You' : '🤖 Assistant'}</div>
        <div class="message-text">${escapeHtml(message)}</div>
    `;
    conversationDisplay.appendChild(messageDiv);
    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function clearConversation() {
    if (!hasNotes || confirm('Clear all conversation? This cannot be undone.')) {
        fetch('/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
        })
            .then(response => response.json())
            .then(() => {
                conversationDisplay.innerHTML = '<div class="placeholder-text">Upload interview notes to get started...</div>';
                analysisSection.style.display = 'none';
                analyzeBtn.disabled = true;
                hasNotes = false;
                showStatus('Conversation cleared', 'success');
            })
            .catch(error => {
                showStatus('Error clearing conversation', 'error');
                console.error('Clear error:', error);
            });
    }
}

function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function markdownToHtml(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*?)$/gm, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Lists
    html = html.replace(/<p>- (.*?)<\/p>/g, '<ul><li>$1</li></ul>');

    // Clean up multiple ul tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return html;
}
