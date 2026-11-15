// 変更表（ChangeTable）の絞り込みの判定。ブラウザの小さなスクリプトから使う（純粋関数）。

export interface ChangeRow {
  readonly product: string;
  readonly breaking: boolean;
}

export interface ChangeFilter {
  /** 選んだ製品。空なら全製品 */
  readonly products: readonly string[];
  readonly breakingOnly: boolean;
}

export const isChangeVisible = (row: ChangeRow, filter: ChangeFilter): boolean =>
  (filter.products.length === 0 || filter.products.includes(row.product)) &&
  (!filter.breakingOnly || row.breaking);
