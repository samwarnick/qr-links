import { sql, type InferSelectModel } from 'drizzle-orm';
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';

export const links = sqliteTable(
	'links',
	{
		id: integer('id').primaryKey(),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		title: text('title').notNull(),
		notes: text('notes'),
		shortcode: text('shortcode').notNull(),
		originalUrl: text('originalUrl').notNull(),
		isPublic: integer('public', { mode: 'boolean' }).default(false),
	},
	(links) => ({
		shortcodeUrlIdx: uniqueIndex('shorcodeIdx').on(links.shortcode),
	}),
);

export type Link = InferSelectModel<typeof links>;
export const insertLinkSchema = createInsertSchema(links);
