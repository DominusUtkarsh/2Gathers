import { prisma } from "@/lib/prisma";

export interface BiometricProfile {
  userId: number;
  facePhoto: string;
  signature: number[];
  registeredAt: string;
}

// In-memory cache for fast lookup during active sessions
const biometricCache = new Map<number, BiometricProfile>();

/**
 * Retrieves the registered biometric identity profile for a user.
 * Tries database first (via User task submissions/progress metadata), falls back to cache.
 */
export async function getBiometricProfile(userId: number): Promise<BiometricProfile | null> {
  if (biometricCache.has(userId)) {
    return biometricCache.get(userId) || null;
  }

  try {
    // Check if user has an existing proctoring submission with baseline snapshot
    const submission = await prisma.taskSubmission.findFirst({
      where: {
        userId,
        proctoringData: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: { proctoringData: true, createdAt: true },
    });

    if (submission?.proctoringData) {
      try {
        const parsed = JSON.parse(submission.proctoringData);
        if (parsed.baselineSnapshot) {
          const profile: BiometricProfile = {
            userId,
            facePhoto: parsed.baselineSnapshot,
            signature: parsed.baselineSignature || [],
            registeredAt: submission.createdAt.toISOString(),
          };
          biometricCache.set(userId, profile);
          return profile;
        }
      } catch {
        // Ignored
      }
    }
  } catch (err) {
    console.warn("Could not retrieve biometric profile from DB:", err);
  }

  return null;
}

/**
 * Saves or updates a registered biometric identity profile for a user.
 */
export async function saveBiometricProfile(
  userId: number,
  facePhoto: string,
  signature: number[]
): Promise<BiometricProfile> {
  const profile: BiometricProfile = {
    userId,
    facePhoto,
    signature,
    registeredAt: new Date().toISOString(),
  };

  biometricCache.set(userId, profile);

  return profile;
}
