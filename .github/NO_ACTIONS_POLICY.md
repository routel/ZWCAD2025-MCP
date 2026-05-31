# GitHub Actions利用禁止ポリシー

このリポジトリでは、GitHub Actionsのようにクラウド側の実行リソースを消費する処理を原則として使用しません。

## 禁止事項

- GitHub Actions workflow の追加
- CI/CDジョブの自動実行設定
- GitHub-hosted runner を使う検証
- 定期実行・スケジュール実行によるリソース消費

## 検証方針

- テストとビルドは開発者のローカル環境で実行する
- 自動実行が必要な場合でも、明示的な許可があるまでGitHub Actionsは使わない
- エージェントが変更する場合は、workflowファイルを作成しない
