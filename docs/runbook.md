# 運用の手順書

## 本番を前の版に戻す（ロールバック）

本番（semantictime.net）に問題のある版が出たときの手順。設計書 9.1。

1. デプロイを止める：GitHub の Settings → Secrets and variables → Actions → Variables で、リポジトリ変数 `DEPLOY_PAUSED` を `true` にする。
2. 直前の版を確かめて戻す（手元のターミナルで。トークンは `read -s` で入れ、画面と履歴に残さない）。

   ```bash
   read -s CLOUDFLARE_API_TOKEN && export CLOUDFLARE_API_TOKEN
   export CLOUDFLARE_ACCOUNT_ID=64684d90d0b53cacb8541b10884e14fa
   npx wrangler deployments list --config wrangler.jsonc
   npx wrangler rollback <version-id> --config wrangler.jsonc
   ```

3. 原因の commit を revert するブランチ（`fix/revert-…`）を push し、PR をマージする。
4. `DEPLOY_PAUSED` を `false` に戻す。次の main への push でデプロイが再開する。止めていた間にマージした記事もまとめて公開される（公開日の検査は行われる）。

## デプロイを一時的に止める

- `DEPLOY_PAUSED` を `true` にすると、main に push しても deploy.yml は何もしない。
- 週次の再ビルド（stale-check.yml）も、`DEPLOY_PAUSED` が `true` の間は止まる。

## 秘密情報の置き場所

| 値 | 置き場所 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN_PREVIEW` | Environment `preview` の secret。Worker `semantictime-preview` だけをデプロイできるトークン（Individual Workers Editor） |
| `CLOUDFLARE_API_TOKEN_PROD` | Environment `production` の secret（main からだけ使える） |
| `CLOUDFLARE_ACCOUNT_ID` | 両方の Environment の variable（秘密ではない） |
| `REAL_NAME_PATTERNS` | リポジトリの secret（1行1パターン。実名と雇用先のアカウント名） |

トークンは、Worker の設定画面（Settings → Builds → API token for external CI/CD）で、その Worker 専用のものを作る。
同じ Cloudflare アカウントにほかのプロジェクトの Worker があるので、アカウント全体に効くトークンは使わない。
Worker 専用のトークンでは Worker を新しく作れないので、新しい Worker はダッシュボードで先に作っておく。
