import { and, eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { sessions } from "../schema/sessions.js";

export class SessionRepository {
  async create(data: typeof sessions.$inferInsert) {
    const [session] = await db
      .insert(sessions)
      .values(data)
      .returning();

    return session;
  }

  async findByRefreshToken(
    refreshToken: string,
  ) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        eq(
          sessions.refreshToken,
          refreshToken,
        ),
      );

    return session ?? null;
  }

  async deleteByRefreshToken(
    refreshToken: string,
  ) {
    await db
      .delete(sessions)
      .where(
        eq(
          sessions.refreshToken,
          refreshToken,
        ),
      );
  }

  async deleteByUser(
    userId: string,
  ) {
    await db
      .delete(sessions)
      .where(
        eq(sessions.userId, userId),
      );
  }

  async deleteSession(
    userId: string,
    refreshToken: string,
  ) {
    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(
            sessions.refreshToken,
            refreshToken,
          ),
        ),
      );
    }
  async deleteAllByUser(
    userId: string,
  ) {
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
  }
}

export const sessionRepository =
  new SessionRepository();
