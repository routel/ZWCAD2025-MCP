# 引継ぎ資料

最終更新: 2026-05-31

## プロジェクト概要

このリポジトリは、ZWCAD2025をAIエージェントから操作するためのMCPサーバーを実装するプロジェクトです。

当初はTypeScript製MCPサーバーからZWCAD COM/ActiveXを直接操作する案も含めていましたが、現在の正式方針は以下です。

```text
AIエージェント
  ↓
MCP Server
  ↓ Named Pipe / JSON request
ZWCAD2025内 C#.NET常駐ブリッジ
  ↓ ZWCAD .NET API
現在開いている図面
```

## 本日の主な決定事項

### 1. ZWCAD側はC#.NET常駐ブリッジ方式にする

ZWCADのコマンドラインへ都度コマンド文字列を投入する方式ではなく、ZWCAD内にC#.NETアドインDLLをロードし、内部でNamed Pipeサーバーを常駐させる方式を採用します。

理由:

- コマンド方式は引数・戻り値・エラー処理が文字列寄りになりやすい
- MCPとの連携ではJSON request/responseの方が扱いやすい
- エージェントによる連続操作や状態確認に向く
- ZWCAD .NET APIによりDocumentLock / Transactionを使った安全な図面操作が可能

### 2. CommandMethodは管理用途に限定する

ZWCADの `CommandMethod` は、主たる図面操作には使いません。

使う場合は以下のような管理用途に限定します。

- `MCPBRIDGE_START`
- `MCPBRIDGE_STOP`
- `MCPBRIDGE_STATUS`

実際の操作はNamed Pipeで受け取ったJSON命令をC#.NET側でdispatchして実行します。

### 3. GitHub Actionsなどのリソース消費処理は禁止

このリポジトリではGitHub Actions / GitHub-hosted runner / scheduled workflow など、クラウド側の実行リソースを消費する処理は追加しません。

検証はローカル実行前提です。

## 完了済みIssue

### Issue #1: ZWCAD2025操作用MCPサーバーの初期実装

完了内容:

- MCP stdio server追加
- `zwcad_add_line` 追加
- `zwcad_insert_block` 追加
- `zwcad_analyze_drawing` 追加
- `zwcad_resolve_overlaps` 追加
- DDD構成の初期整理
- `InMemoryCadGateway` 追加
- `ZwcadComGateway` 骨格追加
- README / AGENTS.md 追加

備考:

- 空リポジトリ初期化のためmainへ直接反映済み
- COM実装は今後experimental扱いにする予定

### Issue #2: ローカル専用のMCP疎通確認スクリプトを追加する

完了内容:

- `npm run smoke` 追加
- `scripts/smoke.ts` 追加
- インメモリ実装で線分追加、ブロック挿入、図面分析、重なり解消を確認可能にした
- GitHub Actionsは使っていない

### Issue #4: 図面オブジェクト一覧取得ツールを追加する

完了内容:

- `DrawingService.listObjects` 追加
- `zwcad_list_objects` 追加
- `kind` / `layer` / `limit` フィルタ追加
- READMEに利用例を追加
- ユースケーステスト追加

## 未完了Issue

### Issue #6: ZWCAD2025 C#.NET常駐ブリッジ方式を設計・実装する

現在の最重要タスクです。

目的:

- C#.NETアドインDLLをZWCADへロードする
- ZWCAD内でNamed Pipeサーバーを常駐させる
- MCPサーバーからJSON命令を受け取る
- ZWCAD .NET APIで図面を操作する
- TypeScript側に `ZwcadBridgeGateway` を追加する

初期対象メソッド:

- `addLine`
- `insertBlock`
- `listObjects`
- `moveObject`
- `getStatus`

## 現在のコード構成

```text
src/
  domain/
    cadObject.ts
    geometry.ts
    overlap.ts
  application/
    cadGateway.ts
    drawingService.ts
  infrastructure/
    inMemoryCadGateway.ts
    zwcadComGateway.ts
  mcp/
    schemas.ts
    server.ts
scripts/
  smoke.ts
.github/
  NO_ACTIONS_POLICY.md
```

## 今後の推奨作業順

### 1. C#.NETブリッジプロジェクト雛形を追加

追加予定:

```text
csharp/
  ZwcadMcpBridge/
    ZwcadMcpBridge.csproj
    Extension/
      ZwcadMcpExtension.cs
    Bridge/
      PipeServer.cs
      RequestDispatcher.cs
      BridgeOptions.cs
    Cad/
      CadOperationService.cs
      CadDocumentContext.cs
    Dtos/
      CadRequest.cs
      CadResponse.cs
      Point3dDto.cs
      BoundingBoxDto.cs
      CadObjectDto.cs
      AddLineRequest.cs
      InsertBlockRequest.cs
      MoveObjectRequest.cs
```

### 2. DTOとプロトコルを先に固める

C#側とTypeScript側が同じJSON形式を使うため、以下を先に定義します。

リクエスト例:

```json
{
  "id": "req-001",
  "method": "addLine",
  "params": {
    "start": { "x": 0, "y": 0, "z": 0 },
    "end": { "x": 100, "y": 0, "z": 0 },
    "layer": "0"
  }
}
```

レスポンス例:

```json
{
  "id": "req-001",
  "ok": true,
  "result": {
    "id": "1A2B",
    "kind": "line",
    "layer": "0"
  }
}
```

### 3. TypeScript側に `ZwcadBridgeGateway` を追加

`CadGateway` は維持し、実装だけ差し替えます。

```text
ZWCAD_MCP_MODE=memory  -> InMemoryCadGateway
ZWCAD_MCP_MODE=bridge  -> ZwcadBridgeGateway
ZWCAD_MCP_MODE=com     -> ZwcadComGateway experimental
```

### 4. COM実装の扱いを整理

`ZwcadComGateway` は短期検証用またはexperimental扱いに変更します。

C#.NETブリッジが安定した段階で、削除または `experimental/` への移動を検討してください。

## ローカル確認コマンド

```bash
npm install
npm test
npm run build
npm run smoke
```

GitHub Actionsは使わないでください。

## 注意事項

- ZWCAD実機依存のテストは、GitHub上では実行しない
- C#側のDispatcher / DTO / protocol部分はZWCADに依存しない形で単体テスト可能にする
- 図面DB操作は `DocumentLock` + `Transaction` を徹底する
- Named Pipe受信スレッドから直接危険なCAD操作を行わない設計を意識する
- 初期実装では単純な同期request/responseでよい

## 次回開始時に見る場所

1. Issue #6
2. `docs/HANDOFF.md`
3. `README.md`
4. `AGENTS.md`
5. `src/application/cadGateway.ts`
6. `src/infrastructure/inMemoryCadGateway.ts`
