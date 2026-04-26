// ========================================================
// STAR FIELD
// ========================================================
(function() {
  const c = document.getElementById('starfield');
  const ctx = c.getContext('2d');
  let stars = [];

  function resize() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, c.width, c.height);
    stars.forEach(s => {
      s.a += s.speed * 0.005;
      const alpha = (Math.sin(s.a) + 1) / 2 * 0.8 + 0.1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ========================================================
// FUZZY LOGIC ENGINE
// ========================================================

// Membership Functions
function trimf(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x <= b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

function trapmf(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

// ---- ANTECEDENT MFs ----
// SQM: 15.0 - 22.0 (stored as *10 for integer slider: 150-220)
const sqmMFs = {
  rendah:  x => trapmf(x, 149, 150, 160, 175),   // bright = polluted
  sedang:  x => trimf(x, 162, 175, 190),
  tinggi:  x => trapmf(x, 182, 196, 220, 221)    // dark = clean
};

// Distance: 0-100 km
const distMFs = {
  dekat:  x => trapmf(x, -1, 0, 10, 28),
  sedang: x => trimf(x, 15, 38, 60),
  jauh:   x => trapmf(x, 48, 68, 100, 101)
};

// Density: 0-1000 lux
const densMFs = {
  rendah: x => trapmf(x, -1, 0, 100, 320),
  sedang: x => trimf(x, 200, 440, 700),
  tinggi: x => trapmf(x, 580, 780, 1000, 1001)
};

// ---- CONSEQUENT MFs ----
// Pollution Level: 0-100
const outMFs = {
  sgtRendah: x => trapmf(x, 0, 0, 8, 22),
  rendah:    x => trimf(x, 10, 25, 42),
  sedang:    x => trimf(x, 30, 50, 70),
  tinggi:    x => trimf(x, 58, 73, 90),
  sgtTinggi: x => trapmf(x, 78, 90, 100, 100)
};

// ---- RULE BASE (12 Rules) ----
const RULES = [
  // --- SQM RENDAH (Langit Terang / Potensi Polusi Tinggi) ---
  { id: 1, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'rendah'}], con: 'tinggi', label: 'SQM Rendah ∧ Jarak Dekat ∧ Kepadatan Rendah → Tinggi' },
  { id: 2, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'sedang'}], con: 'sgtTinggi', label: 'SQM Rendah ∧ Jarak Dekat ∧ Kepadatan Sedang → Sgt Tinggi' },
  { id: 3, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'tinggi'}], con: 'sgtTinggi', label: 'SQM Rendah ∧ Jarak Dekat ∧ Kepadatan Tinggi → Sgt Tinggi' },
  
  { id: 4, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'rendah'}], con: 'sedang', label: 'SQM Rendah ∧ Jarak Sedang ∧ Kepadatan Rendah → Sedang' },
  { id: 5, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'sedang'}], con: 'tinggi', label: 'SQM Rendah ∧ Jarak Sedang ∧ Kepadatan Sedang → Tinggi' },
  { id: 6, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'tinggi'}], con: 'tinggi', label: 'SQM Rendah ∧ Jarak Sedang ∧ Kepadatan Tinggi → Tinggi' },
  
  { id: 7, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'rendah'}], con: 'rendah', label: 'SQM Rendah ∧ Jarak Jauh ∧ Kepadatan Rendah → Rendah' },
  { id: 8, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'sedang'}], con: 'sedang', label: 'SQM Rendah ∧ Jarak Jauh ∧ Kepadatan Sedang → Sedang' },
  { id: 9, ant: [{v:'sqm',mf:'rendah'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'tinggi'}], con: 'sedang', label: 'SQM Rendah ∧ Jarak Jauh ∧ Kepadatan Tinggi → Sedang' },

  // --- SQM SEDANG (Langit Menengah) ---
  { id: 10, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'rendah'}], con: 'sedang', label: 'SQM Sedang ∧ Jarak Dekat ∧ Kepadatan Rendah → Sedang' },
  { id: 11, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'sedang'}], con: 'tinggi', label: 'SQM Sedang ∧ Jarak Dekat ∧ Kepadatan Sedang → Tinggi' },
  { id: 12, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'tinggi'}], con: 'sgtTinggi', label: 'SQM Sedang ∧ Jarak Dekat ∧ Kepadatan Tinggi → Sgt Tinggi' },
  
  { id: 13, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'rendah'}], con: 'rendah', label: 'SQM Sedang ∧ Jarak Sedang ∧ Kepadatan Rendah → Rendah' },
  { id: 14, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'sedang'}], con: 'sedang', label: 'SQM Sedang ∧ Jarak Sedang ∧ Kepadatan Sedang → Sedang' },
  { id: 15, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'tinggi'}], con: 'tinggi', label: 'SQM Sedang ∧ Jarak Sedang ∧ Kepadatan Tinggi → Tinggi' },
  
  { id: 16, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'rendah'}], con: 'rendah', label: 'SQM Sedang ∧ Jarak Jauh ∧ Kepadatan Rendah → Rendah' },
  { id: 17, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'sedang'}], con: 'rendah', label: 'SQM Sedang ∧ Jarak Jauh ∧ Kepadatan Sedang → Rendah' },
  { id: 18, ant: [{v:'sqm',mf:'sedang'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'tinggi'}], con: 'sedang', label: 'SQM Sedang ∧ Jarak Jauh ∧ Kepadatan Tinggi → Sedang' },

  // --- SQM TINGGI (Langit Gelap / Potensi Polusi Rendah) ---
  { id: 19, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'rendah'}], con: 'sedang', label: 'SQM Tinggi ∧ Jarak Dekat ∧ Kepadatan Rendah → Sedang' },
  { id: 20, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'sedang'}], con: 'sedang', label: 'SQM Tinggi ∧ Jarak Dekat ∧ Kepadatan Sedang → Sedang' },
  { id: 21, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'dekat'}, {v:'dens',mf:'tinggi'}], con: 'tinggi', label: 'SQM Tinggi ∧ Jarak Dekat ∧ Kepadatan Tinggi → Tinggi' },
  
  { id: 22, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'rendah'}], con: 'rendah', label: 'SQM Tinggi ∧ Jarak Sedang ∧ Kepadatan Rendah → Rendah' },
  { id: 23, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'sedang'}], con: 'rendah', label: 'SQM Tinggi ∧ Jarak Sedang ∧ Kepadatan Sedang → Rendah' },
  { id: 24, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'sedang'}, {v:'dens',mf:'tinggi'}], con: 'sedang', label: 'SQM Tinggi ∧ Jarak Sedang ∧ Kepadatan Tinggi → Sedang' },
  
  { id: 25, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'rendah'}], con: 'sgtRendah', label: 'SQM Tinggi ∧ Jarak Jauh ∧ Kepadatan Rendah → Sgt Rendah' },
  { id: 26, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'sedang'}], con: 'rendah', label: 'SQM Tinggi ∧ Jarak Jauh ∧ Kepadatan Sedang → Rendah' },
  { id: 27, ant: [{v:'sqm',mf:'tinggi'}, {v:'dist',mf:'jauh'}, {v:'dens',mf:'tinggi'}], con: 'rendah', label: 'SQM Tinggi ∧ Jarak Jauh ∧ Kepadatan Tinggi → Rendah' }
];

