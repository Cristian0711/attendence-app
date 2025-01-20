import { pgTable, serial, varchar, timestamp, integer, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  username: varchar('username').notNull().unique(),
  password: varchar('password').notNull(),
  jwtid: varchar('jwtid'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull().unique(),
});

export const eventGroups = pgTable('event_groups', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name').notNull(),
  description: varchar('description'),
  isRecurring: boolean('is_recurring').notNull().default(false),

  recurrencePattern: varchar('recurrence_pattern'), 
  recurrenceInterval: integer('recurrence_interval'), 
  recurrenceEndDate: timestamp('recurrence_end_date'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  eventGroupId: integer('event_group_id').references(() => eventGroups.id),
  userId: integer('user_id').notNull().references(() => users.id), 
  name: varchar('name').notNull(),
  description: varchar('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  accessCode: varchar('access_code').notNull(),
});

export const usersToRoles = pgTable('users_to_roles', {
  userId: integer('user_id').notNull().references(() => users.id),
  roleId: integer('role_id').notNull().references(() => roles.id),
}, (table) => ({
  pk: primaryKey(table.userId, table.roleId),
}));

export const usersToEvents = pgTable('users_to_events', {
  userId: integer('user_id').notNull().references(() => users.id),
  eventId: integer('event_id').notNull().references(() => events.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey(table.userId, table.eventId),
}));

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(usersToRoles),
  eventGroups: many(eventGroups),
  events: many(events),
  registeredEvents: many(usersToEvents),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(usersToRoles),
}));

export const eventGroupsRelations = relations(eventGroups, ({ many, one }) => ({
  events: many(events),
  creator: one(users, { fields: [eventGroups.userId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  eventGroup: one(eventGroups, { fields: [events.eventGroupId], references: [eventGroups.id] }),
  creator: one(users, { fields: [events.userId], references: [users.id] }),
  attendees: many(usersToEvents),
}));

export const selectEventGroupSchema = createSelectSchema(eventGroups);
export const insertEventGroupSchema = createInsertSchema(eventGroups);

export const selectEventSchema = createSelectSchema(events);
export const insertEventSchema = createInsertSchema(events);

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
export type EventGroup = InferSelectModel<typeof eventGroups>;
export type NewEventGroup = InferInsertModel<typeof eventGroups>;