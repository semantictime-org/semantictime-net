// 記事以外のページの OGP 画像（/og/site.png）。
import type { APIRoute } from 'astro';
import { SITE } from '../../../site.config';
import { renderOgPng } from '../../lib/og-render';

const SITE_MARK = 'HANDS-ON';

export const GET: APIRoute = async () =>
  new Response(await renderOgPng({ mark: SITE_MARK, title: SITE.tagline, sub: SITE.description }), {
    headers: { 'Content-Type': 'image/png' },
  });
