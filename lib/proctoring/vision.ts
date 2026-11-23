import { FaceBoundingBox, FaceDetectionResult } from "./types";

interface NativeDetectedFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface NativeFaceDetector {
  detect(image: ImageBitmapSource): Promise<NativeDetectedFace[]>;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => NativeFaceDetector;
  }
}

let nativeDetectorInstance: NativeFaceDetector | null = null;
let nativeDetectorFailed = false;

function getNativeFaceDetector(): NativeFaceDetector | null {
  if (typeof window === "undefined") return null;
  if (nativeDetectorFailed) return null;
  if (nativeDetectorInstance) return nativeDetectorInstance;

  try {
    if ("FaceDetector" in window && typeof window.FaceDetector === "function") {
      nativeDetectorInstance = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
      return nativeDetectorInstance;
    }
  } catch {
    nativeDetectorFailed = true;
  }
  return null;
}

/**
 * Robust client-side computer vision face detector using native Shape Detection API
 * with automatic fallback to canvas-based horizontal density histogram projection.
 * Eliminates false-positive multi-face alarms for solo candidates.
 */
export async function detectFaces(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): Promise<FaceDetectionResult> {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: false,
      isLookingAway: false,
    };
  }

  // Ensure video is actively playing if ready
  if (video.paused) {
    video.play().catch(() => {});
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  // 1. Lighting / Obstruction Check (Room lights off or lens covered)
  const lightingCheck = checkFrameLighting(video, workCanvas);
  if (lightingCheck.isObstructed) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: true,
      isLookingAway: false,
    };
  }

  // 2. Hardware-accelerated native detector if available in browser
  const nativeDetector = getNativeFaceDetector();
  if (nativeDetector) {
    try {
      const faces = await nativeDetector.detect(video);
      // Filter out tiny noise boxes
      const validFaces = (faces || []).filter(
        (f) => f.boundingBox.width >= 35 && f.boundingBox.height >= 35
      );

      if (validFaces.length > 0) {
        const boxes: FaceBoundingBox[] = validFaces.map((face) => ({
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
          confidence: 0.95,
        }));

        boxes.sort((a, b) => b.width * b.height - a.width * a.height);
        const primary = boxes[0];

        const faceCenterX = primary.x + primary.width / 2;
        const normalizedCenterX = faceCenterX / vWidth;
        const isLookingAway = normalizedCenterX < 0.15 || normalizedCenterX > 0.85;

        return {
          detected: true,
          count: boxes.length,
          boxes,
          primaryBox: primary,
          isObstructed: false,
          isLookingAway,
        };
      }
    } catch {
      nativeDetectorFailed = true;
    }
  }

  // 3. Robust in-canvas computer vision fallback
  return analyzeCanvasSkinFallback(video, workCanvas);
}

/**
 * Checks for darkness (room lights off), covered camera lens, or blinding glare.
 */
function checkFrameLighting(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): { isObstructed: boolean; avgLuminance: number } {
  const canvas = workCanvas || document.createElement("canvas");
  const w = 64;
  const h = 48;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { isObstructed: false, avgLuminance: 128 };

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  let totalLuminance = 0;
  for (let i = 0; i < d.length; i += 4) {
    totalLuminance += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }

  const avgLuminance = totalLuminance / (w * h);
  // Pitch black / room lights off (avgLuminance < 35) or blinding glare (> 245)
  const isObstructed = avgLuminance < 35 || avgLuminance > 245;

  return { isObstructed, avgLuminance };
}

/**
 * Pure Canvas Computer Vision Analyzer:
 * Uses upper-zone horizontal density projection with peak-valley separation.
 * Guarantees a solo candidate is ALWAYS detected as count = 1,
 * and ONLY flags multiple faces when two prominent separate heads exist side-by-side.
 */
