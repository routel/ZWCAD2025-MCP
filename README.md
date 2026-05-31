# ZWCAD2025 MCP Server

ZWCAD 2025をAIエージェントから操作するためのModel Context Protocol（MCP）サーバーです。

このリポジトリでは、ZWCADへの直接操作を `CadGateway` として抽象化し、MCP層・ユースケース層・ドメイン層・インフラ層を分離しています。ZWCADがインストールされていないローカル環境でも、インメモリアダプタを使ってTDDで仕様を検証できます。

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
| `zwcad_analyze_drawing` | 図面内オブジェクトの種別・レイヤー・重なり候補を分析 |
| `zwcad_resolve_overlaps` | 重なり解消の移動案を作成。`apply=true` で実際に移動 |

## アーキテクチャ

```text
src/
  domain/          CADオブジェクト、座標、BoundingBox、重なり判定などの純粋なドメイン
  application/     ユースケースとCadGatewayポート
  infrastructure/  ZWCAD COMアダプタ、インメモリアダプタ
  mcp/             MCP server、tool schema
```

依存方向は以下です。

```text
MCP -> Application -> Domain
Infrastructure -> Application/Domain
```

## セットアップ

```bash
npm install
npm test
npm run build
```

> このリポジトリではGitHub Actionsなどのクラウド実行リソースを使いません。検証はローカル環境で実行してください。

## 起動

### ZWCAD実機に接続する場合

```bash
npm run build
node dist/index.js
```

既定では `ZWCAD.Application` のCOM Program IDを使います。環境により異なる場合は次のように指定してください。

```bash
ZWCAD_COM_PROGRAM_ID=ZWCAD.Application node dist/index.js
```

> 注意: Node.jsからCOMを扱うための実体生成はWindows環境・利用ライブラリに依存します。初期実装では `ZwcadComGateway` に `comFactory` を注入できる設計にし、COM接続部を差し替え可能にしています。

### ZWCADなしでMCP動作確認する場合

```bash
ZWCAD_MCP_MODE=memory npm run dev
```

## MCPクライアント設定例

```json
{
  "mcpServers": {
    "zwcad2025": {
      "command": "node",
      "args": ["/path/to/ZWCAD2025-MCP/dist/index.js"],
      "env": {
        "ZWCAD_COM_PROGRAM_ID": "ZWCAD.Application"
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
- ZWCAD COM連携は契約テストを先に作り、実機検証でアダプタを補強する
- MCP層は入力schemaとユースケース呼び出しの薄い変換層に留める
- GitHub Actionsなどの自動実行リソースは使わない

## 今後の拡張候補

- COM生成ライブラリ（例: Windows専用ActiveX bridge）の正式採用
- ZWCAD上の選択セット取得
- ブロック定義一覧取得
- レイヤー作成・切替
- 寸法線・円・ポリライン・テキスト作成
- 図面内オブジェクトの自然言語要約
- 重なり解消アルゴリズムの改善（優先度、固定オブジェクト、移動禁止レイヤー対応）
