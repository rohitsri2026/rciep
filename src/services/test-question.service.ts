import { TestRepository } from "@/repositories/test.repository";
import { QuestionRepository } from "@/repositories/question.repository";

export class TestQuestionService {
  private testRepo = new TestRepository();
  private questionRepo = new QuestionRepository();

  // UPDATE TOTAL MARKS DYNAMICALLY ON PARENT TEST
  private async syncParentTestTotalMarks(testId: string) {
    const assigned = await this.testRepo.findAssignedQuestions(testId);
    const sum = assigned.reduce((acc, curr) => acc + curr.marks, 0);

    // Update parent test's totalMarks in database
    await this.testRepo.update(testId, {
      totalMarks: sum,
    });
  }

  // GET ASSIGNED QUESTIONS
  async getAssignedQuestions(testId: string) {
    if (!testId) {
      throw new Error("Test ID is required");
    }
    return this.testRepo.findAssignedQuestions(testId);
  }

  // ASSIGN QUESTIONS TO TEST
  async assignQuestionsToTest(testId: string, questionIds: string[]) {
    if (!testId) throw new Error("Test ID is required");
    if (!questionIds || questionIds.length === 0) {
      throw new Error("No question IDs provided for assignment");
    }

    // Check if test exists
    const test = await this.testRepo.findByIdIncludeDeleted(testId);
    if (!test) {
      throw new Error("Test not found");
    }
    if (test.isDeleted) {
      throw new Error("Cannot assign questions to a deleted test");
    }

    // Load current max displayOrder
    const maxOrder = await this.testRepo.findMaxDisplayOrder(testId);

    // Save mapping links using test's default negativeMarking value as the base default
    const defaultNeg = test.negativeMarking ?? 0.0;
    await this.testRepo.assignQuestions(testId, questionIds, maxOrder, defaultNeg);

    // Update parent test total marks to match sum of assigned question marks
    await this.syncParentTestTotalMarks(testId);

    return { success: true };
  }

  // REMOVE QUESTIONS FROM TEST
  async removeQuestionsFromTest(testId: string, questionIds: string[]) {
    if (!testId) throw new Error("Test ID is required");
    if (!questionIds || questionIds.length === 0) {
      throw new Error("No question IDs provided for removal");
    }

    // Remove the linkage records
    await this.testRepo.removeQuestions(testId, questionIds);

    // Re-index remaining questions displayOrder so they are contiguous starting from 1
    const remaining = await this.testRepo.findAssignedQuestions(testId);
    const reorders = remaining.map((tq, idx) => ({
      questionId: tq.questionId,
      displayOrder: idx + 1,
    }));

    if (reorders.length > 0) {
      await this.testRepo.reorderQuestions(testId, reorders);
    }

    // Recalculate parent test total marks
    await this.syncParentTestTotalMarks(testId);

    return { success: true };
  }

  // UPDATE INDIVIDUAL QUESTION MARKS AND PENALTY OVERRIDES
  async updateQuestionOverrides(testId: string, questionId: string, marks: number, negativeMark: number) {
    if (!testId || !questionId) {
      throw new Error("Test ID and Question ID are required");
    }
    if (marks < 0) {
      throw new Error("Marks weight cannot be negative");
    }
    if (negativeMark < 0) {
      throw new Error("Negative marks penalty cannot be negative");
    }

    // Update overrides on the junction record
    await this.testRepo.updateQuestionOverrides(testId, questionId, marks, negativeMark);

    // Recalculate parent test total marks
    await this.syncParentTestTotalMarks(testId);

    return { success: true };
  }

  // BATCH REORDER SEQUENCE
  async reorderQuestionsInTest(testId: string, questionIds: string[]) {
    if (!testId) throw new Error("Test ID is required");
    if (!questionIds || questionIds.length === 0) {
      throw new Error("No reordering sequence provided");
    }

    const reorders = questionIds.map((qId, idx) => ({
      questionId: qId,
      displayOrder: idx + 1,
    }));

    await this.testRepo.reorderQuestions(testId, reorders);

    return { success: true };
  }
}
