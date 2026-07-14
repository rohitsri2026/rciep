import { BaseRepository } from "./base.repository";
import { Attempt, Prisma } from "@prisma/client";

export class AttemptRepository extends BaseRepository<Attempt> {
  // FIND ACTIVE ATTEMPT (IN_PROGRESS)
  async findActiveAttempt(userId: string, testId: string): Promise<Attempt | null> {
    return this.db.attempt.findFirst({
      where: {
        userId,
        testId,
        status: "IN_PROGRESS",
      },
    });
  }

  // FIND COMPLETED ATTEMPTS (COMPLETED)
  async findCompletedAttempts(userId: string, testId: string): Promise<Attempt[]> {
    return this.db.attempt.findMany({
      where: {
        userId,
        testId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });
  }

  // FIND ALL ATTEMPTS BY USER WITH TEST DETAILS
  async findAllAttemptsByUser(userId: string) {
    return this.db.attempt.findMany({
      where: { userId },
      include: {
        test: {
          include: {
            subject: true,
            category: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }

  // CREATE NEW ATTEMPT
  async createAttempt(userId: string, testId: string): Promise<Attempt> {
    return this.db.attempt.create({
      data: {
        userId,
        testId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  // FIND BY ID
  async findById(id: string): Promise<Attempt | null> {
    return this.db.attempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            subject: true,
            category: true,
          },
        },
      },
    });
  }

  // BASE CONTRACTS
  async findAll(): Promise<Attempt[]> {
    return this.db.attempt.findMany({
      orderBy: { startedAt: "desc" },
    });
  }

  async create(data: Prisma.AttemptCreateInput): Promise<Attempt> {
    return this.db.attempt.create({
      data,
    });
  }

  async update(id: string, data: Prisma.AttemptUpdateInput): Promise<Attempt> {
    return this.db.attempt.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Attempt> {
    return this.db.attempt.delete({
      where: { id },
    });
  }

  // FIND ATTEMPT WITH EXAM RELATIONS AND QUESTION DETAILS
  async findAttemptWithRelations(id: string) {
    return this.db.attempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        test: {
          include: {
            subject: true,
            category: true,
            questions: {
              include: {
                question: true,
              },
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });
  }

  // SAVE ANSWER
  async updateAttemptAnswers(id: string, answers: Prisma.InputJsonValue) {
    return this.db.attempt.update({
      where: { id },
      data: { answers },
    });
  }

  // WRITE CHEAT EVENT LOG
  async updateAttemptLogs(id: string, logs: Prisma.InputJsonValue) {
    return this.db.attempt.update({
      where: { id },
      data: { logs },
    });
  }

  // SUBMIT FINAL EXAM PAPER WITH METRICS WRITTEN ONCE
  async submitExamAttempt(
    id: string,
    score: number,
    correctCount: number,
    wrongCount: number,
    unansweredCount: number,
    timeTaken: number,
    isPassed: boolean
  ) {
    return this.db.attempt.update({
      where: { id },
      data: {
        score,
        correctCount,
        wrongCount,
        unansweredCount,
        timeTaken,
        isPassed,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  // LIST COMPLETED ATTEMPTS FOR ADMIN RESULTS DASHBOARD WITH FILTERS
  async findAllCompletedAttempts(filters: {
    subjectId?: string;
    categoryId?: string;
    testId?: string;
    search?: string;
    passStatus?: string;
  }) {
    const whereClause: Prisma.AttemptWhereInput = {
      status: "COMPLETED",
    };

    const testConditions: Prisma.TestWhereInput = {
      isDeleted: false,
    };

    if (filters.subjectId && filters.subjectId !== "all") {
      testConditions.subjectId = filters.subjectId;
    }
    if (filters.categoryId && filters.categoryId !== "all") {
      testConditions.categoryId = filters.categoryId;
    }

    whereClause.test = testConditions;
    if (filters.testId && filters.testId !== "all") {
      whereClause.testId = filters.testId;
    }
    if (filters.passStatus && filters.passStatus !== "all") {
      whereClause.isPassed = filters.passStatus === "pass";
    }
    if (filters.search) {
      whereClause.user = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    return this.db.attempt.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        test: {
          include: {
            subject: true,
            category: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });
  }
}
