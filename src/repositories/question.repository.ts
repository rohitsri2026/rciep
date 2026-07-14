import { BaseRepository } from "./base.repository";
import { Question, Prisma, Difficulty, QuestionStatus } from "@prisma/client";

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  categoryId?: string;
  difficulty?: Difficulty;
  status?: QuestionStatus;
}

export class QuestionRepository extends BaseRepository<Question> {
  async findById(id: string): Promise<Question | null> {
    return this.db.question.findUnique({
      where: { id },
      include: {
        subject: true,
        category: true,
      },
    });
  }

  async findAll(): Promise<Question[]> {
    return this.db.question.findMany({
      include: {
        subject: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.QuestionUncheckedCreateInput): Promise<Question> {
    return this.db.question.create({
      data: data as any, // Cast to handle strict signature check in base repository
    });
  }

  async update(id: string, data: Prisma.QuestionUncheckedUpdateInput): Promise<Question> {
    return this.db.question.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<Question> {
    return this.db.question.delete({
      where: { id },
    });
  }

  async findAllPaginatedAndFiltered(filters: QuestionFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};

    if (filters.search) {
      where.text = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [questions, total] = await Promise.all([
      this.db.question.findMany({
        where,
        include: {
          subject: true,
          category: true,
          _count: {
            select: { tests: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.db.question.count({ where }),
    ]);

    return {
      questions,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  async bulkCreate(data: Prisma.QuestionCreateManyInput[]) {
    return this.db.question.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
