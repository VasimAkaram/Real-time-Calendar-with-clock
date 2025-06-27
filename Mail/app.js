// Utility: sanitize and split subject lines
function getSubjectLines() {
  const raw = document.getElementById('subjectLines').value;
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10);
}

// Count occurrences of any word from list in the subject line
function countMatches(line, wordList) {
  let count = 0;
  const lowerLine = line.toLowerCase();
  wordList.forEach(word => {
    // Whole word or phrase match (case-insensitive)
    const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerLine)) count++;
  });
  return count;
}

// Analyze a single subject line
function analyzeLine(line) {
  const length = line.length;
  const spamScore = countMatches(line, window.spamWords);
  const emotionScore = countMatches(line, window.emotionWords);
  // Verdict logic: prefer 30-60 chars, 0 spam, 1+ emotion
  let verdict = '';
  if (spamScore > 0) verdict = 'Spammy';
  else if (length < 30) verdict = 'Too Short';
  else if (length > 60) verdict = 'Too Long';
  else if (emotionScore === 0) verdict = 'Add Emotion';
  else verdict = 'Great!';
  // Score for best line: higher is better
  const score = (verdict === 'Great!' ? 100 : 0) + emotionScore * 5 - spamScore * 10 - Math.abs(45 - length);
  return { line, length, spamScore, emotionScore, verdict, score };
}

// Render results table
function renderResults(results) {
  const tbody = document.querySelector('#resultsTable tbody');
  tbody.innerHTML = '';
  if (results.length === 0) return;
  // Find best line (highest score)
  let bestIdx = 0;
  results.forEach((r, i) => { if (r.score > results[bestIdx].score) bestIdx = i; });
  results.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === bestIdx && r.verdict === 'Great!') tr.classList.add('best');
    tr.innerHTML = `
      <td>${r.line.replace(/</g, '&lt;')}</td>
      <td>${r.length}</td>
      <td class="spam">${r.spamScore}</td>
      <td class="emotion">${r.emotionScore}</td>
      <td>${r.verdict}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('resultsSection').style.display = '';
}

// Export results as CSV
function exportCSV(results) {
  const header = ['Subject Line','Length','Spam Score','Emotion Score','Verdict'];
  const rows = results.map(r => [r.line, r.length, r.spamScore, r.emotionScore, r.verdict]);
  const csv = [header, ...rows].map(row => row.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subjectlinepro_results.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event handlers
function handleAnalyze() {
  const lines = getSubjectLines();
  if (lines.length === 0) return;
  const results = lines.map(analyzeLine);
  renderResults(results);
  // Store for export
  window._lastResults = results;
}

function handleClear() {
  document.getElementById('subjectLines').value = '';
  document.getElementById('resultsSection').style.display = 'none';
}

function handleExport() {
  if (window._lastResults) exportCSV(window._lastResults);
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('slp_dark', document.body.classList.contains('dark') ? '1' : '0');
}
function loadDarkMode() {
  if (localStorage.getItem('slp_dark') === '1') document.body.classList.add('dark');
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  loadDarkMode();
  document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
  document.getElementById('clearBtn').addEventListener('click', handleClear);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
}); 