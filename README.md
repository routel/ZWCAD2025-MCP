# ZWCAD2025 MCP Server

ZWCAD 2025をAIエージェントから操作するためのModel Context Protocol（MCP）サーバーです。

このリポジトリでは、ZWCADへの直接操作を `CadGateway` として抽象化し、MCP層・ユースケース層・ドメイン層・インフラ層を分離しています。ZWCADがインストールされていないローカル環境でも、インメモリアダプタを使ってTDDで仕様を検証できます。

現在の正式方針は、ZWCAD2025内にC#.NET常駐ブリッジを置き、MCPサーバーとはNamed Pipe + JSON request/responseで連携する方式です。既存のCOMアダプタは初期検証用の骨格であり、今後はexperimental扱いに整理します。

## 想定するエージェント指示

- `1,1,0 座標にブロックを追加して`
- `線を描いて`
- `図面の内容を分析して`
- `重なっているオブジェクトを重ならないように移動させて`

## 提供ツール

| MCP tool | 用途 |
| --- | --- |
| `zwcad_add_line` | 現在図面へ線分を追加 |
| `zwcad_insert_block` | 現在図面へブロックを挿入 |
| `zwcad_list_objects` | 現在図面のオブジェクト一覧を取得 |
| `zwcad_analyze_drawing` | 図面内オブジェクトの種別・レイヤー・重なり候補を分析 |
| `zwcad_resolve_overlaps` | 重なり解消の移動案を作成。`apply=true` で実際に移動 |

## アーキテクチャ

```text
AIエージェント
  ↓
MCP Server
  ↓ Named Pipe / JSON request
ZWCAD2025内 C#.NET常駐ブリッジ
  ↓ ZWCAD .NET API
現在開いている図面
```

```text
src/
  domain/          CADオブジェクト、座標、BoundingBox、重なり判定などの純粋なドメイン
  application/     ユースケースとCadGatewayポート
  infrastructure/  インメモリアダプタ、C#.NETブリッジGateway、experimental COMアダプタ
  mcp/             MCP server、tool schema
csharp/
  ZwcadMcpBridge/  ZWCAD2025内で常駐するC#.NET Named Pipeブリッジ（予定）
docs/
  HANDOFF.md       作業引継ぎ資料
```

依存方向は以下です。

```text
MCP -> Application -> Domain
Infrastructure -> Application/Domain
C#.NET Bridge -> ZWCAD .NET API
```

## セットアップ

```bash
npm install
npm test
npm run build
```

> このリポジトリではGitHub Actionsなどのクラウド実行リソースを使いません。検証はローカル環境で実行してください。

## ローカル疎通確認

ZWCADを起動せず、インメモリアダプタで主要ユースケースを確認できます。

```bash
npm run smoke
```

このスクリプトでは以下を順番に実行し、結果をJSONで出力します。

1. 線分追加
2. ブロック挿入
3. 図面分析
4. 重なり解消案作成
5. 重なり解消適用
6. 再分析

最後の分析で重なりが残っている場合は終了コード `1` を返します。

## 起動

### ZWCADなしでMCP動作確認する場合

```bash
ZWCAD_MCP_MODE=memory npm run dev
```

### C#.NET常駐ブリッジ方式で接続する場合（予定）

今後の実装では、ZWCAD2025へC#.NETブリッジDLLをロードし、MCPサーバー側はNamed Pipe経由で接続します。

```bash
ZWCAD_MCP_MODE=bridge npm run dev
```

pipe名の初期案:

```text
ZWCAD2025_MCP_BRIDGE
```

### COM直接接続方式（experimental）

COM直接接続は初期検証用です。C#.NET常駐ブリッジ方式が安定した段階で、非推奨化または削除します。

```bash
ZWCAD_MCP_MODE=com ZWCAD_COM_PROGRAM_ID=ZWCAD.Application node dist/index.js
```

## MCPクライアント設定例

```json
{
  "mcpServers": {
    "zwcad2025": {
      "command": "node",
      "args": ["/path/to/ZWCAD2025-MCP/dist/index.js"],
      "env": {
        "ZWCAD_MCP_MODE": "bridge"
      }
    }
  }
}
```

## tool呼び出し例

### 線分追加

```json
{
  "start": { "x": 0, "y": 0, "z": 0 },
  "end": { "x": 100, "y": 0, "z": 0 },
  "layer": "0"
}
```

### 1,1,0 座標にブロックを追加

```json
{
  "name": "VALVE",
  "insertionPoint": { "x": 1, "y": 1, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 },
  "rotation": 0
}
```

### 図面オブジェクト一覧を取得

```json
{
  "kind": "block",
  "layer": "equipment",
  "limit": 50
}
```

`kind`、`layer`、`limit` は任意です。条件を指定しない場合は全オブジェクトを返します。

### 図面分析

```json
{}
```

### 重なり解消案を作成

```json
{
  "spacing": 20,
  "apply": false
}
```

### 重なり解消を実行

```json
{
  "spacing": 20,
  "apply": true
}
```

## TDD方針

- ドメインロジックはZWCADに依存させない
- ユースケースは `InMemoryCadGateway` でテストする
- C#.NETブリッジはDTO / Dispatcher / protocolをZWCAD APIから分離してテスト可能にする
- ZWCAD実機依存テストはローカル手動検証として扱う
- MCP層は入力schemaとユースケース呼び出しの薄い変換層に留める
- GitHub Actionsなどの自動実行リソースは使わない

## 今後の拡張候補

- C#.NET常駐ブリッジプロジェクトの追加
- TypeScript側 `ZwcadBridgeGateway` の追加
- Named Pipe request/response protocolの確定
- ZWCAD上の選択セット取得
- ブロック定義一覧取得
- レイヤー作成・切替
- 寸法線・円・ポリライン・テキスト作成
- 図面内オブジェクトの自然言語要約
- 重なり解消アルゴリズムの改善（優先度、固定オブジェクト、移動禁止レイヤー対応）
