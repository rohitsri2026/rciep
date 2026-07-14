import { BaseRepository } from "./base.repository";
import { User, Prisma } from "@prisma/client";

export class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.delete({
      where: { id },
    });
  }

  async getUserWithAttempts(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        attempts: {
          include: {
            test: true,
          },
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });
  }
}
