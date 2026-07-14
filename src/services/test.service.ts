import { TestRepository, TestFilters } from "@/repositories/test.repository";
import { SubjectRepository } from "@/repositories/subject.repository";
import { Test, Prisma } from "@prisma/client";
import { z } from "zod";

// Zod schema for validation
export const createTestSchema = z.object({
  title: z.string().min(3, "Test name must be at least 3 characters"),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().int().min(1, "Total marks must be at least 1"),
  passMarks: z.number().int().min(1, "Passing marks must be at least 1"),
  type: z.enum(["PRACTICE_QUIZ", "MOCK_TEST", "SECTIONAL_TEST", "PREVIOUS_YEAR_PAPER", "DAILY_QUIZ"]).default("MOCK_TEST"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  negativeMarking: z.number().min(0, "Negative mark penalty cannot be negative").default(0),
  instructions: z.string().optional().nullable(),
  allowMultipleAttempts: z.boolean().default(true),
  allowResume: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResultImmediately: z.boolean().default(true),
  showAnswersAfterSubmission: z.boolean().default(true),
  startDate: z.preprocess((val) => (val === "" || val === null ? null : new Date(val as string)), z.date().nullable().optional()),
  endDate: z.preprocess((val) => (val === "" || val === null ? null : new Date(val as string)), z.date().nullable().optional()),
  subjectId: z.string().min(1, "Subject is required"),
  categoryId: z.string().optional().nullable(),
});

export const updateTestSchema = createTestSchema.partial();

export type TestInput = z.infer<typeof createTestSchema>;

export class TestService {
  private testRepo = new TestRepository();
  private subjectRepo = new SubjectRepository();

  // VALIDATION HELPER FOR DATE RANGE AND PASSING MARKS
  private validateRules(data: Partial<TestInput>, existing?: Test) {
    const total = data.totalMarks !== undefined ? data.totalMarks : (existing?.totalMarks ?? 0);
    const pass = data.passMarks !== undefined ? data.passMarks : (existing?.passMarks ?? 0);

    if (pass > total) {
      throw new Error(`Passing marks (${pass}) cannot exceed total marks (${total})`);
    }

    const start = data.startDate !== undefined ? data.startDate : (existing?.startDate ?? null);
    const end = data.endDate !== undefined ? data.endDate : (existing?.endDate ?? null);

    if (start && end && new Date(end) <= new Date(start)) {
      throw new Error("End date/time must be after start date/time");
    }
  }

  // CREATE TEST
  async createTest(data: TestInput): Promise<Test> {
    const validated = createTestSchema.parse(data);
    this.validateRules(validated);

    // Check parent subject exists
    const subject = await this.subjectRepo.findById(validated.subjectId);
    if (!subject) {
      throw new Error("Target Subject does not exist or has been deleted");
    }

    // Check parent category if passed
    if (validated.categoryId) {
      const category = await this.subjectRepo.findCategoryById(validated.categoryId);
      if (!category) {
        throw new Error("Target Category does not exist or has been deleted");
      }
    }

    // Name uniqueness check inside the same subject
    const existing = await this.testRepo.findByNameAndSubject(validated.title, validated.subjectId);
    if (existing) {
      throw new Error(`Active Test with name "${validated.title}" already exists under this subject`);
    }

    const payload: Prisma.TestCreateInput = {
      title: validated.title,
      description: validated.description || null,
      duration: validated.duration,
      totalMarks: validated.totalMarks,
      passMarks: validated.passMarks,
      type: validated.type,
      status: validated.status,
      visibility: validated.visibility,
      negativeMarking: validated.negativeMarking,
      instructions: validated.instructions || null,
      allowMultipleAttempts: validated.allowMultipleAttempts,
      allowResume: validated.allowResume,
      shuffleQuestions: validated.shuffleQuestions,
      shuffleOptions: validated.shuffleOptions,
      showResultImmediately: validated.showResultImmediately,
      showAnswersAfterSubmission: validated.showAnswersAfterSubmission,
      startDate: validated.startDate || null,
      endDate: validated.endDate || null,
      subject: {
        connect: { id: validated.subjectId },
      },
    };

    if (validated.categoryId) {
      payload.category = {
        connect: { id: validated.categoryId },
      };
    }

    return this.testRepo.create(payload);
  }

  // UPDATE TEST
  async updateTest(id: string, data: Partial<TestInput>): Promise<Test> {
    const validated = updateTestSchema.parse(data);
    
    // Resolve existing test
    const current = await this.testRepo.findById(id);
    if (!current) {
      throw new Error("Test not found");
    }

    this.validateRules(validated, current);

    // Uniqueness validation if subjectId or title changes
    const targetSubjectId = validated.subjectId || current.subjectId;
    const targetTitle = validated.title || current.title;

    if (validated.title || validated.subjectId) {
      const existing = await this.testRepo.findByNameAndSubject(targetTitle, targetSubjectId);
      if (existing && existing.id !== id) {
        throw new Error(`Active Test with name "${targetTitle}" already exists under this subject`);
      }
    }

    const payload: Prisma.TestUpdateInput = {
      title: validated.title,
      description: validated.description,
      duration: validated.duration,
      totalMarks: validated.totalMarks,
      passMarks: validated.passMarks,
      type: validated.type,
      status: validated.status,
      visibility: validated.visibility,
      negativeMarking: validated.negativeMarking,
      instructions: validated.instructions,
      allowMultipleAttempts: validated.allowMultipleAttempts,
      allowResume: validated.allowResume,
      shuffleQuestions: validated.shuffleQuestions,
      shuffleOptions: validated.shuffleOptions,
      showResultImmediately: validated.showResultImmediately,
      showAnswersAfterSubmission: validated.showAnswersAfterSubmission,
      startDate: validated.startDate,
      endDate: validated.endDate,
    };

    if (validated.subjectId) {
      payload.subject = {
        connect: { id: validated.subjectId },
      };
    }

    if (validated.categoryId !== undefined) {
      if (validated.categoryId === null) {
        payload.category = { disconnect: true };
      } else {
        payload.category = { connect: { id: validated.categoryId } };
      }
    }

    return this.testRepo.update(id, payload);
  }

  // SOFT DELETE TEST
  async softDeleteTest(id: string): Promise<Test> {
    return this.testRepo.softDelete(id);
  }

  // RESTORE TEST
  async restoreTest(id: string): Promise<Test> {
    // Confirm parent subject is active first
    const test = await this.testRepo.findByIdIncludeDeleted(id);
    if (test) {
      const subject = await this.subjectRepo.findSubjectByIdIncludeDeleted(test.subjectId);
      if (subject?.isDeleted) {
        throw new Error("Cannot restore Test because its parent Subject is deleted. Restore the Subject first.");
      }
    }
    return this.testRepo.restore(id);
  }

  // DUPLICATE TEST
  async duplicateTest(id: string): Promise<Test> {
    const source = await this.testRepo.findById(id);
    if (!source) {
      throw new Error("Source test to clone not found");
    }

    // Form copy name, ensure uniqueness
    let copyTitle = `Copy of ${source.title}`;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const existing = await this.testRepo.findByNameAndSubject(copyTitle, source.subjectId);
      if (!existing) {
        isUnique = true;
      } else {
        copyTitle = `Copy of ${source.title} (${counter})`;
        counter++;
      }
    }

    // Map create payload (cloning settings, defaulting status to DRAFT)
    const payload: Prisma.TestCreateInput = {
      title: copyTitle,
      description: source.description,
      duration: source.duration,
      totalMarks: source.totalMarks,
      passMarks: source.passMarks,
      type: source.type,
      status: "DRAFT", // Always default duplicate clones to DRAFT
      visibility: source.visibility,
      negativeMarking: source.negativeMarking,
      instructions: source.instructions,
      allowMultipleAttempts: source.allowMultipleAttempts,
      allowResume: source.allowResume,
      shuffleQuestions: source.shuffleQuestions,
      shuffleOptions: source.shuffleOptions,
      showResultImmediately: source.showResultImmediately,
      showAnswersAfterSubmission: source.showAnswersAfterSubmission,
      startDate: source.startDate,
      endDate: source.endDate,
      subject: {
        connect: { id: source.subjectId },
      },
    };

    if (source.categoryId) {
      payload.category = {
        connect: { id: source.categoryId },
      };
    }

    return this.testRepo.create(payload);
  }

  // GET DETAILS
  async getTestDetails(id: string): Promise<Test | null> {
    return this.testRepo.findById(id);
  }

  // SEARCH AND PAGINATE
  async getTestsFiltered(filters: TestFilters) {
    return this.testRepo.findAllPaginatedAndFiltered(filters);
  }
}
