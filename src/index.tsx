import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import * as QRCode from 'qrcode';
import { z } from 'zod';
import { db } from './db/db';
import { links } from './db/schema';
import { Layout } from './layout';
import { generateShortcode } from './utils/shortcode';
import { takeUniqueOrThrow } from './utils/drizzle';

const app = new Hono();

app.use(logger());

app.use(
	'/assets/*',
	serveStatic({
		root: './',
		rewriteRequestPath: (path) => path.replace(/^\/assets/, '/src/assets'),
	}),
);

app.use(
	'/code/*',
	serveStatic({
		root: './',
		rewriteRequestPath: (path) => path.replace(/^\/code/, '/codes'),
	}),
);

app.use(
	'/admin/*',
	basicAuth({
		username: Bun.env.ADMIN_USERNAME,
		password: Bun.env.ADMIN_PASSWORD,
	}),
);

app.get('/admin', async (c) => {
	const allLinks = await db.select().from(links);
	return c.html(
		<Layout>
			<ul id="links">
				{allLinks.map((l) => (
					<li>
						<a href={`/admin/${l.shortcode}`}>{l.title}</a>
						<img src={`/code/${l.shortcode}.png`} alt="" />
					</li>
				))}
			</ul>
			<a href="admin/new">Add New</a>
		</Layout>,
	);
});

app.get('/admin/new', async (c) => {
	return c.html(
		<Layout>
			<form hx-post="/admin/new">
				<label htmlFor="name">Title</label>
				<input name="title" type="text" placeholder="Title" />
				<label htmlFor="originalUrl">URL</label>
				<input name="originalUrl" type="text" placeholder="URL" />
				<label htmlFor="notes">Notes</label>
				<textarea name="notes" id="notes"></textarea>
				<label>
					<input type="checkbox" name="isPublic" id="public" />
					Public
				</label>
				<input type="submit" value="Submit" />
			</form>
		</Layout>,
	);
});
app.post(
	'/admin/new',
	zValidator(
		'form',
		z.object({
			title: z.string(),
			originalUrl: z.string(),
			notes: z.string().optional(),
			isPublic: z
				.string()
				.optional()
				.transform((value) => value === 'on'),
		}),
	),
	async (c) => {
		const { title, notes, originalUrl, isPublic } = c.req.valid('form');
		try {
			const shortcode = generateShortcode();
			const shortUrl = `${Bun.env.DOMAIN}/${shortcode}`;
			await db.insert(links).values({
				title,
				notes,
				shortcode,
				originalUrl,
				isPublic,
			});
			await QRCode.toFile(`./codes/${shortcode}.png`, shortUrl);
			c.header('HX-Redirect', '/admin');
			return c.body(null, 200);
		} catch (e) {
			console.log(e.message);
			return c.json({}, 500);
		}
	},
);

app.get('/admin/:shortcode', async (c) => {});
app.patch('/admin/:shortcode', async (c) => {});
app.delete('/admin/:shortcode', async (c) => {});

app.get(
	'/protected/:shortcode',
	basicAuth({
		username: Bun.env.ADMIN_USERNAME,
		password: Bun.env.ADMIN_PASSWORD,
	}),
	async (c) => {
		const shortcode = c.req.param('shortcode');
		const link = await db
			.select()
			.from(links)
			.where(eq(links.shortcode, shortcode))
			.then(takeUniqueOrThrow);

		return c.redirect(link.originalUrl);
	},
);

app.get('/:shortcode', async (c) => {
	const shortcode = c.req.param('shortcode');
	const link = await db
		.select()
		.from(links)
		.where(eq(links.shortcode, shortcode))
		.then(takeUniqueOrThrow);

	if (!link.isPublic) {
		return c.redirect(`/protected/${shortcode}`);
	}

	return c.redirect(link.originalUrl);
});

export default app;
