import { AttemptRepository } from "@/repositories/attempt.repository";
import { TestRepository } from "@/repositories/test.repository";
import { SubjectRepository } from "@/repositories/subject.repository";
import { db } from "@/lib/db";

export class AttemptService {
  private attemptRepo = new AttemptRepository();
  private testRepo = new TestRepository();
  private subjectRepo = new SubjectRepository();

  // GET STUDENT DASHBOARD DATA
  async getStudentDashboardData(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // 1. Fetch all active, published, public tests
    const allActiveTests = await this.testRepo.findAll();
    const publishedTests = allActiveTests.filter(
      (t) => t.status === "PUBLISHED" && t.visibility === "PUBLIC" && !t.isDeleted
    );

    const now = new Date();

    // 2. Load attempts for this student
    const studentAttempts = await this.attemptRepo.findAllAttemptsByUser(userId);
    const ongoingAttempts = studentAttempts.filter((a) => a.status === "IN_PROGRESS");
    const completedAttempts = studentAttempts.filter((a) => a.status === "COMPLETED");

    // 3. Classify tests
    const availableTests = [];
    const upcomingTests = [];

    for (const test of publishedTests) {
      const hasOngoing = ongoingAttempts.find((a) => a.testId === test.id);
      const completedCount = completedAttempts.filter((a) => a.testId === test.id).length;

      // Check dates
      const start = test.startDate ? new Date(test.startDate) : null;
      const end = test.endDate ? new Date(test.endDate) : null;

      const isUpcoming = start && now < start;
      const isExpired = end && now > end;

      // Attempts limitation validation
      const reachedLimit = !test.allowMultipleAttempts && completedCount > 0;

      if (isUpcoming) {
        upcomingTests.push({
          ...test,
          isUpcoming: true,
          formattedStartDate: start.toLocaleString(),
        });
      } else if (!isExpired && !reachedLimit) {
        availableTests.push({
          ...test,
          hasOngoing: !!hasOngoing,
          ongoingAttemptId: hasOngoing?.id || null,
          completedCount,
        });
      }
    }

    // 4. Scorecard / Recent Results mapping
    const recentResults = completedAttempts.map((attempt) => {
      const percentage = attempt.test.totalMarks > 0
        ? Math.round(((attempt.score ?? 0) / attempt.test.totalMarks) * 100)
        : 0;
      const passed = (attempt.score ?? 0) >= attempt.test.passMarks;

      return {
        attemptId: attempt.id,
        testId: attempt.testId,
        testName: attempt.test.title,
        subjectName: attempt.test.subject?.name || "Unassigned",
        subjectColor: attempt.test.subject?.color || "#6366f1",
        categoryName: attempt.test.category?.name || "General",
        score: attempt.score ?? 0,
        totalMarks: attempt.test.totalMarks,
        percentage,
        passed,
        completedAt: attempt.completedAt?.toLocaleDateString() || new Date(attempt.startedAt).toLocaleDateString(),
      };
    });

    // 5. Dashboard aggregate metrics
    const totalCompleted = completedAttempts.length;
    const avgScorePct = totalCompleted > 0
      ? Math.round(
          completedAttempts.reduce((acc, curr) => {
            const max = curr.test?.totalMarks ?? 100;
            const score = curr.score ?? 0;
            return acc + (score / max) * 100;
          }, 0) / totalCompleted
        )
      : 0;

    const metrics = {
      availableExams: availableTests.length,
      pendingAttempts: ongoingAttempts.length,
      completedExams: totalCompleted,
      averageScore: `${avgScorePct}%`,
    };

    return {
      availableTests,
      upcomingTests,
      recentResults,
      metrics,
    };
  }

  // GET TEST DETAILS FOR INSTRUCTIONS
  async getTestDetailsForStudent(userId: string, testId: string) {
    if (!testId) throw new Error("Test ID is required");

    // Fetch the test details
    const test = await this.testRepo.findById(testId);
    if (!test || test.isDeleted) {
      throw new Error("Target Exam Test was not found");
    }

    // Load attempt profiles
    const activeAttempt = await this.attemptRepo.findActiveAttempt(userId, testId);
    const completedAttempts = await this.attemptRepo.findCompletedAttempts(userId, testId);
    const completedCount = completedAttempts.length;

    // Validate eligibility parameters
    const now = new Date();
    const start = test.startDate ? new Date(test.startDate) : null;
    const end = test.endDate ? new Date(test.endDate) : null;

    const isUpcoming = start && now < start;
    const isExpired = end && now > end;
    const reachedLimit = !test.allowMultipleAttempts && completedCount > 0;

    let eligibilityError: string | null = null;
    if (test.status !== "PUBLISHED" || test.visibility !== "PUBLIC") {
      eligibilityError = "This exam is currently not active.";
    } else if (isUpcoming) {
      eligibilityError = `This exam starts on ${start?.toLocaleString()}.`;
    } else if (isExpired) {
      eligibilityError = "This exam has expired and is no longer accepting submissions.";
    } else if (reachedLimit) {
      eligibilityError = "You have already completed this exam and multiple attempts are disabled.";
    }

    return {
      test,
      activeAttemptId: activeAttempt?.id || null,
      completedCount,
      canStart: !eligibilityError,
      eligibilityError,
    };
  }

  // START OR RESUME ATTEMPT (SERIALIZABLE TRANSACTION CONTROL)
  async startOrResumeAttempt(userId: string, testId: string) {
    if (!userId || !testId) {
      throw new Error("User ID and Test ID are required");
    }

    return await db.$transaction(async (tx) => {
      // 1. If an ongoing attempt exists, resume it immediately
      const activeAttempt = await tx.attempt.findFirst({
        where: { userId, testId, status: "IN_PROGRESS" },
      });
      if (activeAttempt) {
        return { success: true, attemptId: activeAttempt.id, resumed: true };
      }

      // 2. Load the test details inside transaction
      const test = await tx.test.findUnique({
        where: { id: testId },
      });
      if (!test || test.isDeleted) {
        throw new Error("Target Exam Test was not found");
      }

      // Validate timing constraints
      const now = new Date();
      if (test.startDate && now < new Date(test.startDate)) {
        throw new Error(`This test has not started yet. Starts at: ${new Date(test.startDate).toLocaleString()}`);
      }
      if (test.endDate && now > new Date(test.endDate)) {
        throw new Error("This test has expired and can no longer be started");
      }

      // 3. Validate attempts limit
      if (!test.allowMultipleAttempts) {
        const completedCount = await tx.attempt.count({
          where: { userId, testId, status: "COMPLETED" },
        });
        if (completedCount > 0) {
          throw new Error("Multiple attempts are disabled for this exam");
        }
      }

      // 4. Create new attempt atomically
      const attempt = await tx.attempt.create({
        data: {
          userId,
          testId,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      return { success: true, attemptId: attempt.id, resumed: false };
    }, {
      isolationLevel: "Serializable",
    });
  }
}
