import { UserRepository } from "@/repositories/user.repository";
import { Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional(),
});

export class UserService {
  private userRepo = new UserRepository();

  async registerUser(data: z.infer<typeof createUserSchema>): Promise<User> {
    const validatedData = createUserSchema.parse(data);

    // Validate email uniqueness
    const existingUser = await this.userRepo.findByEmail(validatedData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    return this.userRepo.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role || Role.STUDENT,
    });
  }

  async getUserProfile(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async getUserDashboardData(id: string) {
    const userWithAttempts = await this.userRepo.getUserWithAttempts(id);
    if (!userWithAttempts) {
      throw new Error("User not found");
    }

    const attemptsCount = userWithAttempts.attempts.length;
    const completedAttempts = userWithAttempts.attempts.filter((a) => a.status === "COMPLETED");
    const averageScore = completedAttempts.length > 0
      ? completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedAttempts.length
      : 0;

    return {
      user: {
        id: userWithAttempts.id,
        name: userWithAttempts.name,
        email: userWithAttempts.email,
        role: userWithAttempts.role,
        image: userWithAttempts.image,
      },
      stats: {
        attemptsCount,
        completedCount: completedAttempts.length,
        averageScore: parseFloat(averageScore.toFixed(2)),
      },
      recentAttempts: userWithAttempts.attempts.slice(0, 5),
    };
  }
}
