import { eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { passwordResetTokens } from "../schema/password-reset-tokens.js";

export class PasswordResetRepository {
  async create(
    data: typeof passwordResetTokens.$inferInsert,
  ) {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(data)
      .returning();

    return token;
  }

  async findByHash(
    tokenHash: string,
  ) {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        eq(
          passwordResetTokens.tokenHash,
          tokenHash,
        ),
      );

    return token ?? null;
  }

  async deleteByHash(
    tokenHash: string,
  ) {
    await db
      .delete(passwordResetTokens)
      .where(
        eq(
          passwordResetTokens.tokenHash,
          tokenHash,
        ),
      );
  }

  async deleteByUser(
    userId: string,
  ) {
    await db
      .delete(passwordResetTokens)
      .where(
        eq(
          passwordResetTokens.userId,
          userId,
        ),
      );
  }
}

export const passwordResetRepository =
  new PasswordResetRepository();
