# AGENTS.md

## 開発方針

このリポジトリは、ZWCAD2025をMCP経由で操作するためのサーバーです。

現在の正式方針は、ZWCAD2025内にC#.NET常駐ブリッジをロードし、MCPサーバーとはNamed Pipe + JSON request/responseで連携する方式です。ZWCADコマンドラインへ都度コマンド文字列を投入する方式は主経路にしません。

開発時は以下を優先してください。

1. TDDで進める
2. ドメイン層をZWCAD/COM/MCPから独立させる
3. MCP toolは薄いI/O変換層にする
4. 実機依存の処理は `infrastructure` または `csharp/ZwcadMcpBridge` に閉じ込める
5. ZWCADなしでもローカル環境でテストできるようにする
6. GitHub Actionsなど、クラウド側の実行リソースを消費する仕組みは追加しない
7. COM直接操作はexperimental扱いとし、C#.NET常駐ブリッジを優先する

## ディレクトリ責務

- `src/domain`: CAD図形、座標、BoundingBox、重なり判定などの業務ルール
- `src/application`: ユースケース、ポート定義
- `src/infrastructure`: インメモリ実装、C#.NETブリッジGateway、experimental COM接続
- `src/mcp`: MCP server、tool schema、request/response変換
- `csharp/ZwcadMcpBridge`: ZWCAD2025内で常駐するC#.NET Named Pipeブリッジ
- `docs`: 引継ぎ資料、設計メモ、手動検証手順
- `tests`: ドメイン・ユースケース中心のテスト

## 依存ルール

- `domain` は他層に依存しない
- `application` は `domain` に依存してよい
- `infrastructure` は `application` と `domain` に依存してよい
- `mcp` は `application` に依存してよい
- `domain` から `mcp` / `infrastructure` を参照しない
- C#側ではDTO / Dispatcher / protocolをZWCAD APIから分離する
- ZWCAD .NET APIに依存する処理は `CadOperationService` のような薄い層に閉じ込める

## 実装時の手順

1. 先にテストを書く
2. ドメインまたはユースケースを実装する
3. MCP toolへ公開する
4. READMEのtool一覧と利用例を更新する
5. `npm test` と `npm run build` をローカルで実行できる状態にする
6. C#側はZWCAD非依存のDTO / Dispatcher / protocol部分を先に固める
7. ZWCAD実機依存部分は手動検証手順をREADMEまたはdocsに残す

## C#.NET常駐ブリッジ方針

ZWCAD2025側にはC#.NETアドインDLLをロードし、内部でNamed Pipeサーバーを常駐させます。

```text
AIエージェント
  ↓
MCP Server
  ↓ Named Pipe / JSON request
ZWCAD2025内 C#.NET常駐ブリッジ
  ↓ ZWCAD .NET API
現在開いている図面
```

初期対象メソッド:

- `addLine`
- `insertBlock`
- `listObjects`
- `moveObject`
- `getStatus`

ZWCADのCommandMethodは主操作経路にはせず、使う場合は `MCPBRIDGE_START` / `MCPBRIDGE_STOP` / `MCPBRIDGE_STATUS` のような管理用途に限定してください。

## リソース利用ポリシー

- GitHub Actions workflowを追加しない
- GitHub-hosted runnerを使わない
- 定期実行や自動CIを設定しない
- 検証はローカル実行を前提にする

## 注意点

- COM直接操作は実装の本命ではありません。今後はexperimental扱いに整理してください。
- 図面DB操作では `DocumentLock` + `Transaction` を徹底してください。
- Named Pipe受信スレッドから危険なCAD操作を直接行わない設計を意識してください。
- 次回作業開始時は `docs/HANDOFF.md` と Issue #6 を確認してください。
