import { BaseRepository } from "./base.repository";
import { Test, Prisma } from "@prisma/client";

export interface TestFilters {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  categoryId?: string;
  status?: string;
  type?: string;
  visibility?: string;
  showDeleted?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class TestRepository extends BaseRepository<Test> {
  // FIND BY ID
  async findById(id: string): Promise<Test | null> {
    return this.db.test.findFirst({
      where: { 
        id,
        isDeleted: false,
      },
      include: {
        subject: true,
        category: true,
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  // FIND BY ID (INCLUDING DELETED FOR SYSTEM RESTORES)
  async findByIdIncludeDeleted(id: string): Promise<Test | null> {
    return this.db.test.findFirst({
      where: { id },
      include: {
        subject: true,
        category: true,
      },
    });
  }

  // IMPLEMENT ABSTRACT FINDALL CONTRACT
  async findAll(): Promise<Test[]> {
    return this.db.test.findMany({
      where: { isDeleted: false },
      include: {
        subject: true,
        category: true,
      },
    });
  }

  // CHECK ACTIVE NAME DUPLICATES WITHIN A SUBJECT
  async findByNameAndSubject(title: string, subjectId: string): Promise<Test | null> {
    return this.db.test.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
        subjectId,
        isDeleted: false,
      },
    });
  }

  // PAGINATED & FILTERED SEARCH
  async findAllPaginatedAndFiltered(filters: TestFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TestWhereInput = {
      isDeleted: filters.showDeleted ?? false,
    };

    if (filters.subjectId && filters.subjectId !== "all") {
      where.subjectId = filters.subjectId;
    }

    if (filters.categoryId && filters.categoryId !== "all") {
      where.categoryId = filters.categoryId;
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters.type && filters.type !== "all") {
      where.type = filters.type;
    }

    if (filters.visibility && filters.visibility !== "all") {
      where.visibility = filters.visibility;
    }

    if (filters.search) {
      where.title = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    // Dynamic sorting
    const orderBy: Prisma.TestOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    if (sortBy === "subject") {
      orderBy.subject = { name: sortOrder };
    } else if (sortBy === "category") {
      orderBy.category = { name: sortOrder };
    } else {
      (orderBy as any)[sortBy] = sortOrder;
    }

    const [tests, total] = await Promise.all([
      this.db.test.findMany({
        where,
        include: {
          subject: true,
          category: true,
          _count: {
            select: { questions: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.db.test.count({ where }),
    ]);

    return {
      tests,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  // CREATE
  async create(data: Prisma.TestCreateInput): Promise<Test> {
    return this.db.test.create({
      data,
    });
  }

  // UPDATE
  async update(id: string, data: Prisma.TestUpdateInput): Promise<Test> {
    return this.db.test.update({
      where: { id },
      data,
    });
  }

  // SOFT DELETE
  async softDelete(id: string): Promise<Test> {
    return this.db.test.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // RESTORE
  async restore(id: string): Promise<Test> {
    return this.db.test.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  // DELETE PERMANENTLY (BASE CONTRACT)
  async delete(id: string): Promise<Test> {
    return this.db.test.delete({
      where: { id },
    });
  }

  // FIND ASSIGNED QUESTIONS
  async findAssignedQuestions(testId: string) {
    return this.db.testQuestion.findMany({
      where: { testId },
      include: {
        question: {
          include: {
            subject: true,
            category: true,
            _count: {
              select: { tests: true },
            },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
  }

  // FIND MAXIMUM DISPLAY ORDER
  async findMaxDisplayOrder(testId: string): Promise<number> {
    const result = await this.db.testQuestion.aggregate({
      where: { testId },
      _max: {
        displayOrder: true,
      },
    });
    return result._max.displayOrder ?? 0;
  }

  // BULK ASSIGN QUESTIONS
  async assignQuestions(testId: string, questionIds: string[], startOrder: number, defaultNegativeMark: number) {
    const data = questionIds.map((qId, idx) => ({
      testId,
      questionId: qId,
      displayOrder: startOrder + idx + 1,
      marks: 1, // Default marks weight is 1
      negativeMark: defaultNegativeMark, // Inherit base negative marking penalty by default
    }));

    return this.db.$transaction(
      data.map((item) =>
        this.db.testQuestion.upsert({
          where: {
            testId_questionId: {
              testId: item.testId,
              questionId: item.questionId,
            },
          },
          update: {},
          create: item,
        })
      )
    );
  }

  // REMOVE QUESTIONS
  async removeQuestions(testId: string, questionIds: string[]) {
    return this.db.testQuestion.deleteMany({
      where: {
        testId,
        questionId: { in: questionIds },
      },
    });
  }

  // UPDATE INDIVIDUAL QUESTION MARKS AND NEGATIVE MARKS OVERRIDES
  async updateQuestionOverrides(testId: string, questionId: string, marks: number, negativeMark: number) {
    return this.db.testQuestion.update({
      where: {
        testId_questionId: { testId, questionId },
      },
      data: {
        marks,
        negativeMark,
      },
    });
  }

  // BATCH REORDER TEST QUESTIONS SEQUENCE
  async reorderQuestions(testId: string, reorders: { questionId: string; displayOrder: number }[]) {
    return this.db.$transaction(
      reorders.map((item) =>
        this.db.testQuestion.update({
          where: {
            testId_questionId: { testId, questionId: item.questionId },
          },
          data: {
            displayOrder: item.displayOrder,
          },
        })
      )
    );
  }
}
