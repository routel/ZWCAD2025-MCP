# AGENTS.md

## 開発方針

このリポジトリは、ZWCAD2025をMCP経由で操作するためのサーバーです。

開発時は以下を優先してください。

1. TDDで進める
2. ドメイン層をZWCAD/COM/MCPから独立させる
3. MCP toolは薄いI/O変換層にする
4. 実機依存の処理は `infrastructure` に閉じ込める
5. ZWCADなしでもCIでテストできるようにする

## ディレクトリ責務

- `src/domain`: CAD図形、座標、BoundingBox、重なり判定などの業務ルール
- `src/application`: ユースケース、ポート定義
- `src/infrastructure`: ZWCAD COM接続、インメモリ実装、外部I/O
- `src/mcp`: MCP server、tool schema、request/response変換
- `tests`: ドメイン・ユースケース中心のテスト

## 依存ルール

- `domain` は他層に依存しない
- `application` は `domain` に依存してよい
- `infrastructure` は `application` と `domain` に依存してよい
- `mcp` は `application` に依存してよい
- `domain` から `mcp` / `infrastructure` を参照しない

## 実装時の手順

1. 先にテストを書く
2. ドメインまたはユースケースを実装する
3. MCP toolへ公開する
4. READMEのtool一覧と利用例を更新する
5. `npm test` と `npm run build` を通す

## 注意点

ZWCAD COM APIは実行環境依存があるため、直接COMに密結合しないでください。COM生成処理は注入可能にし、テストではモックまたは `InMemoryCadGateway` を使ってください。
