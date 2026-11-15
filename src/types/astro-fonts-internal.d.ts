// Astro の内部モジュール（src/pages/fonts.css.ts で使う）の型
declare module 'virtual:astro:assets/fonts/internal' {
  export const componentDataByCssVariable: ReadonlyMap<
    string,
    { readonly css: string; readonly preloads: readonly { readonly url: string; readonly type: string }[] }
  >;
}
