import { pgEnum, pgTable, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const playerStatusEnum = pgEnum("player_status", ["active", "injured", "suspended", "inactive"]);

export const players = pgTable("players", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId: text("org_id").notNull(),
  userId: text("user_id"),                    // Clerk user ID — nullable until player claims account
  name: text("name").notNull(),
  position: text("position"),                 // PG | SG | SF | PF | C
  jerseyNumber: integer("jersey_number"),
  grade: text("grade"),                       // "10" | "11" | "12" | "Fr" | "So" | etc.
  gradYear: integer("grad_year"),
  height: text("height"),                     // "6'1\""
  weight: integer("weight"),
  handedness: text("handedness").default("right"),
  status: playerStatusEnum("status").notNull().default("active"),
  role: text("role").default("player"),       // starter | reserve | developmental
  parentGuardianName: text("parent_guardian_name"),
  parentGuardianEmail: text("parent_guardian_email"),
  parentGuardianPhone: text("parent_guardian_phone"),
  medicalNotes: text("medical_notes"),
  // Extended profile fields
  phone:            text("phone"),
  email:            text("email"),
  bio:              text("bio"),
  recruitingStatus: text("recruiting_status"),   // "D1 Interest" | "D2 Target" | etc.
  academicNotes:    text("academic_notes"),
  yearsPlaying:     integer("years_playing"),
  /**
   * Minor classification — drives guardian-copy messaging policy.
   *
   * Defaults to TRUE (safe-by-default: treat every athlete as a minor until
   * an admin explicitly marks them as an adult or the migration seeds a value
   * from grad_year).  Set to FALSE once a player turns 18 or when the program
   * knowingly enrolls adults (e.g. college/adult leagues).
   *
   * dateOfBirth is optional; when present it can be used by a scheduled job
   * to flip isMinor automatically on the player's 18th birthday.
   */
  isMinor:          boolean("is_minor").notNull().default(true),
  dateOfBirth:      date("date_of_birth"),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
