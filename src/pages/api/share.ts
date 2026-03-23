export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { deathDate, burialDate, afterNightfall, isIsrael, lang } = body;

    if (!burialDate) {
      return new Response(JSON.stringify({ error: 'burialDate is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);
    const code = generateCode();

    await sql`
      INSERT INTO shares (id, death_date, burial_date, after_nightfall, is_israel, lang)
      VALUES (${code}, ${deathDate || burialDate}, ${burialDate}, ${!!afterNightfall}, ${!!isIsrael}, ${lang || 'he'})
    `;

    return new Response(JSON.stringify({ code }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    // Retry once on code collision
    if (err?.message?.includes('duplicate key')) {
      try {
        const body = await request.clone().json();
        const sql = neon(import.meta.env.DATABASE_URL);
        const code = generateCode();
        await sql`
          INSERT INTO shares (id, death_date, burial_date, after_nightfall, is_israel, lang)
          VALUES (${code}, ${body.deathDate || body.burialDate}, ${body.burialDate}, ${!!body.afterNightfall}, ${!!body.isIsrael}, ${body.lang || 'he'})
        `;
        return new Response(JSON.stringify({ code }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {}
    }
    console.error('Share create error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create share' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
