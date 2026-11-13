export type ViolationType =
  | "NO_FACE_DETECTED"
  | "MULTIPLE_FACES_DETECTED"
  | "IDENTITY_MISMATCH"
  | "LOOKING_AWAY"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "SUSPICIOUS_PASTE"
  | "PASTE_ATTEMPT"
  | "COPY_ATTEMPT"
  | "SCREENSHOT_ATTEMPT"
  | "DEVTOOLS_ATTEMPT"
  | "CAMERA_DISCONNECTED"
  | "CAMERA_OBSTRUCTED";

export type ViolationSeverity = "low" | "medium" | "high" | "critical";

export interface ViolationRecord {
  id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  message: string;
  timestamp: number;
  snapshotUrl?: string;
  details?: string;
}

export type ProctoringStatus =
  | "uninitialized"
  | "calibrating"
  | "ready"
  | "active"
  | "paused"
  | "completed"
  | "disqualified";

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  count: number;
  boxes: FaceBoundingBox[];
  primaryBox?: FaceBoundingBox;
  isObstructed: boolean;
  isLookingAway?: boolean;
}

export interface ProctoringMetrics {
  totalChecks: number;
  faceLostCount: number;
  multiFaceCount: number;
  identityMismatchCount: number;
  tabSwitchCount: number;
  pasteCount: number;
  copyCount: number;
  screenshotCount: number;
  averageSimilarity: number;
  totalDurationSeconds: number;
}

export interface ProctoringSubmissionPayload {
  trustScore: number;
  strikes: number;
  isDisqualified: boolean;
  isFlagged: boolean;
  baselineSnapshot: string | null;
  finalSnapshot: string | null;
  violations: ViolationRecord[];
  metrics: ProctoringMetrics;
  completedAt: string;
}

export interface ProctoringSessionState {
  status: ProctoringStatus;
  isCameraActive: boolean;
  faceDetected: boolean;
  faceCount: number;
  isLookingAway: boolean;
  isObstructed: boolean;
  similarityScore: number;
  trustScore: number;
  strikes: number;
  violations: ViolationRecord[];
  baselineSnapshot: string | null;
  lastSnapshot: string | null;
  isFullscreen: boolean;
  durationSeconds: number;
}
