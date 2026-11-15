// 書体の @font-face をまとめた静的な CSS（/fonts.css）。
// Astro の <Font> は @font-face をページの HTML に直接埋め込む。日本語の書体は数百の断片に分かれるため、
// 埋め込むと 1 ページが gzip で約 94KB 増え、キャッシュも効かない。そこで同じ CSS を外部ファイルに出す。
// componentDataByCssVariable は Astro の内部モジュール（astro 7.4.12 で確認）。版を上げて消えたらビルドが失敗する。
import type { APIRoute } from 'astro';
import { componentDataByCssVariable } from 'virtual:astro:assets/fonts/internal';

export const GET: APIRoute = () =>
  new Response([...componentDataByCssVariable.values()].map((d) => d.css).join('\n'), {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
