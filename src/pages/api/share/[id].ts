export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id || id.length > 10) {
      return new Response(JSON.stringify({ error: 'Invalid share code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);
    const rows = await sql`
      SELECT death_date, burial_date, after_nightfall, is_israel, lang
      FROM shares WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Share not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const row = rows[0];
    return new Response(JSON.stringify({
      deathDate: row.death_date,
      burialDate: row.burial_date,
      afterNightfall: row.after_nightfall,
      isIsrael: row.is_israel,
      lang: row.lang,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Share lookup error:', err);
    return new Response(JSON.stringify({ error: 'Failed to look up share' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
