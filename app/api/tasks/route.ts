import { NextRequest, NextResponse } from "next/server";
import { mockTasks, mockTestCases } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");
    const targetAudience = searchParams.get("targetAudience");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let filteredTasks = [...mockTasks];

    if (search) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search) ||
          task.category.toLowerCase().includes(search)
      );
    }

    if (difficulty) {
      filteredTasks = filteredTasks.filter((task) => task.difficulty === difficulty);
    }

    if (category) {
      filteredTasks = filteredTasks.filter((task) => task.category === category);
    }

    if (targetAudience) {
      filteredTasks = filteredTasks.filter(
        (task) => task.targetAudience === targetAudience || task.targetAudience === "ALL"
      );
    }

    const tasksWithMetadata = filteredTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      category: task.category,
      rewardTokens: task.rewardTokens,
      timeLimit: task.timeLimit,
      language: task.language,
      supportedLanguages: task.supportedLanguages,
      targetAudience: task.targetAudience,
      badge: task.badge,
      testCasesCount: mockTestCases[task.id as keyof typeof mockTestCases]?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: tasksWithMetadata,
    });
  } catch (error) {
    console.error("Tasks API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
