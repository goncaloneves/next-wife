import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Telegram posts table for storing girlfriend profiles
export const telegramPosts = pgTable("telegram_posts", {
  id: text("id").primaryKey(), // Telegram post ID
  channel: text("channel").notNull().default("nextwife_ai"),
  text: text("text"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  link: text("link"),
  media: text("media"),
  avatar: text("avatar"),
  botLink: text("bot_link"),
  
  // Profile fields
  name: text("name"),
  age: integer("age"),
  nationality: text("nationality"),
  hometown: text("hometown"),
  work: text("work"),
  
  // Derived fields for filtering
  region: text("region"),
  ageBracket: text("age_bracket"),
  occupationCategory: text("occupation_category"),
  language: text("language"),
  about: text("about"), // Brief explanation of interests
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  channelDateIdx: index("channel_date_idx").on(table.channel, table.date),
  regionIdx: index("region_idx").on(table.region),
  ageBracketIdx: index("age_bracket_idx").on(table.ageBracket),
  workIdx: index("work_idx").on(table.work),
}));

// Insert schema
export const insertTelegramPostSchema = createInsertSchema(telegramPosts).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type TelegramPost = typeof telegramPosts.$inferSelect;
export type InsertTelegramPost = z.infer<typeof insertTelegramPostSchema>;
