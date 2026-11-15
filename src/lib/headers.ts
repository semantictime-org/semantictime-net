// Cloudflare の _headers（public/_headers）に関する処理（T058）。純粋関数。
// プレビューでは、検索エンジンに載らないよう全ページに X-Robots-Tag: noindex を足す。

const NOINDEX_BLOCK = '/*\n  X-Robots-Tag: noindex\n';
/** ヘッダの行（字下げあり）としての noindex。コメントの中の同じ語には反応しない */
const NOINDEX_LINE = /^\s+X-Robots-Tag: noindex\s*$/m;

export const addNoindexHeader = (headers: string): string =>
  NOINDEX_LINE.test(headers) ? headers : `${headers.trimEnd()}\n\n${NOINDEX_BLOCK}`;
