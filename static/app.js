// State
let uploadedFiles = [];
const MAX_NOTES = 20;

// DOM refs
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const fileListItems = document.getElementById('fileListItems');
const fileCount = document.getElementById('fileCount');
const textEntries = document.getElementById('textEntries');
const addEntryBtn = document.getElementById('addEntryBtn');
const totalCount = document.getElementById('totalCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const resultsMeta = document.getElementById('resultsMeta');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');

// -- Initialization --
document.addEventListener('DOMContentLoaded', () => {
    setupDropZone();
    setupFileInput();
    updateCounts();
});

// -- Drag & Drop --
function setupDropZone() {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

function setupFileInput() {
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
        fileInput.value = '';
    });
}

// -- File Handling --
function handleFiles(fileListObj) {
    const currentTotal = getTotalCount();
    const allowedExts = ['txt', 'md', 'pdf', 'doc', 'docx'];

    for (const file of fileListObj) {
        if (currentTotal + uploadedFiles.length >= MAX_NOTES) {
            showError(`Maximum ${MAX_NOTES} sets of notes allowed.`);
            break;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
            showError(`"${file.name}" is not a supported file type.`);
            continue;
        }

        uploadedFiles.push(file);
    }

    renderFileList();
    updateCounts();
}

function renderFileList() {
    if (uploadedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }

    fileList.style.display = 'block';
    fileCount.textContent = uploadedFiles.length;
    fileListItems.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = { txt: '📝', md: '📝', pdf: '📕', doc: '📘', docx: '📘' }[ext] || '📄';

        li.innerHTML = `
            <span class="file-name">${icon} ${escapeHtml(file.name)}</span>
            <button class="remove-file" onclick="removeFile(${index})" title="Remove">&times;</button>
        `;
        fileListItems.appendChild(li);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
    updateCounts();
}

// -- Text Entries --
function addTextEntry() {
    if (getTotalCount() >= MAX_NOTES) {
        showError(`Maximum ${MAX_NOTES} sets of notes allowed.`);
        return;
    }

    const entry = document.createElement('div');
    entry.className = 'text-entry';
    entry.innerHTML = `
        <div class="text-entry-header">
            <label>Interview Notes</label>
            <button class="remove-btn" onclick="removeTextEntry(this)" title="Remove">&times;</button>
        </div>
        <textarea placeholder="Paste or type interview notes here..." rows="6" oninput="updateCounts()"></textarea>
    `;
    textEntries.appendChild(entry);
    updateCounts();
    entry.querySelector('textarea').focus();
}

function removeTextEntry(btn) {
    const entries = textEntries.querySelectorAll('.text-entry');
    if (entries.length <= 1) {
        // Don't remove the last one, just clear it
        entries[0].querySelector('textarea').value = '';
        updateCounts();
        return;
    }
    btn.closest('.text-entry').remove();
    updateCounts();
}

// -- Counting --
function getManualTextCount() {
    const textareas = textEntries.querySelectorAll('textarea');
    let count = 0;
    textareas.forEach(ta => {
        if (ta.value.trim()) count++;
    });
    return count;
}

function getTotalCount() {
    return uploadedFiles.length + getManualTextCount();
}

function updateCounts() {
    const total = getTotalCount();
    totalCount.textContent = total;
    analyzeBtn.disabled = total === 0;

    // Hide add button if at limit
    if (total >= MAX_NOTES) {
        addEntryBtn.style.display = 'none';
    } else {
        addEntryBtn.style.display = 'inline-block';
    }
}

// Listen for typing in textareas
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
        updateCounts();
    }
});

// -- Analysis --
async function analyzeNotes() {
    const total = getTotalCount();
    if (total === 0) return;

    hideError();
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'block';
    analyzeBtn.disabled = true;

    const formData = new FormData();

    // Add files
    uploadedFiles.forEach(file => {
        formData.append('files', file);
    });

    // Add manual text entries
    const textareas = textEntries.querySelectorAll('textarea');
    textareas.forEach(ta => {
        const text = ta.value.trim();
        if (text) {
            formData.append('manual_text', text);
        }
    });

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        // Show results
        loadingSection.style.display = 'none';
        resultsSection.style.display = 'block';
        resultsMeta.textContent = `Analyzed ${data.notes_count} set(s) of notes: ${data.sources.join(', ')}`;
        resultsContent.innerHTML = markdownToHtml(data.analysis);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        loadingSection.style.display = 'none';
        showError(err.message);
    }

    analyzeBtn.disabled = false;
}

// -- Markdown Rendering --
function markdownToHtml(md) {
    let html = md;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Unordered lists: process line by line
    const lines = html.split('\n');
    let result = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const listMatch = line.match(/^[-*] (.+)/);

        if (listMatch) {
            if (!inList) {
                result.push('<ul>');
                inList = true;
            }
            result.push(`<li>${listMatch[1]}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }

            // Paragraphs (skip empty lines, skip tags)
            const trimmed = line.trim();
            if (trimmed === '') {
                result.push('');
            } else if (trimmed.startsWith('<')) {
                result.push(trimmed);
            } else {
                result.push(`<p>${trimmed}</p>`);
            }
        }
    }
    if (inList) result.push('</ul>');

    return result.join('\n');
}

// -- Utilities --
function showError(msg) {
    errorMessage.textContent = msg;
    errorSection.style.display = 'block';
    setTimeout(() => { errorSection.style.display = 'none'; }, 8000);
}

function hideError() {
    errorSection.style.display = 'none';
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
