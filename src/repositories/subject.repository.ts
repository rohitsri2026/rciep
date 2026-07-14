import { BaseRepository } from "./base.repository";
import { Subject, Category, Prisma } from "@prisma/client";

export interface SubjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  showDeleted?: boolean;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  showDeleted?: boolean;
}

export class SubjectRepository extends BaseRepository<Subject> {
  // FIND BY ID
  async findById(id: string): Promise<Subject | null> {
    return this.db.subject.findFirst({
      where: { 
        id,
        isDeleted: false,
      },
      include: {
        categories: {
          where: { isDeleted: false },
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  // FIND ALL ACTIVE
  async findAll(): Promise<Subject[]> {
    return this.db.subject.findMany({
      where: { isDeleted: false },
      include: {
        categories: {
          where: { isDeleted: false },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // FIND ALL WITH PAGINATED & FILTERED
  async findAllPaginatedAndFiltered(filters: SubjectFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SubjectWhereInput = {
      isDeleted: filters.showDeleted ?? false,
    };

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const [subjects, total] = await Promise.all([
      this.db.subject.findMany({
        where,
        include: {
          categories: {
            where: { isDeleted: false },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      this.db.subject.count({ where }),
    ]);

    return {
      subjects,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  // CREATE
  async create(data: Prisma.SubjectCreateInput): Promise<Subject> {
    return this.db.subject.create({
      data,
    });
  }

  // UPDATE
  async update(id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    return this.db.subject.update({
      where: { id },
      data,
    });
  }

  // DELETE (REPLACED BY SOFT DELETE IN CONTROLLER/SERVICE, BUT KEEP FOR BASE CONTRACT)
  async delete(id: string): Promise<Subject> {
    return this.softDelete(id);
  }

  // SOFT DELETE (AND CASCADE TO CATEGORIES)
  async softDelete(id: string): Promise<Subject> {
    return this.db.$transaction(async (tx) => {
      // 1. Soft delete categories under subject
      await tx.category.updateMany({
        where: { subjectId: id, isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 2. Soft delete subject itself
      return tx.subject.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });
  }

  // RESTORE (AND RESTORE CATEGORIES)
  async restore(id: string): Promise<Subject> {
    return this.db.$transaction(async (tx) => {
      // 1. Restore categories
      await tx.category.updateMany({
        where: { subjectId: id, isDeleted: true },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      // 2. Restore subject
      return tx.subject.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
    });
  }

  // HELPERS FOR NAME CHECKS
  async findByName(name: string): Promise<Subject | null> {
    return this.db.subject.findFirst({
      where: { 
        name: { equals: name, mode: "insensitive" },
        isDeleted: false,
      },
    });
  }

  async findSubjectByIdIncludeDeleted(id: string): Promise<Subject | null> {
    return this.db.subject.findFirst({
      where: { id },
    });
  }

  // CATEGORY OPERATIONS

  async findCategoryById(id: string): Promise<Category | null> {
    return this.db.category.findFirst({
      where: { 
        id,
        isDeleted: false,
      },
      include: {
        subject: true,
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findCategoryByNameAndSubject(name: string, subjectId: string): Promise<Category | null> {
    return this.db.category.findFirst({
      where: { 
        name: { equals: name, mode: "insensitive" },
        subjectId,
        isDeleted: false,
      },
    });
  }

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.db.category.create({
      data,
    });
  }

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.db.category.update({
      where: { id },
      data,
    });
  }

  async softDeleteCategory(id: string): Promise<Category> {
    return this.db.category.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restoreCategory(id: string): Promise<Category> {
    return this.db.category.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  async findAllCategories(): Promise<Category[]> {
    return this.db.category.findMany({
      where: { isDeleted: false },
      include: {
        subject: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: [
        { subjectId: "asc" },
        { displayOrder: "asc" },
      ],
    });
  }

  async findCategoriesPaginatedAndFiltered(filters: CategoryFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      isDeleted: filters.showDeleted ?? false,
    };

    if (filters.subjectId && filters.subjectId !== "all") {
      where.subjectId = filters.subjectId;
    }

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const [categories, total] = await Promise.all([
      this.db.category.findMany({
        where,
        include: {
          subject: true,
          _count: {
            select: { questions: true },
          },
        },
        orderBy: [
          { displayOrder: "asc" },
          { name: "asc" },
        ],
        skip,
        take: limit,
      }),
      this.db.category.count({ where }),
    ]);

    return {
      categories,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  // BULK REORDER CATEGORIES
  async reorderCategories(reorders: { id: string; displayOrder: number }[]) {
    return this.db.$transaction(
      reorders.map((item) =>
        this.db.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );
  }
}
