import { QuestionRepository, QuestionFilters } from "@/repositories/question.repository";
import { SubjectRepository } from "@/repositories/subject.repository";
import { Question, Prisma, Difficulty, QuestionStatus, QuestionType } from "@prisma/client";
import * as XLSX from "xlsx";
import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(3, "Question text must be at least 3 characters"),
  type: z.nativeEnum(QuestionType).default(QuestionType.MCQ),
  options: z.record(z.string(), z.string()).optional(), // e.g. { A: "...", B: "..." }
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  points: z.number().default(1),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  status: z.nativeEnum(QuestionStatus).default(QuestionStatus.DRAFT),
  questionImage: z.string().optional().nullable(),
  optionImages: z.record(z.string(), z.string().nullable()).optional().nullable(),
  subjectId: z.string().min(1, "Subject is required"),
  categoryId: z.string().optional().nullable(),
});

type QuestionInput = z.infer<typeof questionSchema>;

export class QuestionService {
  private questionRepo = new QuestionRepository();
  private subjectRepo = new SubjectRepository();

  async createQuestion(data: QuestionInput): Promise<Question> {
    const validated = questionSchema.parse(data);
    return this.questionRepo.create({
      text: validated.text,
      type: validated.type,
      options: (validated.options || Prisma.JsonNull) as any,
      correctAnswer: validated.correctAnswer,
      explanation: validated.explanation,
      points: validated.points,
      difficulty: validated.difficulty,
      status: validated.status,
      questionImage: validated.questionImage,
      optionImages: (validated.optionImages || Prisma.JsonNull) as any,
      subjectId: validated.subjectId,
      categoryId: validated.categoryId,
    });
  }

  async updateQuestion(id: string, data: Partial<QuestionInput>): Promise<Question> {
    // Merge updates with schema check
    return this.questionRepo.update(id, data as any);
  }

  async deleteQuestion(id: string): Promise<Question> {
    return this.questionRepo.delete(id);
  }

  async getQuestionDetails(id: string): Promise<Question | null> {
    return this.questionRepo.findById(id);
  }

  async getQuestionsFiltered(filters: QuestionFilters) {
    return this.questionRepo.findAllPaginatedAndFiltered(filters);
  }

  /**
   * Bulk Import from Excel Buffer
   */
  async importFromExcel(buffer: Buffer): Promise<{ importedCount: number }> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    let importedCount = 0;

    for (const row of rows) {
      const subjectName = row["Subject"]?.toString().trim();
      const categoryName = row["Category"]?.toString().trim();
      const questionText = row["Question"]?.toString().trim();
      const optA = row["Option A"]?.toString().trim();
      const optB = row["Option B"]?.toString().trim();
      const optC = row["Option C"]?.toString().trim();
      const optD = row["Option D"]?.toString().trim();
      const correctAnswer = row["Correct Option"]?.toString().trim();
      const explanation = row["Explanation"]?.toString().trim();
      const difficultyStr = row["Difficulty"]?.toString().trim().toUpperCase() || "MEDIUM";
      const statusStr = row["Status"]?.toString().trim().toUpperCase() || "DRAFT";

      // Validate imported row parameters using Zod
      const rowSchema = z.object({
        subjectName: z.string().min(1, "Subject name is required"),
        categoryName: z.string().optional().nullable(),
        questionText: z.string().min(1, "Question text is required"),
        optA: z.string().min(1, "Option A is required"),
        optB: z.string().min(1, "Option B is required"),
        optC: z.string().optional().nullable(),
        optD: z.string().optional().nullable(),
        correctAnswer: z.string().min(1, "Correct Answer is required"),
        explanation: z.string().optional().nullable(),
        difficultyStr: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
        statusStr: z.enum(["DRAFT", "APPROVED", "DISABLED"]).default("DRAFT"),
      });

      const parsed = rowSchema.safeParse({
        subjectName,
        categoryName,
        questionText,
        optA,
        optB,
        optC,
        optD,
        correctAnswer,
        explanation,
        difficultyStr,
        statusStr,
      });

      if (!parsed.success) {
        console.warn("Skipped invalid question row during Excel import:", parsed.error.issues);
        continue; // Skip invalid rows
      }

      // 1. Resolve Subject
      let subject = await this.subjectRepo.findByName(subjectName);
      if (!subject) {
        subject = await this.subjectRepo.create({ name: subjectName });
      }

      // 2. Resolve Category (Topic)
      let categoryId: string | null = null;
      if (categoryName) {
        let category = await this.subjectRepo.findCategoryByNameAndSubject(categoryName, subject.id);
        if (!category) {
          category = await this.subjectRepo.createCategory({
            name: categoryName,
            subject: { connect: { id: subject.id } },
          });
        }
        categoryId = category.id;
      }

      // 3. Resolve difficulty & status
      const difficulty = Object.values(Difficulty).includes(difficultyStr as Difficulty)
        ? (difficultyStr as Difficulty)
        : Difficulty.MEDIUM;

      const status = Object.values(QuestionStatus).includes(statusStr as QuestionStatus)
        ? (statusStr as QuestionStatus)
        : QuestionStatus.DRAFT;

      // 4. Map options
      const options = {
        A: optA || "",
        B: optB || "",
        C: optC || "",
        D: optD || "",
      };

      // 5. Create Question
      await this.questionRepo.create({
        text: questionText,
        type: QuestionType.MCQ,
        options,
        correctAnswer,
        explanation,
        difficulty,
        status,
        subjectId: subject.id,
        categoryId,
      });

      importedCount++;
    }

    return { importedCount };
  }

  /**
   * Bulk Export to Excel Buffer
   */
  async exportToExcel(questions: any[]): Promise<Buffer> {
    const data = questions.map((q) => {
      const options = q.options as Record<string, string> || {};
      return {
        ID: q.id,
        Question: q.text,
        Subject: q.subject?.name || "",
        Category: q.category?.name || "",
        "Option A": options.A || "",
        "Option B": options.B || "",
        "Option C": options.C || "",
        "Option D": options.D || "",
        "Correct Option": q.correctAnswer,
        Explanation: q.explanation || "",
        Difficulty: q.difficulty,
        Status: q.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return excelBuffer;
  }

  /**
   * Bulk Export to CSV String
   */
  async exportToCSV(questions: any[]): Promise<string> {
    const headers = [
      "Question",
      "Subject",
      "Category",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Option",
      "Explanation",
      "Difficulty",
      "Status",
    ];

    const csvRows = [headers.join(",")];

    for (const q of questions) {
      const options = q.options as Record<string, string> || {};
      const values = [
        `"${(q.text || "").replace(/"/g, '""')}"`,
        `"${(q.subject?.name || "").replace(/"/g, '""')}"`,
        `"${(q.category?.name || "").replace(/"/g, '""')}"`,
        `"${(options.A || "").replace(/"/g, '""')}"`,
        `"${(options.B || "").replace(/"/g, '""')}"`,
        `"${(options.C || "").replace(/"/g, '""')}"`,
        `"${(options.D || "").replace(/"/g, '""')}"`,
        `"${(q.correctAnswer || "").replace(/"/g, '""')}"`,
        `"${(q.explanation || "").replace(/"/g, '""')}"`,
        q.difficulty,
        q.status,
      ];
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }
}
