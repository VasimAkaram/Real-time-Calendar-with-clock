// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const cleanBtn = document.getElementById('cleanBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const removeEmojis = document.getElementById('removeEmojis');
const removeSymbols = document.getElementById('removeSymbols');
const fixGrammar = document.getElementById('fixGrammar');
const inputStats = document.getElementById('inputStats');
const outputStats = document.getElementById('outputStats');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Utility functions
function removeLineBreaks(text) {
    return text.replace(/[\r\n]+/g, ' ');
}

function removeExtraSpaces(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function removeEmojisFromText(text) {
    // Unicode emoji regex
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

function removeSpecialSymbols(text) {
    // Remove common special symbols except basic punctuation
    return text.replace(/[\#\*\_\~\`\|\^\[\]\{\}<>\$%&@+=\\]/g, '');
}

function cleanText(text, options = { emojis: true, symbols: true }) {
    // Replace multiple line breaks with a single line break
    let cleaned = text.replace(/[\r\n]{2,}/g, '\n');
    // Trim spaces at start/end of each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    // Remove extra spaces between words
    cleaned = cleaned.replace(/ +/g, ' ');
    if (options.emojis) cleaned = removeEmojisFromText(cleaned);
    if (options.symbols) cleaned = removeSpecialSymbols(cleaned);
    return cleaned;
}

function updateStats(element, statsElement) {
    const text = element.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split(/\r?\n/).length;
    statsElement.textContent = `Characters: ${chars} | Words: ${words} | Lines: ${lines}`;
}

// Event Listeners
inputText.addEventListener('input', () => {
    updateStats(inputText, inputStats);
});

outputText.addEventListener('input', () => {
    updateStats(outputText, outputStats);
});

cleanBtn.addEventListener('click', () => {
    const options = {
        emojis: removeEmojis.checked,
        symbols: removeSymbols.checked
    };
    let text = inputText.value;
    let cleaned = cleanText(text, options);
    outputText.value = cleaned;
    updateStats(outputText, outputStats);
    copyBtn.disabled = !cleaned;
    downloadBtn.disabled = !cleaned;
    downloadPdfBtn.disabled = !cleaned;
    saveToHistory(cleaned);
});

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    updateStats(inputText, inputStats);
    updateStats(outputText, outputStats);
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    downloadPdfBtn.disabled = true;
});

// Copy to clipboard
copyBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    navigator.clipboard.writeText(outputText.value)
        .then(() => showToast('Copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy!', 'error'));
});

// Download as .txt
function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

downloadBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    downloadTextFile('cleaned-text.txt', outputText.value);
    showToast('Downloaded as .txt!', 'success');
});

// Download as PDF (using jsPDF)
downloadPdfBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        showToast('PDF library not loaded!', 'error');
        return;
    }
    const doc = new window.jspdf.jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const marginLeft = 10;
    const marginTop = 20;
    const lineHeight = 7;
    const maxLineWidth = 180;
    let y = marginTop;
    const lines = outputText.value.split('\n');
    lines.forEach(line => {
        const splitLines = doc.splitTextToSize(line, maxLineWidth);
        splitLines.forEach(splitLine => {
            if (y > 280) { // New page if needed
                doc.addPage();
                y = marginTop;
            }
            doc.text(splitLine, marginLeft, y);
            y += lineHeight;
        });
    });
    doc.save('cleaned-text.pdf');
    showToast('Downloaded as PDF!', 'success');
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(theme) {
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// Toast notification
const toast = document.getElementById('toast');
const toastIcon = toast.querySelector('.toast-icon');
const toastMessage = toast.querySelector('.toast-message');

function showToast(message, type = 'info') {
    toast.className = 'toast show ' + type;
    toastMessage.textContent = message;
    toastIcon.className = 'toast-icon';
    if (type === 'success') toastIcon.classList.add('fa', 'fa-check-circle');
    else if (type === 'error') toastIcon.classList.add('fa', 'fa-times-circle');
    else toastIcon.classList.add('fa', 'fa-info-circle');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// History management
function getHistory() {
    return JSON.parse(localStorage.getItem('cleanTextHistory') || '[]');
}

function saveToHistory(text) {
    if (!text.trim()) return;
    let history = getHistory();
    // Avoid duplicates
    if (history.some(item => item.text === text)) return;
    const item = {
        text,
        date: new Date().toISOString()
    };
    history.unshift(item);
    if (history.length > 10) history = history.slice(0, 10); // Keep last 10
    localStorage.setItem('cleanTextHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-item">No history yet.</div>';
        return;
    }
    history.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.title = 'Click to restore this cleaned text';
        div.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-title">Cleaned #${history.length - idx}</span>
                <span class="history-item-date">${new Date(item.date).toLocaleString()}</span>
            </div>
            <div class="history-item-preview">${item.text.length > 80 ? item.text.slice(0, 80) + '...' : item.text}</div>
        `;
        div.addEventListener('click', () => {
            outputText.value = item.text;
            updateStats(outputText, outputStats);
            copyBtn.disabled = !item.text;
            downloadBtn.disabled = !item.text;
            downloadPdfBtn.disabled = !item.text;
            showToast('Restored from history!', 'info');
        });
        historyList.appendChild(div);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('cleanTextHistory');
    renderHistory();
    showToast('History cleared!', 'success');
});

// Initial render
renderHistory();

// Initial stats
updateStats(inputText, inputStats);
updateStats(outputText, outputStats);
copyBtn.disabled = true;
downloadBtn.disabled = true;
downloadPdfBtn.disabled = true; 