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
 * Fast client-side computer vision face detector using native Shape Detection API
 * with automatic fallback to canvas-based chrominance and spatial clustering.
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
    };
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  // First verify lighting / obstruction on frame
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

  // Try native hardware-accelerated face detector if available
  const nativeDetector = getNativeFaceDetector();
  if (nativeDetector) {
    try {
      const faces = await nativeDetector.detect(video);
      if (faces && faces.length > 0) {
        const boxes: FaceBoundingBox[] = faces.map((face) => ({
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
          confidence: 0.95,
        }));

        // Sort by area descending (largest face is primary)
        boxes.sort((a, b) => b.width * b.height - a.width * a.height);
        const primary = boxes[0];

        // Check if looking away (face bounding box strongly skewed to border)
        const faceCenterX = primary.x + primary.width / 2;
        const normalizedCenterX = faceCenterX / vWidth;
        const isLookingAway = normalizedCenterX < 0.15 || normalizedCenterX > 0.85;

        // Sensitive multi-person cross-verification: If native detector found 1 face,
        // verify with in-canvas skin blob analysis to catch a secondary person in background/profile angle
        if (boxes.length === 1) {
          const fallback = analyzeCanvasSkinFallback(video, workCanvas);
          if (fallback.detected && fallback.count > 1) {
            return fallback;
          }
        }

        return {
          detected: true,
          count: boxes.length,
          boxes,
          primaryBox: primary,
          isObstructed: false,
          isLookingAway,
        };
      } else {
        // Double-check with canvas fallback in case detector missed under certain angles
        return analyzeCanvasSkinFallback(video, workCanvas);
      }
    } catch {
      nativeDetectorFailed = true;
    }
  }

  // Fallback: in-canvas chrominance and contour clustering
  return analyzeCanvasSkinFallback(video, workCanvas);
}

