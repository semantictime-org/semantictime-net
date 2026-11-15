// /robots.txt（T060）
import type { APIRoute } from 'astro';
import { SITE } from '../../site.config';
import { buildRobotsTxt } from '../lib/robots';

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(SITE.url), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