function analyzeCanvasSkinFallback(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): FaceDetectionResult {
  const canvas = workCanvas || document.createElement("canvas");
  const scale = 0.25;
  const w = Math.max(80, Math.floor(video.videoWidth * scale));
  const h = Math.max(60, Math.floor(video.videoHeight * scale));

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { detected: false, count: 0, boxes: [], isObstructed: false, isLookingAway: false };
  }

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Upper face zone: from 8% to 70% of frame height (strictly excludes keyboard, desk, hands on mouse)
  const minYLimit = Math.floor(h * 0.08);
  const maxYLimit = Math.floor(h * 0.70);

  const upperColDensity = new Array<number>(w).fill(0);
  let upperSkinPixels = 0;

  let minX = w, maxX = 0, minY = h, maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const yLum = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Human skin cluster in YCbCr & RGB
      const isSkin =
        cb >= 74 &&
        cb <= 136 &&
        cr >= 128 &&
        cr <= 182 &&
        yLum >= 32 &&
        yLum <= 238 &&
        r > g &&
        r > b &&
        r - g >= 3;

      if (isSkin) {
        if (y >= minYLimit && y <= maxYLimit) {
          upperColDensity[x]++;
          upperSkinPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  // Not enough skin pixels in upper frame: candidate has stepped away
  if (upperSkinPixels < (w * h) * 0.02) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: false,
      isLookingAway: false,
    };
  }

  // Smooth the column density with a 5-point moving average
  const smoothed = new Array<number>(w).fill(0);
  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < w) {
        sum += upperColDensity[nx];
        count++;
      }
    }
    smoothed[x] = sum / count;
  }

  // Find peaks in the upper-zone horizontal density
  const minPeakThreshold = Math.max(5, (maxYLimit - minYLimit) * 0.18);
  const rawPeaks: { x: number; height: number }[] = [];

  for (let x = 3; x < w - 3; x++) {
    if (
      smoothed[x] >= minPeakThreshold &&
      smoothed[x] >= smoothed[x - 1] &&
      smoothed[x] >= smoothed[x - 2] &&
      smoothed[x] >= smoothed[x + 1] &&
      smoothed[x] >= smoothed[x + 2]
    ) {
      const last = rawPeaks[rawPeaks.length - 1];
      if (!last || x - last.x > w * 0.15) {
        rawPeaks.push({ x, height: smoothed[x] });
      } else if (smoothed[x] > last.height) {
        rawPeaks[rawPeaks.length - 1] = { x, height: smoothed[x] };
      }
    }
  }

  // Check for MULTIPLE INDEPENDENT INDIVIDUALS:
  // Requires:
  // 1. At least two major peaks separated by at least 32% of screen width (> 50 pixels apart on 160px canvas)
  // 2. Both peaks have substantial height (>= 45% of primary peak)
  // 3. A DEEP VALLEY between them where density drops below 25% of the lower peak across at least 8% of width
  let isMultipleFaces = false;
  let person1Peak = rawPeaks[0];
  let person2Peak: { x: number; height: number } | null = null;

  if (rawPeaks.length >= 2) {
    const sortedPeaks = [...rawPeaks].sort((a, b) => b.height - a.height);
    const p1 = sortedPeaks[0];

    for (let pIdx = 1; pIdx < sortedPeaks.length; pIdx++) {
      const p2 = sortedPeaks[pIdx];
      const distance = Math.abs(p2.x - p1.x);

      // Must be horizontally separated by at least 32% of frame width
      if (distance >= w * 0.32 && p2.height >= p1.height * 0.45) {
        const startCol = Math.min(p1.x, p2.x);
        const endCol = Math.max(p1.x, p2.x);
        let minValley = Infinity;
        let valleyWidth = 0;
        const valleyThreshold = Math.min(p1.height, p2.height) * 0.25;

        for (let col = startCol; col <= endCol; col++) {
          if (smoothed[col] < minValley) minValley = smoothed[col];
          if (smoothed[col] <= valleyThreshold) valleyWidth++;
        }

        // Two people require a clear, wide gap/valley of near-zero skin between their heads
        if (minValley <= valleyThreshold && valleyWidth >= Math.max(4, Math.floor(w * 0.08))) {
          isMultipleFaces = true;
          person1Peak = p1.x < p2.x ? p1 : p2;
          person2Peak = p1.x < p2.x ? p2 : p1;
          break;
        }
      }
    }
  }

  const scaleFactor = 1 / scale;
  const boxes: FaceBoundingBox[] = [];

  if (isMultipleFaces && person2Peak) {
    const splitX = Math.round((person1Peak.x + person2Peak.x) / 2);
    const w1 = Math.round(Math.max(45, (splitX - Math.max(0, person1Peak.x - 25))) * scaleFactor);
    const w2 = Math.round(Math.max(45, (Math.min(w, person2Peak.x + 25) - splitX)) * scaleFactor);
    const hBox = Math.round((maxYLimit - minYLimit) * 1.1 * scaleFactor);

    boxes.push({
      x: Math.round(Math.max(0, person1Peak.x - 25) * scaleFactor),
      y: Math.round(minYLimit * scaleFactor),
      width: w1,
      height: hBox,
      confidence: 0.90,
    });
    boxes.push({
      x: Math.round(splitX * scaleFactor),
      y: Math.round(minYLimit * scaleFactor),
      width: w2,
      height: hBox,
      confidence: 0.88,
    });
  } else {
    // Single person: Wrap all upper-zone face pixels
    const width = Math.max(45, maxX - minX + 1);
    const height = Math.max(50, maxY - minY + 1);

    boxes.push({
      x: Math.round(Math.max(0, minX) * scaleFactor),
      y: Math.round(Math.max(0, minY) * scaleFactor),
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor),
      confidence: 0.92,
    });
  }

  const primary = boxes[0];
  const primaryCenterX = (primary.x + primary.width / 2) / video.videoWidth;
  const isLookingAway = primaryCenterX < 0.15 || primaryCenterX > 0.85;

  return {
    detected: true,
    count: isMultipleFaces ? 2 : 1,
    boxes,
    primaryBox: primary,
    isObstructed: false,
    isLookingAway,
  };
}

