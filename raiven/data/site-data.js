/*
 * RAIVEN 歌舞伎町店 — ランタイムデータ
 * ------------------------------------------------------------------
 * このファイルがサイトの「表示に使われる」データです。
 * data/casts.json / events.json / menu.json / assets.json の内容と
 * 同期させてください（JSONは受け渡し・記録用の正本、こちらは実行用）。
 *
 * ※ ローカルで index.html をダブルクリックしても動くよう、fetch ではなく
 *    グローバル変数として読み込んでいます（file:// でのCORS回避）。
 *
 * 変動情報（出勤・料金・イベント・在籍）は変わります。
 * 必ず「最新は公式X / BASE / 店頭で確認」の表記を残してください。
 */
window.RAIVEN_DATA = {
  /* ---- 固定情報 ---- */
  site: {
    name: "RAIVEN 歌舞伎町店",
    nameShort: "RAIVEN",
    concept: "小悪魔 × お姫様",
    grandOpen: "2026-05-01",
    lastUpdated: "2026-06-13",
    address: "新宿区歌舞伎町2-22-5 叙々苑新宿第二ビル 7F",
    producer: "貴方のあんちゃん",
    sister: "RAIVEN 仙台国分町コンカフェ",
    links: {
      x: "https://x.com/RAIVEN_shinjuku",
      tiktok: "https://www.tiktok.com/@raiven_shinjuku",
      instagram: "https://www.instagram.com/raiven_shinjuku/",
      base: "https://raiven2.base.shop/"
    }
  },

  notices: {
    price: "掲載料金は参考情報です。最新の料金・メニュー・限定メニュー・在庫は店頭または公式X・公式BASEをご確認ください。",
    cast: "キャストの在籍・出勤状況は変動します。最新情報は公式Xをご確認ください。",
    event: "イベントの日程・内容は変動します。最新は公式Xをご確認ください。",
    images: "掲載写真は本人・店舗・撮影者の許可を得たもののみ使用しています。現在一部は差し替え前提のプレースホルダーです。"
  },

  /* ---- 変動情報: キャスト ---- */
  casts: [
    { id: "an", name: "貴方のあんちゃん", role: "プロデュース", profile_short: "RAIVEN歌舞伎町店プロデュース。お城の世界観をつくる看板的存在。", image_id: "RAIVEN_cast_placeholder", links: { x: "https://x.com/unsan_hoshizora", tiktok: "", instagram: "" } },
    { id: "shirai", name: "しらいっ", role: "キャスト", profile_short: "小悪魔なお姫様キャスト。", image_id: "RAIVEN_cast_placeholder", links: { x: "https://x.com/ewbcwj_lv", tiktok: "", instagram: "" } },
    { id: "mii", name: "愛桃みい", role: "キャスト", profile_short: "甘い雰囲気のお姫様キャスト。", image_id: "RAIVEN_cast_placeholder", links: { x: "https://x.com/mi_cos3111", tiktok: "", instagram: "" } },
    { id: "miri", name: "みり", role: "キャスト", profile_short: "SNS映えする雰囲気のキャスト。", image_id: "RAIVEN_cast_placeholder", links: { x: "https://x.com/m3rinyan", tiktok: "", instagram: "" } },
    { id: "rei", name: "凪音れい", role: "キャスト", profile_short: "落ち着いた魅力のお姫様キャスト。", image_id: "RAIVEN_cast_placeholder", links: { x: "https://x.com/kohaku_u0", tiktok: "", instagram: "" } }
  ],

  /* ---- 変動情報: イベント ---- */
  events: [
    { id: "event_nurse_day", title: "ナースday", date: "2026-06-13", summary: "小悪魔ナースなお姫様たちがお出迎え。テーマ衣装の特別な一日。", image_id: "RAIVEN_promo_placeholder", source_url: "https://x.com/RAIVEN_shinjuku", status: "sample" },
    { id: "event_garter_day", title: "ガーターday", date: "2026-06-19", summary: "少し妖しげなガーター衣装のテーマデー。甘さの中のスパイスを。", image_id: "RAIVEN_promo_placeholder", source_url: "https://x.com/RAIVEN_shinjuku", status: "sample" },
    { id: "event_june_bride", title: "ジューンブライド", date: "2026-06-26", summary: "純白のお姫様たちと過ごす6月限定のブライドday。", image_id: "RAIVEN_promo_placeholder", source_url: "https://x.com/RAIVEN_shinjuku", status: "sample" }
  ],

  /* ---- 変動情報: メニュー ---- */
  menu: [
    { id: "charge", label: "チャージ", note: "ご利用時間に応じたチャージ料金です。", items: [
      { label: "男性チャージ", price: "¥900", unit: "1時間", status: "参考" },
      { label: "女性チャージ", price: "¥500", unit: "1時間", status: "参考" }
    ]},
    { id: "drinks", label: "ドリンク", note: "お酒が飲めない方も楽しめるノンアルもご用意しています。", items: [
      { label: "ノンアルコール", price: "¥600〜", unit: "", status: "参考" },
      { label: "アルコール", price: "¥800〜", unit: "", status: "参考" },
      { label: "キャストドリンク", price: "¥1,000", unit: "", status: "参考" }
    ]},
    { id: "options", label: "チェキ・オプション", note: "キャストとの思い出に。", items: [
      { label: "チェキ", price: "¥1,500", unit: "", status: "参考" },
      { label: "お姫様ドリンク", price: "¥1,000", unit: "", status: "遠隔参考" },
      { label: "お姫様クライナー", price: "¥1,200", unit: "", status: "遠隔参考" },
      { label: "お姫様テキーラショット", price: "¥2,000", unit: "", status: "遠隔参考" }
    ]}
  ],

  /* ---- 画像パス解決 ---- */
  imageBase: "public/images/",
  imageExt: ".png"
};