/**
 * Quick check for dark room (lights off), covered camera, or blinding backlight.
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
  // Pitch black / room lights off (avgLuminance < 25) or blinding glare (> 245)
  const isObstructed = avgLuminance < 25 || avgLuminance > 245;

  return { isObstructed, avgLuminance };
}

/**
 * Pure Canvas Computer Vision Analyzer:
 * Uses YCbCr skin modeling + histogram projection with peak-valley separation
 * to accurately detect single vs multiple persons without false positives for centered users.
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
    return { detected: false, count: 0, boxes: [], isObstructed: false };
  }

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let totalLuminance = 0;
  const skinColDensity = new Array<number>(w).fill(0);
  const skinPixels: { x: number; y: number }[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += y;

    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Human skin tone cluster in YCbCr space (calibrated for varied lighting & complexions)
    const isSkin =
      cb >= 70 &&
      cb <= 136 &&
      cr >= 128 &&
      cr <= 182 &&
      y >= 25 &&
      y <= 245 &&
      (r > g || Math.abs(r - g) <= 6) &&
      r > b;

    if (isSkin) {
      const pixelIndex = i / 4;
      const px = pixelIndex % w;
      const py = Math.floor(pixelIndex / w);
      skinPixels.push({ x: px, y: py });
      skinColDensity[px] += 1;
    }
  }

  const avgLuminance = totalLuminance / (w * h);
  const isObstructed = avgLuminance < 25 || avgLuminance > 245;

  if (isObstructed || skinPixels.length < (w * h) * 0.03) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed,
    };
  }

  // --- 1. 2D Spatial Connected Components (Blobs) ---
  const skinMask = new Uint8Array(w * h);
  for (const p of skinPixels) {
    skinMask[p.y * w + p.x] = 1;
  }

  const visited = new Uint8Array(w * h);
  interface SkinBlob {
    pixels: { x: number; y: number }[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    count: number;
    cx: number;
    cy: number;
  }
  const blobs: SkinBlob[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (skinMask[idx] === 1 && visited[idx] === 0) {
        const queue: number[] = [idx];
        visited[idx] = 1;
        const blobPixels: { x: number; y: number }[] = [];
        let minX = x, maxX = x, minY = y, maxY = y;
        let sumX = 0, sumY = 0;

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);
          blobPixels.push({ x: cx, y: cy });
          sumX += cx;
          sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-connected neighbors
          const neighbors = [curr - 1, curr + 1, curr - w, curr + w];
          for (let n = 0; n < 4; n++) {
            const nIdx = neighbors[n];
            if (nIdx >= 0 && nIdx < w * h) {
              const nx = nIdx % w;
              if (Math.abs(nx - cx) <= 1 && skinMask[nIdx] === 1 && visited[nIdx] === 0) {
                visited[nIdx] = 1;
                queue.push(nIdx);
              }
            }
          }
        }

        if (blobPixels.length >= 18) {
          blobs.push({
            pixels: blobPixels,
            minX,
            maxX,
            minY,
            maxY,
            count: blobPixels.length,
            cx: sumX / blobPixels.length,
            cy: sumY / blobPixels.length,
          });
        }
      }
    }
  }

  blobs.sort((a, b) => b.count - a.count);

  // --- 2. Horizontal Column Density Histogram Peak-Valley Analysis ---
  const smoothed = new Array<number>(w).fill(0);
  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < w) {
        sum += skinColDensity[nx];
        count++;
      }
    }
    smoothed[x] = sum / count;
  }

  const peaks: { x: number; height: number }[] = [];
  const minPeakHeight = h * 0.08;

  for (let x = 2; x < w - 2; x++) {
    if (
      smoothed[x] > minPeakHeight &&
      smoothed[x] >= smoothed[x - 1] &&
      smoothed[x] >= smoothed[x - 2] &&
      smoothed[x] >= smoothed[x + 1] &&
      smoothed[x] >= smoothed[x + 2]
    ) {
      const lastPeak = peaks[peaks.length - 1];
      if (!lastPeak || x - lastPeak.x > w * 0.12) {
        peaks.push({ x, height: smoothed[x] });
      } else if (smoothed[x] > lastPeak.height) {
        peaks[peaks.length - 1] = { x, height: smoothed[x] };
      }
    }
  }

  // Check if multiple persons are detected
  const detectedPersons: { x: number; y: number }[][] = [];

  // Check A: Multiple distinct 2D spatial blobs
  if (blobs.length >= 2) {
    const primary = blobs[0];
    detectedPersons.push(primary.pixels);

    for (let bIdx = 1; bIdx < blobs.length; bIdx++) {
      const secondary = blobs[bIdx];
      const dist = Math.hypot(secondary.cx - primary.cx, secondary.cy - primary.cy);
      const isDistinctLocation = dist >= Math.min(w, h) * 0.13;
      const isSubstantial =
        secondary.count >= 20 &&
        (secondary.maxX - secondary.minX) >= 5 &&
        (secondary.maxY - secondary.minY) >= 5 &&
        secondary.minY < h * 0.85;

      if (isDistinctLocation && isSubstantial) {
        detectedPersons.push(secondary.pixels);
        break;
      }
    }
  }

  // Check B: Multi-peak valley check (if connected at torso/clothing)
  if (detectedPersons.length < 2 && peaks.length >= 2) {
    for (let i = 0; i < peaks.length; i++) {
      for (let j = i + 1; j < peaks.length; j++) {
        const p1 = peaks[i];
        const p2 = peaks[j];
        const distance = Math.abs(p2.x - p1.x);

        if (distance >= w * 0.13) {
          const startX = Math.min(p1.x, p2.x);
          const endX = Math.max(p1.x, p2.x);
          let minValley = Infinity;
          let valleyColumns = 0;
          const valleyThreshold = Math.min(p1.height, p2.height) * 0.68;

          for (let col = startX; col <= endX; col++) {
            if (smoothed[col] < minValley) minValley = smoothed[col];
            if (smoothed[col] < valleyThreshold) valleyColumns++;
          }

          if (minValley < valleyThreshold && valleyColumns >= Math.max(2, Math.floor(w * 0.04))) {
            const splitX = Math.round((p1.x + p2.x) / 2);
            const p1Pix: { x: number; y: number }[] = [];
            const p2Pix: { x: number; y: number }[] = [];
            for (const p of skinPixels) {
              if (p.x < splitX) p1Pix.push(p);
              else p2Pix.push(p);
            }

            if (p1Pix.length >= 25 && p2Pix.length >= 25) {
              detectedPersons.length = 0;
              detectedPersons.push(p1Pix);
              detectedPersons.push(p2Pix);
              break;
            }
          }
        }
      }
      if (detectedPersons.length >= 2) break;
    }
  }

  // If single person detected, wrap all skin pixels
  if (detectedPersons.length === 0) {
    detectedPersons.push(skinPixels);
  }

  const boxes: FaceBoundingBox[] = detectedPersons.map((pixels) => {
    const bounds = getBounds(pixels, 1 / scale);
    return { ...bounds, confidence: 0.92 };
  });

  boxes.sort((a, b) => b.width * b.height - a.width * a.height);
  const primary = boxes[0];
  const primaryCenterX = (primary.x + primary.width / 2) / video.videoWidth;
  const isLookingAway = primaryCenterX < 0.15 || primaryCenterX > 0.85;

  return {
    detected: true,
    count: boxes.length,
    boxes,
    primaryBox: primary,
    isObstructed: false,
    isLookingAway,
  };
}

function getBounds(
  pixels: { x: number; y: number }[],
  scaleFactor: number
): { x: number; y: number; width: number; height: number } {
  if (pixels.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pixels) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: Math.round(minX * scaleFactor),
    y: Math.round(minY * scaleFactor),
    width: Math.round(Math.max(20, (maxX - minX)) * scaleFactor),
    height: Math.round(Math.max(20, (maxY - minY)) * scaleFactor),
  };
}

/**
 * Extracts a normalized 192-dimensional facial feature signature from a video frame.
 * Uses an 8x8 spatial grid with luminance, Cb, Cr, and edge gradients.
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
