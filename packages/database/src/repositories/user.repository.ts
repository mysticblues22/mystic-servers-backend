import { eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { users } from "../schema/users.js";

export class UserRepository {
  async create(data: typeof users.$inferInsert) {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning();

    return user;
  }

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return user ?? null;
  }

  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user ?? null;
  }

  async findByUsername(username: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return user ?? null;
  }

  async verifyUser(id: string) {
    const [user] = await db
      .update(users)
      .set({
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async updatePassword(
    id: string,
    passwordHash: string,
  ) {
    const [user] = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user;
  }
}

export const userRepository =
  new UserRepository();
