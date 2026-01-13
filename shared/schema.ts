import { pgTable, text, integer, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
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
  mediaUrls: jsonb("media_urls"), // Array of {type: 'photo'|'video', url: string}
  photoFileIds: jsonb("photo_file_ids"), // Array of Telegram file IDs for high-res photos
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
  personality: text("personality"), // e.g., shy, playful, caring, passionate
  relationship: text("relationship"), // e.g., stranger, girlfriend, wife
  
  // Soft delete for removed posts
  deletedAt: timestamp("deleted_at"),
  
  // Media flags for filtering
  hasVideo: boolean("has_video").default(false),
  hasMultipleMedia: boolean("has_multiple_media").default(false),
  
  // Conversion tracking
  clickCount: integer("click_count").default(0),
  
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
