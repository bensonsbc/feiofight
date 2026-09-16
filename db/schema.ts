// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const rooms=sqliteTable("rooms",{code:text("code").primaryKey(),host:text("host").notNull(),created:integer("created").notNull(),expires:integer("expires").notNull(),state:text("state"),updated:integer("updated").notNull()});
export const members=sqliteTable("members",{id:text("id").primaryKey(),room:text("room").notNull().references(()=>rooms.code,{onDelete:"cascade"}),secret:text("secret").notNull(),name:text("name").notNull(),slot:integer("slot"),hero:text("hero"),seen:integer("seen").notNull(),input:text("input"),offer:text("offer"),answer:text("answer")},t=>[uniqueIndex("members_room_slot").on(t.room,t.slot),index("members_room_seen").on(t.room,t.seen)]);
