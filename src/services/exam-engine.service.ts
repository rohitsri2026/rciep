import { AttemptRepository } from "@/repositories/attempt.repository";

export class ExamEngineService {
  private attemptRepo = new AttemptRepository();

  // GET LIVE EXAM STATE & REMAINING TIME
  async getExamState(attemptId: string, userId: string) {
    const attempt = await this.attemptRepo.findAttemptWithRelations(attemptId);
    if (!attempt) {
      throw new Error("Exam session not found");
    }

    if (attempt.userId !== userId) {
      throw new Error("Unauthorized access to this exam session");
    }

    if (attempt.status === "COMPLETED") {
      return {
        status: "COMPLETED",
        remainingSeconds: 0,
        attempt,
      };
    }

    // Calculate remaining seconds
    const now = new Date().getTime();
    const started = new Date(attempt.startedAt).getTime();
    const elapsedSeconds = Math.floor((now - started) / 1000);
    const durationSeconds = attempt.test.duration * 60;
    const remainingSeconds = durationSeconds - elapsedSeconds;

    if (remainingSeconds <= 0) {
      // Auto submit test if time expires
      await this.submitExamAttemptInternal(attemptId);
      const updated = await this.attemptRepo.findAttemptWithRelations(attemptId);
      return {
        status: "COMPLETED",
        remainingSeconds: 0,
        attempt: updated,
      };
    }

    return {
      status: "IN_PROGRESS",
      remainingSeconds,
      attempt,
    };
  }

  // SAVE INDIVIDUAL ANSWER STATE (OPTIMISTIC BACKUP)
  async saveAnswer(
    attemptId: string,
    userId: string,
    questionId: string,
    answer: string | null,
    status: "ANSWERED" | "MARKED" | "ANSWERED_MARKED" | "NOT_ANSWERED" | "NOT_VISITED"
  ) {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) throw new Error("Attempt session not found");
    if (attempt.userId !== userId) throw new Error("Access denied");
    if (attempt.status === "COMPLETED") throw new Error("Cannot save answers to a completed test");

    // Parse current JSON map
    const answersMap: any = attempt.answers ? JSON.parse(JSON.stringify(attempt.answers)) : {};

    // Update state
    answersMap[questionId] = {
      answer,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.attemptRepo.updateAttemptAnswers(attemptId, answersMap);
    return { success: true };
  }

  // WRITE CHEATING EVENT TO LOG
  async logCheatingEvent(attemptId: string, userId: string, eventType: string) {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) throw new Error("Attempt session not found");
    if (attempt.userId !== userId) throw new Error("Access denied");
    if (attempt.status === "COMPLETED") return { success: true }; // Ignore log updates if test is closed

    const currentLogs: any[] = attempt.logs ? JSON.parse(JSON.stringify(attempt.logs)) : [];
    
    currentLogs.push({
      type: eventType,
      timestamp: new Date().toISOString(),
    });

    await this.attemptRepo.updateAttemptLogs(attemptId, currentLogs);
    return { success: true };
  }

  // SUBMIT EXAM ATTEMPT (MANUAL TRIGGER)
  async submitExamAttempt(attemptId: string, userId: string) {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) throw new Error("Attempt session not found");
    if (attempt.userId !== userId) throw new Error("Access denied");
    if (attempt.status === "COMPLETED") {
      return { success: true, alreadySubmitted: true };
    }

    return this.submitExamAttemptInternal(attemptId);
  }

  // CORE SCORE EVALUATION TRANSACTIONS
  private async submitExamAttemptInternal(attemptId: string) {
    const attempt = await this.attemptRepo.findAttemptWithRelations(attemptId);
    if (!attempt) throw new Error("Session not found");

    const answersMap: any = attempt.answers ? JSON.parse(JSON.stringify(attempt.answers)) : {};
    let finalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const normalizeAnswer = (ans: string | null) => {
      if (!ans) return "";
      return ans.split(",")
        .map(a => a.trim().toUpperCase())
        .filter(Boolean)
        .sort()
        .join(",");
    };

    // Loop through assigned test questions
    for (const tq of attempt.test.questions) {
      const qState = answersMap[tq.questionId];
      if (qState && qState.answer !== null && qState.answer !== "") {
        // Compare answer option strings directly (normalized & case-insensitive)
        const isCorrect = normalizeAnswer(qState.answer) === normalizeAnswer(tq.question.correctAnswer);
        
        if (isCorrect) {
          correctCount++;
          // Add question marks weight (overridden value)
          finalScore += tq.marks;
        } else {
          wrongCount++;
          // Subtract question negative markings (overridden value)
          finalScore -= tq.negativeMark;
        }
      } else {
        unansweredCount++;
      }
    }

    // Floor final score at 0.0 to prevent negative total aggregates
    if (finalScore < 0) {
      finalScore = 0;
    }

    // Compute duration & pass status
    const completedAt = new Date();
    const timeTaken = Math.max(Math.floor((completedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000), 0);
    const isPassed = finalScore >= attempt.test.passMarks;

    await this.attemptRepo.submitExamAttempt(
      attemptId, 
      finalScore, 
      correctCount, 
      wrongCount, 
      unansweredCount, 
      timeTaken, 
      isPassed
    );

    return { success: true, score: finalScore };
  }
}
