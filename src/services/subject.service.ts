import { SubjectRepository, SubjectFilters, CategoryFilters } from "@/repositories/subject.repository";
import { Subject, Category, Prisma } from "@prisma/client";
import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  displayOrder: z.number().int().default(0),
  subjectId: z.string().min(1, "Subject ID is required"),
});

export const updateCategorySchema = createCategorySchema.partial();

export class SubjectService {
  private subjectRepo = new SubjectRepository();

  // --- SUBJECT LOGIC ---

  async createSubject(data: z.infer<typeof createSubjectSchema>): Promise<Subject> {
    const validated = createSubjectSchema.parse(data);

    // Uniqueness check for active subjects
    const existing = await this.subjectRepo.findByName(validated.name);
    if (existing) {
      throw new Error(`Subject with name "${validated.name}" already exists`);
    }

    return this.subjectRepo.create({
      name: validated.name,
      description: validated.description || null,
      status: validated.status,
      icon: validated.icon || null,
      color: validated.color || null,
    });
  }

  async updateSubject(id: string, data: z.infer<typeof updateSubjectSchema>): Promise<Subject> {
    const validated = updateSubjectSchema.parse(data);

    // Uniqueness check if name changes
    if (validated.name) {
      const existing = await this.subjectRepo.findByName(validated.name);
      if (existing && existing.id !== id) {
        throw new Error(`Subject with name "${validated.name}" already exists`);
      }
    }

    const payload: Prisma.SubjectUpdateInput = {
      name: validated.name,
      description: validated.description,
      status: validated.status,
      icon: validated.icon,
      color: validated.color,
    };

    return this.subjectRepo.update(id, payload);
  }

  async softDeleteSubject(id: string): Promise<Subject> {
    return this.subjectRepo.softDelete(id);
  }

  async restoreSubject(id: string): Promise<Subject> {
    return this.subjectRepo.restore(id);
  }

  async getSubjectsFiltered(filters: SubjectFilters) {
    return this.subjectRepo.findAllPaginatedAndFiltered(filters);
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectRepo.findAll();
  }

  async getSubjectDetails(id: string): Promise<Subject | null> {
    return this.subjectRepo.findById(id);
  }

  // --- CATEGORY LOGIC ---

  async createCategory(data: z.infer<typeof createCategorySchema>): Promise<Category> {
    const validated = createCategorySchema.parse(data);

    // Check parent subject exists and is not deleted
    const parent = await this.subjectRepo.findById(validated.subjectId);
    if (!parent) {
      throw new Error("Subject does not exist or has been deleted");
    }

    // Uniqueness check for active categories under the same subject
    const existing = await this.subjectRepo.findCategoryByNameAndSubject(validated.name, validated.subjectId);
    if (existing) {
      throw new Error(`Category "${validated.name}" already exists under this Subject`);
    }

    return this.subjectRepo.createCategory({
      name: validated.name,
      description: validated.description || null,
      status: validated.status,
      displayOrder: validated.displayOrder,
      subject: {
        connect: { id: validated.subjectId },
      },
    });
  }

  async updateCategory(id: string, data: z.infer<typeof updateCategorySchema>): Promise<Category> {
    const validated = updateCategorySchema.parse(data);

    // Check parent subject exists if changing subjectId
    if (validated.subjectId) {
      const parent = await this.subjectRepo.findById(validated.subjectId);
      if (!parent) {
        throw new Error("Target Subject does not exist or has been deleted");
      }
    }

    // Resolve current category to retrieve current subjectId if needed
    const current = await this.subjectRepo.findCategoryById(id);
    if (!current) {
      throw new Error("Category not found");
    }

    const targetSubjectId = validated.subjectId || current.subjectId;

    // Uniqueness check if name or subject changes
    if (validated.name || validated.subjectId) {
      const checkName = validated.name || current.name;
      const existing = await this.subjectRepo.findCategoryByNameAndSubject(checkName, targetSubjectId);
      if (existing && existing.id !== id) {
        throw new Error(`Category "${checkName}" already exists under the target Subject`);
      }
    }

    const payload: Prisma.CategoryUpdateInput = {
      name: validated.name,
      description: validated.description,
      status: validated.status,
      displayOrder: validated.displayOrder,
    };

    if (validated.subjectId) {
      payload.subject = {
        connect: { id: validated.subjectId },
      };
    }

    return this.subjectRepo.updateCategory(id, payload);
  }

  async softDeleteCategory(id: string): Promise<Category> {
    return this.subjectRepo.softDeleteCategory(id);
  }

  async restoreCategory(id: string): Promise<Category> {
    // Check if the parent subject is deleted
    const category = await this.subjectRepo.findCategoryById(id);
    if (category) {
      const subject = await this.subjectRepo.findSubjectByIdIncludeDeleted(category.subjectId);
      if (subject?.isDeleted) {
        throw new Error("Cannot restore Category because its parent Subject is deleted. Restore the Subject first.");
      }
    }
    return this.subjectRepo.restoreCategory(id);
  }

  async getCategoriesFiltered(filters: CategoryFilters) {
    return this.subjectRepo.findCategoriesPaginatedAndFiltered(filters);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.subjectRepo.findAllCategories();
  }

  async getCategoryDetails(id: string): Promise<Category | null> {
    return this.subjectRepo.findCategoryById(id);
  }

  async reorderCategories(reorders: { id: string; displayOrder: number }[]) {
    // Uniqueness constraint validation on reorders array can be validated if required
    return this.subjectRepo.reorderCategories(reorders);
  }
}
