import { db } from "@/lib/db";

export abstract class BaseRepository<T> {
  protected db = db;

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(data: unknown): Promise<T>;
  abstract update(id: string, data: unknown): Promise<T>;
  abstract delete(id: string): Promise<T>;
}
