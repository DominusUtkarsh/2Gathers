import { NextRequest, NextResponse } from "next/server";
import { parseAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBiometricProfile, saveBiometricProfile } from "@/lib/biometricStore";

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    const userId = parseAccessToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const profile = await getBiometricProfile(userId);

    return NextResponse.json({
      success: true,
      data: {
        hasRegisteredFace: Boolean(profile?.facePhoto),
        facePhoto: profile?.facePhoto || null,
        signature: profile?.signature || null,
        registeredAt: profile?.registeredAt || null,
        candidateName: user.name,
      },
    });
  } catch (err) {
    console.error("Biometric profile GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load biometric profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    const userId = parseAccessToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { facePhoto, signature } = body;

    if (!facePhoto || !signature || !Array.isArray(signature)) {
      return NextResponse.json(
        { success: false, error: "Valid face photo and signature vector required" },
        { status: 400 }
      );
    }

    const profile = await saveBiometricProfile(userId, facePhoto, signature);

    return NextResponse.json({
      success: true,
      data: {
        hasRegisteredFace: true,
        facePhoto: profile.facePhoto,
        registeredAt: profile.registeredAt,
      },
    });
  } catch (err) {
    console.error("Biometric profile POST error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save biometric profile" },
      { status: 500 }
    );
  }
}