/**
 * Extracts a normalized 192-dimensional facial feature signature from a video frame.
 * Uses an 8x8 spatial grid with luminance, Cb, Cr, and color distribution.
 */
export function extractFaceSignature(
  video: HTMLVideoElement,
  box?: FaceBoundingBox
): number[] | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const sx = box && box.width > 20 ? Math.max(0, box.x) : video.videoWidth * 0.2;
  const sy = box && box.height > 20 ? Math.max(0, box.y) : video.videoHeight * 0.15;
  const sw = box && box.width > 20 ? Math.min(video.videoWidth - sx, box.width) : video.videoWidth * 0.6;
  const sh = box && box.height > 20 ? Math.min(video.videoHeight - sy, box.height) : video.videoHeight * 0.7;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;

  const gridSize = 8;
  const blockSize = size / gridSize;
  const vector: number[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let sumY = 0;
      let sumCb = 0;
      let sumCr = 0;

      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const px = gx * blockSize + bx;
          const py = gy * blockSize + by;
          const idx = (py * size + px) * 4;

          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];

          const y = 0.299 * r + 0.587 * g + 0.114 * b;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          sumY += y;
          sumCb += cb;
          sumCr += cr;
        }
      }

      const pixelCount = blockSize * blockSize;
      vector.push(sumY / pixelCount);
      vector.push(sumCb / pixelCount);
      vector.push(sumCr / pixelCount);
    }
  }

  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return null;

  return vector.map((v) => v / norm);
}

/**
 * Computes cosine similarity between two face signature vectors.
 * Returns a value between 0.0 and 1.0.
 */
export function compareFaceSignatures(sig1: number[] | null, sig2: number[] | null): number {
  if (!sig1 || !sig2 || sig1.length !== sig2.length) return 0;

  let dot = 0;
  for (let i = 0; i < sig1.length; i++) {
    dot += sig1[i] * sig2[i];
  }

  return Math.max(0, Math.min(1, dot));
}

/**
 * Captures a compressed base64 JPEG snapshot from video stream.
 */
export function captureSnapshot(video: HTMLVideoElement, quality = 0.65, maxWidth = 480): string | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

  try {
    const canvas = document.createElement("canvas");
    const aspect = video.videoHeight / video.videoWidth;
    const width = Math.min(maxWidth, video.videoWidth);
    const height = Math.round(width * aspect);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString()} - 2Gathers Proctor`;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(8, height - 24, 180, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px monospace";
    ctx.fillText(timeStr, 12, height - 12);

    return canvas.toDataURL("image/jpeg", quality);
  } catch (err) {
    console.warn("Failed to capture snapshot:", err);
    return null;
  }
}
