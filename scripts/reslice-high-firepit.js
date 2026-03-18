const fs = require('fs');
const { PNG } = require('pngjs');

const sheetPath = 'NEWSPRITESHEET.png';
const outDir = 'assets/firepit';
const png = PNG.sync.read(fs.readFileSync(sheetPath));
const { width: w, height: h, data } = png;

function grayCountCol(x) {
  let g = 0;
  for (let y = 0; y < h; y++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const gg = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const lum = (r + gg + b) / 3;
    if (a > 200 && Math.abs(r - gg) <= 8 && Math.abs(gg - b) <= 8 && lum >= 18 && lum <= 140) g++;
  }
  return g;
}

function grayCountRow(y) {
  let g = 0;
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const gg = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const lum = (r + gg + b) / 3;
    if (a > 200 && Math.abs(r - gg) <= 8 && Math.abs(gg - b) <= 8 && lum >= 18 && lum <= 140) g++;
  }
  return g;
}

function groups(indexes) {
  const res = [];
  let s = null;
  let p = null;
  for (const v of indexes) {
    if (s === null) {
      s = p = v;
      continue;
    }
    if (v === p + 1) {
      p = v;
      continue;
    }
    res.push([s, p]);
    s = p = v;
  }
  if (s !== null) res.push([s, p]);
  return res;
}

const xIdx = [];
for (let x = 0; x < w; x++) {
  if (grayCountCol(x) >= 900) xIdx.push(x);
}

const yIdx = [];
for (let y = 0; y < h; y++) {
  if (grayCountRow(y) >= 1200) yIdx.push(y);
}

const xLines = groups(xIdx);
const yLines = groups(yIdx);
if (xLines.length < 6 || yLines.length < 5) {
  throw new Error(`Could not detect expected border lines (${xLines.length} vertical, ${yLines.length} horizontal).`);
}

// Preserve existing width profile used by current firepit frames.
const colTargets = [264, 258, 255, 256, 265];
const rowTargets = [242, 228, 222, 243];

const colRanges = [];
for (let i = 0; i < 5; i++) {
  const rawL = xLines[i][1] + 1;
  const rawR = xLines[i + 1][0] - 1;
  const rawW = rawR - rawL + 1;
  const target = colTargets[i];
  const trim = rawW - target;
  const trimL = Math.floor(trim / 2);
  const trimR = trim - trimL;
  colRanges.push([rawL + trimL, rawR - trimR]);
}

const rowRanges = [];
for (let i = 0; i < 4; i++) {
  const rawT = yLines[i][1] + 1;
  const rawB = yLines[i + 1][0] - 1;
  const rawH = rawB - rawT + 1;
  const target = rowTargets[i];
  const trim = rawH - target;
  const trimT = Math.floor(trim / 2);
  const trimB = trim - trimT;
  rowRanges.push([rawT + trimT, rawB - trimB]);
}

// Only adjust high row. Shift crop slightly upward to restore headroom at top.
const highRow = 3;
const shiftUp = 3;
let highTop = rowRanges[highRow][0] - shiftUp;
let highBottom = rowRanges[highRow][1] - shiftUp;

if (highTop < 0) {
  const delta = -highTop;
  highTop = 0;
  highBottom += delta;
}
if (highBottom >= h) {
  const delta = highBottom - (h - 1);
  highBottom = h - 1;
  highTop -= delta;
}

for (let c = 0; c < 5; c++) {
  const [left, right] = colRanges[c];
  const outW = right - left + 1;
  const outH = highBottom - highTop + 1;
  const out = new PNG({ width: outW, height: outH });

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const si = ((highTop + y) * w + (left + x)) * 4;
      const di = (y * outW + x) * 4;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }

  const outPath = `${outDir}/high_${c + 1}.png`;
  fs.writeFileSync(outPath, PNG.sync.write(out));
  console.log(`wrote ${outPath} ${outW}x${outH} src(${left},${highTop})..(${right},${highBottom})`);
}

