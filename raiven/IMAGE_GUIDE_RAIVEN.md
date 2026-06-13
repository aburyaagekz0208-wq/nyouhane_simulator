# 画像差し替えガイド

`public/images/` には現在、差し替え前提の **プレースホルダー画像** が入っています。  
公開前に、許可を得た公式画像へ差し替えてください。

---

## 大前提（必読）

- 掲載できるのは **本人・店舗・撮影者の許可を得た画像のみ**。
- 公式SNSに載っている画像でも、Webサイトへの転載は **別途許諾が安全**です。
- 外部画像URLの **ホットリンク（直リンク）禁止**。必ず `public/images/` にローカル配置。
- 許可状況は `data/assets.json`（素材台帳）に記録。
- 退店・卒業・掲載停止依頼があれば **速やかに削除** できるよう、IDで管理。

---

## 現在のプレースホルダーと対応

| ファイル名 | 用途 | 推奨比率 | 使用ページ |
|---|---|---|---|
| `RAIVEN_group_01_hero.png` | トップHero / OG画像 | 8:5（1600×1000） | index, og |
| `RAIVEN_store_01_interior.png` | コンセプトの店内写真 | 8:5〜任意 | index |
| `RAIVEN_cast_placeholder.png` | キャスト写真（共通仮） | 3:4（900×1200） | casts, index |
| `RAIVEN_promo_placeholder.png` | イベント告知 | 4:5（1200×1500） | events, index |
| `RAIVEN_remote_01.png` | 遠隔応援イメージ | 16:9（1600×900） | remote, index |

> Cast / Event は現在すべて共通プレースホルダーを参照しています。差し替え時は個別ファイルへ分けてください。

---

## ファイル名のルール（ID命名）

```
RAIVEN_[カテゴリ]_[連番]_[用途またはキャスト].webp
```

カテゴリ: `store / cast / promo / menu / group / remote / recruit`

例:
```
RAIVEN_group_01_hero.webp
RAIVEN_cast_01_shirai.webp
RAIVEN_cast_02_mii.webp
RAIVEN_promo_01_nurse.webp
```

> 推奨フォーマットは軽量な **WebP**。PNG/JPGでも動作しますが、その場合は下記「拡張子」を合わせてください。

---

## 差し替え手順

### A. キャスト写真を個別に差し替える
1. 許可済み写真を `RAIVEN_cast_01_shirai.webp` のようにリネームし、`public/images/` に置く。
2. `data/site-data.js` の該当キャストの `image_id` を拡張子なしで指定：`image_id: "RAIVEN_cast_01_shirai"`。
3. 画像が WebP なら、`site-data.js` 末尾の `imageExt` を `".webp"` にする（※全画像の拡張子を揃える前提）。  
   一部だけ拡張子が違う場合は、PNG/WebPを混在させず、すべて同じ拡張子に統一するのが安全です。
4. `data/casts.json` と `data/assets.json`（許可状況・alt）も更新。
5. PC・スマホで顔が切れていないか確認（CSSは `object-position: center top`。必要なら個別調整）。

### B. イベント画像を差し替える
1. `RAIVEN_promo_01_nurse.webp` 等で配置。
2. `data/site-data.js` / `data/events.json` の該当イベント `image_id` を更新。
3. `data/assets.json` に許可・altを記録。終了後はアーカイブ。

### C. Hero / 店内 / 遠隔（固定画像）を差し替える
これらは HTML に直接 `src` が書かれています。同名で上書きするのが最も簡単です。  
別名にする場合は、以下のHTML内 `src` を書き換えてください。
- Hero: `index.html` の `.hero__media img`
- 店内: `index.html` の Concept セクション `img`
- 遠隔: `index.html` と `remote.html` の `.media-frame img`

---

## alt（代替テキスト）

- すべての写真に内容が伝わる `alt` を設定。
- 純粋な装飾画像は `alt=""`。
- 重要情報（料金・日時など）を画像内の文字だけで伝えない（必ずテキストでも記載）。

JSで描画されるカード画像の alt は `assets/js/main.js` 内のテンプレートで自動生成されます（キャスト名・イベント名から）。固定画像のalt はHTMLを直接編集します。

---

## 拡張子の切り替え（PNG → WebP）

`data/site-data.js` の末尾：
```js
imageBase: "public/images/",
imageExt: ".png"   // WebPに揃えたら ".webp" へ
```
JSで描画するカード画像（cast / event）にのみ適用されます。HTMLに直書きの固定画像（hero等）は各 `src` を個別に変更してください。