// ---- Evaluate Rules ----
function evaluate(sqm, dist, dens) {
  const vals = { sqm, dist, dens };
  const mfFns = { sqm: sqmMFs, dist: distMFs, dens: densMFs };
  
  let ruleResults = [];

  RULES.forEach(rule => {
    const strengths = rule.ant.map(a => mfFns[a.v][a.mf](vals[a.v]));
    const strength = Math.min(...strengths); // AND = MIN
    ruleResults.push({ ...rule, strength });
  });

  return ruleResults;
}

// ---- Defuzzification: Centroid ----
function defuzzify(ruleResults) {
  const N = 500;
  let numerator = 0, denominator = 0;

  for (let i = 0; i <= N; i++) {
    const x = i / N * 100;
    // Aggregate: MAX of all activated consequents
    let aggVal = 0;
    ruleResults.forEach(r => {
      if (r.strength > 0.001) {
        const conVal = Math.min(r.strength, outMFs[r.con](x)); // MIN for clipping
        aggVal = Math.max(aggVal, conVal);
      }
    });
    numerator += x * aggVal;
    denominator += aggVal;
  }

  return denominator < 0.001 ? 50 : numerator / denominator;
}

function classifyPollution(val) {
  if (val < 20) return { label: 'SANGAT RENDAH', color: '#4ecdc4', bortle: 1 };
  if (val < 36) return { label: 'RENDAH',        color: '#6bcb77', bortle: 3 };
  if (val < 56) return { label: 'SEDANG',        color: '#ffd93d', bortle: 5 };
  if (val < 75) return { label: 'TINGGI',        color: '#ff9f43', bortle: 7 };
  return             { label: 'SANGAT TINGGI', color: '#ff6b6b', bortle: 9 };
}

