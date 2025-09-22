import { pgTable, uuid, text, timestamp, integer, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description'),
  authorId: uuid('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byAuthor: index('idx_polls_author').on(t.authorId),
  byCreatedAt: index('idx_polls_created_at').on(t.createdAt),
}))

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  pollId: uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  position: integer('position').notNull().default(0),
}, (t) => ({
  byPoll: index('idx_poll_options_poll_id').on(t.pollId),
  byPosition: index('idx_poll_options_position').on(t.pollId, t.position),
}))

export const pollVotes = pgTable('poll_votes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  pollId: uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId: uuid('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqUserPoll: unique('uniq_vote_per_user_per_poll').on(t.userId, t.pollId),
  byPoll: index('idx_poll_votes_poll_id').on(t.pollId),
  byOption: index('idx_poll_votes_option_id').on(t.optionId),
  byUser: index('idx_poll_votes_user_id').on(t.userId),
}))