// ========================================================
// DRAW FUNCTIONS
// ========================================================

// Draw MF canvas (input)
function drawMFCanvas(canvasId, mfs, colors, currentVal, minVal, maxVal) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth - 8;
  const H = canvas.height = 55;
  ctx.clearRect(0, 0, W, H);

  const padL = 4, padR = 4, padT = 4, padB = 14;
  const w = W - padL - padR;
  const h = H - padT - padB;

  // Grid lines
  ctx.strokeStyle = 'rgba(100,150,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + h - (i / 4) * h;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + w, y); ctx.stroke();
  }

  // Draw each MF
  const mfKeys = Object.keys(mfs);
  mfKeys.forEach((key, idx) => {
    const color = colors[idx];
    ctx.beginPath();
    for (let px = 0; px <= w; px++) {
      const xVal = minVal + (px / w) * (maxVal - minVal);
      const yVal = mfs[key](xVal);
      const cx = padL + px;
      const cy = padT + h - yVal * h;
      if (px === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Fill
    ctx.beginPath();
    ctx.moveTo(padL, padT + h);
    for (let px = 0; px <= w; px++) {
      const xVal = minVal + (px / w) * (maxVal - minVal);
      const yVal = mfs[key](xVal);
      ctx.lineTo(padL + px, padT + h - yVal * h);
    }
    ctx.lineTo(padL + w, padT + h);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ',0.12)').replace('rgb(', 'rgba(').replace('#', '');
    // Use hex with alpha trick
    ctx.fillStyle = color + '1f';
    ctx.fill();
  });

  // Current value line
  const cvx = padL + ((currentVal - minVal) / (maxVal - minVal)) * w;
  ctx.beginPath();
  ctx.moveTo(cvx, padT); ctx.lineTo(cvx, padT + h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // X axis labels
  ctx.fillStyle = 'rgba(120,150,200,0.7)';
  ctx.font = '8px Share Tech Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(minVal, padL, H - 2);
  ctx.textAlign = 'center';
  ctx.fillText(((minVal + maxVal) / 2).toFixed(0), padL + w / 2, H - 2);
  ctx.textAlign = 'right';
  ctx.fillText(maxVal, padL + w, H - 2);
}

// Draw Output MF
function drawOutputMF(ruleResults, crisp) {
  const canvas = document.getElementById('mf-output');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth - 8;
  const H = canvas.height = 65;
  ctx.clearRect(0, 0, W, H);

  const padL = 4, padR = 4, padT = 4, padB = 14;
  const w = W - padL - padR;
  const h = H - padT - padB;

  const outColors = ['#4ecdc4', '#6bcb77', '#ffd93d', '#ff9f43', '#ff6b6b'];
  const outKeys = ['sgtRendah', 'rendah', 'sedang', 'tinggi', 'sgtTinggi'];

  // Grid
  ctx.strokeStyle = 'rgba(100,150,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + h - (i / 4) * h;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + w, y); ctx.stroke();
  }

  // Draw base MFs (dim)
  outKeys.forEach((key, idx) => {
    ctx.beginPath();
    for (let px = 0; px <= w; px++) {
      const xVal = px / w * 100;
      const yVal = outMFs[key](xVal);
      const cx = padL + px, cy = padT + h - yVal * h;
      if (px === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = outColors[idx] + '55';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw aggregated (clipped) output
  const aggData = [];
  for (let px = 0; px <= w; px++) {
    const xVal = px / w * 100;
    let aggVal = 0;
    ruleResults.forEach(r => {
      if (r.strength > 0.001) {
        aggVal = Math.max(aggVal, Math.min(r.strength, outMFs[r.con](xVal)));
      }
    });
    aggData.push(aggVal);
  }

  // Fill aggregated
  ctx.beginPath();
  ctx.moveTo(padL, padT + h);
  aggData.forEach((v, px) => ctx.lineTo(padL + px, padT + h - v * h));
  ctx.lineTo(padL + w, padT + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(77,166,255,0.2)';
  ctx.fill();

  ctx.beginPath();
  aggData.forEach((v, px) => {
    const cx = padL + px, cy = padT + h - v * h;
    if (px === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  });
  ctx.strokeStyle = '#4da6ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crisp value line
  const cvx = padL + (crisp / 100) * w;
  ctx.beginPath();
  ctx.moveTo(cvx, padT); ctx.lineTo(cvx, padT + h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([3,3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = 'rgba(120,150,200,0.7)';
  ctx.font = '8px Share Tech Mono, monospace';
  ctx.textAlign = 'left'; ctx.fillText('0', padL, H - 2);
  ctx.textAlign = 'center'; ctx.fillText('50', padL + w/2, H - 2);
  ctx.textAlign = 'right'; ctx.fillText('100', padL + w, H - 2);
}

// Draw Gauge
function drawGauge(value, color) {
  const canvas = document.getElementById('gauge-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 260;
  const H = canvas.height = 160;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H - 20;
  const R = 110, r = 75;
  const startAngle = Math.PI, endAngle = 2 * Math.PI;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, R, startAngle, endAngle);
  ctx.arc(cx, cy, r, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fillStyle = '#0c1228';
  ctx.fill();

  // Colored segments
  const segments = [
    { col: '#4ecdc4', from: 0, to: 0.2 },
    { col: '#6bcb77', from: 0.2, to: 0.36 },
    { col: '#ffd93d', from: 0.36, to: 0.56 },
    { col: '#ff9f43', from: 0.56, to: 0.75 },
    { col: '#ff6b6b', from: 0.75, to: 1.0 }
  ];

  segments.forEach(seg => {
    const a1 = Math.PI + seg.from * Math.PI;
    const a2 = Math.PI + seg.to * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, a1, a2);
    ctx.arc(cx, cy, r + 2, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = seg.col + '99';
    ctx.fill();
    ctx.strokeStyle = seg.col + 'cc';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI + (i / 10) * Math.PI;
    const isMajor = i % 2 === 0;
    const rOut = R + 4;
    const rIn = isMajor ? R - 15 : R - 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rOut, cy + Math.sin(angle) * rOut);
    ctx.lineTo(cx + Math.cos(angle) * rIn, cy + Math.sin(angle) * rIn);
    ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.stroke();

    if (isMajor) {
      const tR = R - 22;
      ctx.fillStyle = 'rgba(180,200,255,0.7)';
      ctx.font = '8px Share Tech Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i * 10, cx + Math.cos(angle) * tR, cy + Math.sin(angle) * tR);
    }
  }

  // Needle
  const needleAngle = Math.PI + (value / 100) * Math.PI;
  const needleLen = R - 18;
  const nx = cx + Math.cos(needleAngle) * needleLen;
  const ny = cy + Math.sin(needleAngle) * needleLen;

  // Needle glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#0c1228';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Value text in gauge
  ctx.fillStyle = color;
  ctx.font = 'bold 14px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toFixed(1), cx, cy - 30);

  ctx.fillStyle = 'rgba(140,160,200,0.7)';
  ctx.font = '9px Share Tech Mono, monospace';
  ctx.fillText('POLLUTION INDEX', cx, cy - 17);
}

// Draw Bortle Bar
function drawBortleBar(bortleVal) {
  const colors = ['#1a1a2e','#16213e','#0f3460','#1a5276','#1f618d','#f39c12','#e67e22','#e74c3c','#c0392b'];
  const labels = ['1','2','3','4','5','6','7','8','9'];
  const bar = document.getElementById('bortle-bar');
  bar.innerHTML = '';
  colors.forEach((col, i) => {
    const cell = document.createElement('div');
    cell.className = 'bortle-cell';
    cell.style.background = col;
    cell.textContent = labels[i];
    if (i + 1 === bortleVal) {
      cell.classList.add('active-cell');
      cell.style.boxShadow = `0 0 10px ${col}`;
    }
    bar.appendChild(cell);
  });
}

// Draw Sky Simulation
function drawSky(pollutionLevel) {
  const canvas = document.getElementById('sky-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth;
  const H = canvas.height = 100;
  ctx.clearRect(0, 0, W, H);

  // Sky gradient based on pollution
  const pollFrac = pollutionLevel / 100;
  const r = Math.floor(4 + pollFrac * 40);
  const g = Math.floor(6 + pollFrac * 20);
  const b = Math.floor(15 + pollFrac * 35);
  const glowR = Math.floor(pollFrac * 120);
  const glowG = Math.floor(pollFrac * 80);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgb(${r},${g},${b})`);
  grad.addColorStop(1, `rgb(${r+8},${g+10},${b+20})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Light pollution glow at horizon
  if (pollFrac > 0.1) {
    const glowGrad = ctx.createRadialGradient(W/2, H, 5, W/2, H, W*0.7);
    glowGrad.addColorStop(0, `rgba(${glowR},${glowG},20,${pollFrac * 0.6})`);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // Stars (more stars = less pollution)
  const numStars = Math.floor((1 - pollFrac) * 120 + 5);
  for (let i = 0; i < numStars; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * H * 0.85;
    const sr = Math.random() * 1.2 + 0.2;
    const sa = (1 - pollFrac) * Math.random() * 0.9 + 0.1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${sa})`;
    ctx.fill();
  }

  // Milky Way hint (only when very dark)
  if (pollFrac < 0.25) {
    const mwA = (0.25 - pollFrac) * 2;
    ctx.save();
    ctx.globalAlpha = mwA * 0.15;
    const mwGrad = ctx.createLinearGradient(0, 0, W, H);
    mwGrad.addColorStop(0, 'transparent');
    mwGrad.addColorStop(0.4, 'rgba(180,200,255,1)');
    mwGrad.addColorStop(0.6, 'rgba(150,170,230,1)');
    mwGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mwGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Horizon line
  ctx.beginPath();
  ctx.moveTo(0, H - 15); ctx.lineTo(W, H - 15);
  ctx.strokeStyle = 'rgba(80,120,180,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ground silhouette
  ctx.fillStyle = 'rgba(5,8,20,0.95)';
  ctx.fillRect(0, H - 15, W, 15);
}

// ========================================================
// RULES RENDER
// ========================================================
function buildRulesHTML() {
  const container = document.getElementById('rules-container');
  container.innerHTML = '';
  const conLabels = {
    sgtRendah: '<span style="color:#4ecdc4">Sgt Rendah</span>',
    rendah: '<span style="color:#6bcb77">Rendah</span>',
    sedang: '<span style="color:#ffd93d">Sedang</span>',
    tinggi: '<span style="color:#ff9f43">Tinggi</span>',
    sgtTinggi: '<span style="color:#ff6b6b">Sgt Tinggi</span>'
  };
  const varNames = {sqm:'SQM', dist:'Jarak', dens:'Kepadatan'};
  const mfLabels = {
    tinggi:'<span class="rule-mf">Tinggi</span>',
    sedang:'<span class="rule-mf">Sedang</span>',
    rendah:'<span class="rule-mf">Rendah</span>',
    dekat:'<span class="rule-mf">Dekat</span>',
    jauh:'<span class="rule-mf">Jauh</span>'
  };

  RULES.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.id = `rule-${rule.id}`;

    const antParts = rule.ant.map((a, i) => {
      const prefix = i === 0 ? `<span class="rule-keyword-if">IF</span> ` : `<span class="rule-keyword-and"> ∧ </span>`;
      return `${prefix}${varNames[a.v]} ${mfLabels[a.mf] || '<span class="rule-mf">'+a.mf+'</span>'}`;
    }).join('');

    div.innerHTML = `
      <span style="color:var(--accent-blue);font-weight:bold">R${rule.id}:</span> 
      ${antParts} 
      <span class="rule-keyword-then">→</span> Polusi ${conLabels[rule.con]}
      <div class="rule-strength"><div class="rule-strength-bar" id="rbar-${rule.id}" style="width:0%"></div></div>
    `;
    container.appendChild(div);
  });
}

// ========================================================
// MAIN UPDATE FUNCTION
// ========================================================
function update() {
  const sqmRaw = parseInt(document.getElementById('sqm-slider').value);
  const dist   = parseInt(document.getElementById('dist-slider').value);
  const dens   = parseInt(document.getElementById('dens-slider').value);
  const sqm    = sqmRaw; // stored as *10

  // Update display values
  document.getElementById('sqm-val').textContent  = (sqmRaw / 10).toFixed(1);
  document.getElementById('dist-val').textContent = dist;
  document.getElementById('dens-val').textContent = dens;

  // Update slider gradient
  const sqmPct  = ((sqmRaw - 150) / (220 - 150)) * 100;
  const distPct = (dist / 100) * 100;
  const densPct = (dens / 1000) * 100;
  document.getElementById('sqm-slider').style.setProperty('--pct', sqmPct + '%');
  document.getElementById('dist-slider').style.setProperty('--pct', distPct + '%');
  document.getElementById('dens-slider').style.setProperty('--pct', densPct + '%');

  // Draw input MFs
  drawMFCanvas('mf-sqm', sqmMFs, ['#ff6b6b','#ffd93d','#6bcb77'], sqm, 150, 220);
  drawMFCanvas('mf-dist', distMFs, ['#ff6b6b','#ffd93d','#6bcb77'], dist, 0, 100);
  drawMFCanvas('mf-dens', densMFs, ['#6bcb77','#ffd93d','#ff6b6b'], dens, 0, 1000);

  // Evaluate rules
  const ruleResults = evaluate(sqm, dist, dens);

  // Update rules display
  let activeCount = 0;
  ruleResults.forEach(r => {
    const el = document.getElementById(`rule-${r.id}`);
    const bar = document.getElementById(`rbar-${r.id}`);
    if (el && bar) {
      if (r.strength > 0.01) {
        el.classList.add('active');
        bar.style.width = (r.strength * 100).toFixed(1) + '%';
        activeCount++;
      } else {
        el.classList.remove('active');
        bar.style.width = '0%';
      }
    }
  });

  document.getElementById('active-count').textContent = activeCount;

  // Defuzzify
  const crisp = defuzzify(ruleResults);
  const cls = classifyPollution(crisp);

  // Update output
  const resVal = document.getElementById('result-value');
  const resClass = document.getElementById('result-class');
  resVal.textContent = crisp.toFixed(2);
  resVal.style.color = cls.color;
  resClass.textContent = cls.label;
  resClass.style.color = cls.color;

  drawGauge(crisp, cls.color);
  drawBortleBar(cls.bortle);
  drawSky(crisp);
  drawOutputMF(ruleResults, crisp);
}

// ========================================================
// INIT
// ========================================================
window.addEventListener('load', () => {
  buildRulesHTML();

  ['sqm-slider', 'dist-slider', 'dens-slider'].forEach(id => {
    document.getElementById(id).addEventListener('input', update);
  });

  update();

  // Re-draw on resize
  window.addEventListener('resize', () => {
    update();
  });
});