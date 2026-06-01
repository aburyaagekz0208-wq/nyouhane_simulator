const BOARD = { width: 1600, height: 1000 };
const NODE = { width: 94, image: 74 };
const STORAGE_KEY = "relationship-chart-creator-v1";

const state = {
  title: "相関図",
  nodes: [],
  edges: [],
  groups: [],
  texts: [],
  canvasWidth: 1600,
  canvasHeight: 1000,
  selected: null,
  editingGroupId: null,
  selectedNodeIds: [],
  linkSource: null,
  scale: 1
};

let pastedImage = "";

const relationDefaults = {
  friend: { color: "#34b75a", label: "好意", marker: "arrowFriend" },
  warning: { color: "#f2a41a", label: "注意", marker: "arrowWarn" },
  block: { color: "#f04f42", label: "対立", marker: "arrowBlock" },
  info: { color: "#2f8fff", label: "情報", marker: "arrowInfo" }
};

const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="14" fill="#e9eef2"/><circle cx="64" cy="48" r="24" fill="#9aa8b6"/><path d="M22 113c6-29 25-43 42-43s36 14 42 43" fill="#9aa8b6"/></svg>`
  );

const els = {
  board: document.querySelector("#board"),
  viewport: document.querySelector("#viewport"),
  edgesSvg: document.querySelector("#edges"),
  groupLayer: document.querySelector("#groupLayer"),
  edgeLayer: document.querySelector("#edgeLayer"),
  nodeLayer: document.querySelector("#nodeLayer"),
  textLayer: document.querySelector("#textLayer"),
  nodeTemplate: document.querySelector("#nodeTemplate"),
  chartTitle: document.querySelector("#chartTitle"),
  zoomLabel: document.querySelector("#zoomLabel"),
  personForm: document.querySelector("#personForm"),
  personName: document.querySelector("#personName"),
  imageFile: document.querySelector("#imageFile"),
  pasteZone: document.querySelector("#pasteZone"),
  pastePreview: document.querySelector("#pastePreview"),
  editPasteZone: document.querySelector("#editPasteZone"),
  editPastePreview: document.querySelector("#editPastePreview"),
  personColor: document.querySelector("#personColor"),
  relationForm: document.querySelector("#relationForm"),
  linkGuide: document.querySelector("#linkGuide"),
  sourceNode: document.querySelector("#sourceNode"),
  targetNode: document.querySelector("#targetNode"),
  relationLabel: document.querySelector("#relationLabel"),
  relationColor: document.querySelector("#relationColor"),
  relationDashed: document.querySelector("#relationDashed"),
  relationBidirectional: document.querySelector("#relationBidirectional"),
  addTextBox: document.querySelector("#addTextBox"),
  arrangeLabels: document.querySelector("#arrangeLabels"),
  emptyInspector: document.querySelector("#emptyInspector"),
  nodeInspector: document.querySelector("#nodeInspector"),
  edgeInspector: document.querySelector("#edgeInspector"),
  groupInspector: document.querySelector("#groupInspector"),
  textInspector: document.querySelector("#textInspector"),
  editNodeName: document.querySelector("#editNodeName"),
  editNodeImageFile: document.querySelector("#editNodeImageFile"),
  editNodeNote: document.querySelector("#editNodeNote"),
  editNodeColor: document.querySelector("#editNodeColor"),
  editEdgeLabel: document.querySelector("#editEdgeLabel"),
  editEdgeColor: document.querySelector("#editEdgeColor"),
  editEdgeDashed: document.querySelector("#editEdgeDashed"),
  editEdgeBidirectional: document.querySelector("#editEdgeBidirectional"),
  editTextContent: document.querySelector("#editTextContent"),
  editTextSize: document.querySelector("#editTextSize"),
  editTextColor: document.querySelector("#editTextColor"),
  editTextBackground: document.querySelector("#editTextBackground"),
  deleteTextBox: document.querySelector("#deleteTextBox"),
  editGroupName: document.querySelector("#editGroupName"),
  editGroupColor: document.querySelector("#editGroupColor"),
  addSelectedToGroup: document.querySelector("#addSelectedToGroup"),
  deleteNode: document.querySelector("#deleteNode"),
  deleteEdge: document.querySelector("#deleteEdge"),
  deleteGroup: document.querySelector("#deleteGroup"),
  nodeList: document.querySelector("#nodeList"),
  groupList: document.querySelector("#groupList"),
  selectionSummary: document.querySelector("#selectionSummary"),
  groupName: document.querySelector("#groupName"),
  groupColor: document.querySelector("#groupColor"),
  createGroup: document.querySelector("#createGroup"),
  exportPng: document.querySelector("#exportPng"),
  clearAll: document.querySelector("#clearAll"),
  saveProject: document.querySelector("#saveProject"),
  loadProject: document.querySelector("#loadProject"),
  newProject: document.querySelector("#newProject"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
  fitView: document.querySelector("#fitView")
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function selectedRelationType() {
  return new FormData(els.relationForm).get("relationType") || "friend";
}

function currentRelationOptions() {
  const type = selectedRelationType();
  const defaults = relationDefaults[type] || relationDefaults.friend;
  return {
    label: els.relationLabel.value.trim() || defaults.label,
    color: els.relationColor.value || defaults.color,
    dashed: els.relationDashed.checked,
    bidirectional: els.relationBidirectional.checked,
    type
  };
}

function bindColorPresets() {
  document.querySelectorAll(".preset-colors").forEach((palette) => {
    palette.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-color]");
      if (!button) return;
      const target = document.querySelector(`#${palette.dataset.target}`);
      if (!target) return;
      target.value = button.dataset.color;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

function setLinkSource(id) {
  state.linkSource = id;
  const node = state.nodes.find((item) => item.id === id);
  els.linkGuide.textContent = node
    ? `始点「${node.name}」を選択中。つなぎたい相手のアイコンをクリック`
    : "アイコンを2つクリックすると、選んだ関係で線を作成";
}

function readSelectedFile(input) {
  const file = input.files && input.files[0];
  if (!file) return Promise.resolve("");
  return readImageFile(file);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setPastedImage(dataUrl) {
  pastedImage = dataUrl;
  els.pastePreview.src = dataUrl || fallbackImage;
  els.pasteZone.querySelector("span").textContent = dataUrl
    ? "スクショ画像を使用します"
    : "スクショを貼り付け / 画像をドロップ";
  if (dataUrl && !els.personName.value.trim()) {
    els.personName.value = `画像人物${state.nodes.length + 1}`;
  }
}

async function acceptImageFile(file, point) {
  if (!file || !file.type.startsWith("image/")) return false;
  const image = await readImageFile(file);
  if (point) {
    addNode({
      name: `画像人物${state.nodes.length + 1}`,
      image,
      color: els.personColor.value,
      x: point.x - NODE.width / 2,
      y: point.y - NODE.image / 2
    });
  } else {
    setPastedImage(image);
  }
  return true;
}

function boardPointFromEvent(event) {
  const rect = els.board.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / state.scale,
    y: (event.clientY - rect.top) / state.scale
  };
}

function setCanvasSize(width, height) {
  state.canvasWidth = Math.max(900, Math.ceil(width));
  state.canvasHeight = Math.max(650, Math.ceil(height));
  BOARD.width = state.canvasWidth;
  BOARD.height = state.canvasHeight;
  els.board.style.width = `${BOARD.width}px`;
  els.board.style.height = `${BOARD.height}px`;
  els.edgesSvg.setAttribute("width", BOARD.width);
  els.edgesSvg.setAttribute("height", BOARD.height);
  els.edgesSvg.setAttribute("viewBox", `0 0 ${BOARD.width} ${BOARD.height}`);
  els.board.style.marginRight = `${28 + Math.max(0, BOARD.width * (state.scale - 1))}px`;
  els.board.style.marginBottom = `${28 + Math.max(0, BOARD.height * (state.scale - 1))}px`;
}

function ensureCanvasContains(x, y) {
  const nextWidth = Math.max(BOARD.width, x + 260);
  const nextHeight = Math.max(BOARD.height, y + 220);
  if (nextWidth !== BOARD.width || nextHeight !== BOARD.height) {
    setCanvasSize(nextWidth, nextHeight);
  }
}

function ensureCanvasForAll() {
  let maxX = BOARD.width;
  let maxY = BOARD.height;
  state.nodes.forEach((node) => {
    maxX = Math.max(maxX, node.x + NODE.width + 260);
    maxY = Math.max(maxY, node.y + 180);
  });
  state.texts.forEach((text) => {
    maxX = Math.max(maxX, text.x + text.width + 180);
    maxY = Math.max(maxY, text.y + text.height + 160);
  });
  setCanvasSize(maxX, maxY);
}

function canvasFitBounds() {
  const boxes = [];
  state.nodes.forEach((node) => {
    boxes.push({ x: node.x, y: node.y, width: NODE.width, height: 140 });
  });
  state.texts.forEach((text) => {
    boxes.push({ x: text.x, y: text.y, width: text.width, height: text.height });
  });
  state.groups.forEach((group) => {
    const bounds = groupBounds(group);
    if (bounds) boxes.push(bounds);
  });

  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  state.edges.forEach((edge, index) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;
    const geometry = edgePathData(source, target, index);
    const xs = [geometry.a.x, geometry.b.x, geometry.c1.x, geometry.c2.x];
    const ys = [geometry.a.y, geometry.b.y, geometry.c1.y, geometry.c2.y];
    boxes.push({
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    });
    if (edge.label) {
      boxes.push(labelBox(edge, geometry, { x: edge.labelDx || 0, y: edge.labelDy || 0 }));
    }
  });

  if (!boxes.length) return { x: 0, y: 0, width: 900, height: 650 };
  const padding = 96;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    x: Math.max(0, Math.floor(minX - padding)),
    y: Math.max(0, Math.floor(minY - padding)),
    width: Math.max(900, Math.ceil(maxX - Math.max(0, minX - padding) + padding)),
    height: Math.max(650, Math.ceil(maxY - Math.max(0, minY - padding) + padding))
  };
}

function normalizeCanvas({ renderAfter = true, persistAfter = true } = {}) {
  const bounds = canvasFitBounds();
  const dx = bounds.x;
  const dy = bounds.y;

  if (dx || dy) {
    state.nodes.forEach((node) => {
      node.x = Math.max(8, node.x - dx);
      node.y = Math.max(8, node.y - dy);
    });
    state.texts.forEach((text) => {
      text.x = Math.max(8, text.x - dx);
      text.y = Math.max(8, text.y - dy);
    });
    els.viewport.scrollLeft = Math.max(0, els.viewport.scrollLeft - dx * state.scale);
    els.viewport.scrollTop = Math.max(0, els.viewport.scrollTop - dy * state.scale);
  }

  setCanvasSize(bounds.width, bounds.height);
  if (renderAfter) render();
  if (persistAfter) persist();
}

function clearAll() {
  if (!window.confirm("すべての人物・関係・グループ・テキストを削除します。よろしいですか？")) return;
  state.nodes = [];
  state.edges = [];
  state.groups = [];
  state.texts = [];
  state.selected = null;
  state.editingGroupId = null;
  state.selectedNodeIds = [];
  state.linkSource = null;
  setCanvasSize(900, 650);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function setScale(nextScale) {
  state.scale = Math.max(0.2, Math.min(4, nextScale));
  els.board.style.transform = `scale(${state.scale})`;
  els.board.style.marginRight = `${28 + Math.max(0, BOARD.width * (state.scale - 1))}px`;
  els.board.style.marginBottom = `${28 + Math.max(0, BOARD.height * (state.scale - 1))}px`;
  els.zoomLabel.value = `${Math.round(state.scale * 100)}%`;
}

function select(type, id) {
  state.selected = type && id ? { type, id } : null;
  if (type === "group") state.editingGroupId = id;
  render();
}

function addNode({ name, image, color, note = "", x, y }) {
  const nextX = typeof x === "number" ? Math.max(8, x) : 600 + (state.nodes.length % 5) * 110;
  const nextY = typeof y === "number" ? Math.max(8, y) : 320 + Math.floor(state.nodes.length / 5) * 120;
  ensureCanvasContains(nextX, nextY);
  const node = {
    id: uid("node"),
    name,
    image: image || fallbackImage,
    color,
    note,
    x: nextX,
    y: nextY
  };
  state.nodes.push(node);
  select("node", node.id);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function addEdge({ source, target, label, color, dashed, bidirectional, type }) {
  if (!source || !target || source === target) return;
  const defaults = relationDefaults[type] || relationDefaults.friend;
  state.edges.push({
    id: uid("edge"),
    source,
    target,
    label: label || defaults.label,
    color: color || defaults.color,
    dashed: Boolean(dashed),
    bidirectional: Boolean(bidirectional),
    type
  });
  select("edge", state.edges[state.edges.length - 1].id);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function addTextBox() {
  const x = Math.max(40, els.viewport.scrollLeft / state.scale + 120);
  const y = Math.max(40, els.viewport.scrollTop / state.scale + 90);
  const text = {
    id: uid("text"),
    text: "テキスト",
    x,
    y,
    width: 260,
    height: 72,
    fontSize: 24,
    color: "#111827",
    background: "#ffffff",
    align: "left"
  };
  ensureCanvasContains(x + text.width, y + text.height);
  state.texts.push(text);
  select("text", text.id);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function nodeCenter(node) {
  return { x: node.x + NODE.width / 2, y: node.y + NODE.image / 2 };
}

function nodeIconAnchor(from, to) {
  const fromCenter = nodeCenter(from);
  const toCenter = nodeCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const half = NODE.image / 2 + 6;
  const tx = dx === 0 ? Infinity : half / Math.abs(dx);
  const ty = dy === 0 ? Infinity : half / Math.abs(dy);
  const t = Math.min(tx, ty, 1);
  return { x: fromCenter.x + dx * t, y: fromCenter.y + dy * t };
}

function edgeAnchors(source, target) {
  const a = nodeIconAnchor(source, target);
  const b = nodeIconAnchor(target, source);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  return { a, b, dx, dy, distance };
}

function edgePathData(source, target, index, routeOffsetOverride = null) {
  const { a, b, dx, dy, distance } = edgeAnchors(source, target);
  const offset = routeOffsetOverride ?? (((index % 5) - 2) * 16 + (state.edges[index]?.routeOffset || 0));
  const normalX = (-dy / distance) * offset;
  const normalY = (dx / distance) * offset;
  const c1x = a.x + dx * 0.36 + normalX;
  const c1y = a.y + dy * 0.36 + normalY;
  const c2x = a.x + dx * 0.64 + normalX;
  const c2y = a.y + dy * 0.64 + normalY;
  return {
    a,
    b,
    c1: { x: c1x, y: c1y },
    c2: { x: c2x, y: c2y },
    normalX,
    normalY,
    path: `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`
  };
}

function arrowPoints(tip, previous, size = 14) {
  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const left = angle + Math.PI - 0.55;
  const right = angle + Math.PI + 0.55;
  return [
    `${tip.x},${tip.y}`,
    `${tip.x + Math.cos(left) * size},${tip.y + Math.sin(left) * size}`,
    `${tip.x + Math.cos(right) * size},${tip.y + Math.sin(right) * size}`
  ].join(" ");
}

function groupBounds(group) {
  const nodes = group.nodeIds
    .map((id) => state.nodes.find((node) => node.id === id))
    .filter(Boolean);
  if (!nodes.length) return null;
  const pad = group.padding || 26;
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + NODE.width));
  const maxY = Math.max(...nodes.map((node) => node.y + 118));
  const x = Math.max(4, minX - pad);
  const y = Math.max(4, minY - pad);
  return {
    x,
    y,
    width: Math.min(BOARD.width - x - 4, maxX - minX + pad * 2),
    height: Math.min(BOARD.height - y - 4, maxY - minY + pad * 2)
  };
}

function renderGroups() {
  els.groupLayer.innerHTML = "";
  state.groups.forEach((group) => {
    const bounds = groupBounds(group);
    if (!bounds) return;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", "group-shape");
    rect.setAttribute("x", bounds.x);
    rect.setAttribute("y", bounds.y);
    rect.setAttribute("width", bounds.width);
    rect.setAttribute("height", bounds.height);
    rect.setAttribute("rx", "12");
    rect.setAttribute("fill", group.color);
    rect.setAttribute("stroke", group.color);
    if ((state.selected?.type === "group" && state.selected.id === group.id) || state.editingGroupId === group.id) {
      rect.classList.add("selected");
    }
    rect.addEventListener("click", (event) => {
      event.stopPropagation();
      select("group", group.id);
    });
    els.groupLayer.append(rect);

    const labelWidth = Math.max(64, Math.min(220, group.name.length * 16 + 24));
    const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
    label.setAttribute("class", "group-label");

    const labelRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    labelRect.setAttribute("x", bounds.x + 12);
    labelRect.setAttribute("y", bounds.y - 14);
    labelRect.setAttribute("width", labelWidth);
    labelRect.setAttribute("height", 28);
    labelRect.setAttribute("fill", group.color);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", bounds.x + 24);
    text.setAttribute("y", bounds.y + 5);
    text.textContent = group.name;

    label.append(labelRect, text);
    label.addEventListener("click", (event) => {
      event.stopPropagation();
      select("group", group.id);
    });
    els.groupLayer.append(label);
  });
}

function labelMetrics(label) {
  return {
    width: Math.max(44, Math.min(180, label.length * 16 + 18)),
    height: 27
  };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function pointInsideBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function cubicPoint(a, c1, c2, b, t) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * a.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * b.x,
    y: mt ** 3 * a.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * b.y
  };
}

function pathCollisionScore(geometry, boxes) {
  let score = 0;
  for (let i = 1; i < 19; i += 1) {
    const point = cubicPoint(geometry.a, geometry.c1, geometry.c2, geometry.b, i / 19);
    score += boxes.filter((box) => pointInsideBox(point, box)).length;
  }
  return score;
}

function labelBox(edge, geometry, shift) {
  const metrics = labelMetrics(edge.label || "");
  const x = (geometry.a.x + geometry.b.x) / 2 + geometry.normalX + shift.x;
  const y = (geometry.a.y + geometry.b.y) / 2 + geometry.normalY + shift.y;
  return {
    x: x - metrics.width / 2,
    y: y - metrics.height / 2,
    width: metrics.width,
    height: metrics.height
  };
}

function arrangeEdgeLabels() {
  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  const nodeBoxes = state.nodes.map((node) => ({
    x: node.x - 6,
    y: node.y - 6,
    width: NODE.width + 12,
    height: 124
  }));
  const occupied = [...nodeBoxes];
  const shifts = [
    { x: 0, y: 0 },
    { x: 0, y: -36 },
    { x: 0, y: 36 },
    { x: -72, y: 0 },
    { x: 72, y: 0 },
    { x: -72, y: -36 },
    { x: 72, y: -36 },
    { x: -72, y: 36 },
    { x: 72, y: 36 },
    { x: 0, y: -72 },
    { x: 0, y: 72 }
  ];
  const routeOffsets = [0, 42, -42, 78, -78, 116, -116, 154, -154, 206, -206];

  state.edges.forEach((edge, index) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;
    let bestRoute = edge.routeOffset || 0;
    let bestRouteScore = Infinity;

    routeOffsets.forEach((routeOffset) => {
      const geometry = edgePathData(source, target, index, ((index % 5) - 2) * 16 + routeOffset);
      const score = pathCollisionScore(geometry, nodeBoxes) * 10 + Math.abs(routeOffset) / 80;
      if (score < bestRouteScore) {
        bestRouteScore = score;
        bestRoute = routeOffset;
      }
    });

    edge.routeOffset = bestRoute;
    if (!edge.label) return;
    const geometry = edgePathData(source, target, index);
    let best = shifts[0];
    let bestScore = Infinity;

    shifts.forEach((shift) => {
      const box = labelBox(edge, geometry, shift);
      const overlaps = occupied.filter((item) => boxesOverlap(box, item)).length;
      const distancePenalty = (Math.abs(shift.x) + Math.abs(shift.y)) / 120;
      const score = overlaps * 10 + distancePenalty;
      if (score < bestScore) {
        bestScore = score;
        best = shift;
      }
    });

    edge.labelDx = best.x;
    edge.labelDy = best.y;
    occupied.push(labelBox(edge, geometry, best));
  });

  render();
  persist();
}

function renderEdges() {
  els.edgeLayer.innerHTML = "";
  const byId = new Map(state.nodes.map((node) => [node.id, node]));

  state.edges.forEach((edge, index) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;

    const geometry = edgePathData(source, target, index);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("class", "edge-path");
    pathEl.setAttribute("d", geometry.path);
    pathEl.setAttribute("stroke", edge.color);
    if (edge.dashed) pathEl.setAttribute("stroke-dasharray", "8 8");
    els.edgeLayer.append(pathEl);

    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", arrowPoints(geometry.b, geometry.c2));
    arrow.setAttribute("fill", edge.color);
    els.edgeLayer.append(arrow);

    if (edge.bidirectional) {
      const startArrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      startArrow.setAttribute("points", arrowPoints(geometry.a, geometry.c1));
      startArrow.setAttribute("fill", edge.color);
      els.edgeLayer.append(startArrow);
    }

    const labelText = edge.label || "";
    if (!labelText) return;
    const midX = (geometry.a.x + geometry.b.x) / 2 + geometry.normalX + (edge.labelDx || 0);
    const midY = (geometry.a.y + geometry.b.y) / 2 + geometry.normalY + (edge.labelDy || 0);
    const labelWidth = Math.max(44, Math.min(180, labelText.length * 16 + 18));
    const labelHeight = 27;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `edge-label ${state.selected?.id === edge.id ? "selected" : ""}`);
    group.dataset.id = edge.id;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", midX - labelWidth / 2);
    rect.setAttribute("y", midY - labelHeight / 2);
    rect.setAttribute("width", labelWidth);
    rect.setAttribute("height", labelHeight);
    rect.setAttribute("fill", edge.color);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX);
    text.setAttribute("y", midY + 5);
    text.setAttribute("text-anchor", "middle");
    text.textContent = labelText.length > 10 ? `${labelText.slice(0, 10)}…` : labelText;

    group.append(rect, text);
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      select("edge", edge.id);
    });
    els.edgeLayer.append(group);
  });
}

function renderNodes() {
  els.nodeLayer.innerHTML = "";
  state.nodes.forEach((node) => {
    const item = els.nodeTemplate.content.firstElementChild.cloneNode(true);
    item.dataset.id = node.id;
    item.draggable = false;
    item.style.left = `${node.x}px`;
    item.style.top = `${node.y}px`;
    item.style.setProperty("--node-color", node.color);
    item.classList.toggle("selected", state.selected?.type === "node" && state.selected.id === node.id);
    item.classList.toggle("link-source", state.linkSource === node.id);
    item.classList.toggle("multi-selected", state.selectedNodeIds.includes(node.id));

    const img = item.querySelector("img");
    img.src = node.image || fallbackImage;
    img.alt = node.name;
    img.draggable = false;
    img.onerror = () => {
      img.src = fallbackImage;
    };
    item.querySelector(".node-name").textContent = node.name;
    item.querySelector(".node-note").textContent = node.note || "";
    item.addEventListener("dragstart", (event) => event.preventDefault());
    item.addEventListener("pointerdown", startDrag);
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.currentTarget.dataset.dragged === "true") {
        event.currentTarget.dataset.dragged = "false";
        return;
      }
      handleNodeClick(node.id, event);
    });
    els.nodeLayer.append(item);
  });
}

function renderTexts() {
  els.textLayer.innerHTML = "";
  state.texts.forEach((text) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "text-box";
    item.dataset.id = text.id;
    item.style.left = `${text.x}px`;
    item.style.top = `${text.y}px`;
    item.style.width = `${text.width}px`;
    item.style.minHeight = `${text.height}px`;
    item.style.setProperty("--text-size", `${text.fontSize}px`);
    item.style.setProperty("--text-color", text.color);
    item.style.setProperty("--text-bg", text.background);
    item.style.setProperty("--text-align", text.align);
    item.classList.toggle("selected", state.selected?.type === "text" && state.selected.id === text.id);
    item.textContent = text.text;
    item.addEventListener("pointerdown", startTextDrag);
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.currentTarget.dataset.dragged === "true") {
        event.currentTarget.dataset.dragged = "false";
        return;
      }
      select("text", text.id);
    });
    els.textLayer.append(item);
  });
}

function renderSelects() {
  const currentSource = els.sourceNode.value;
  const currentTarget = els.targetNode.value;
  const options = state.nodes
    .map((node) => `<option value="${node.id}">${escapeHtml(node.name)}</option>`)
    .join("");
  els.sourceNode.innerHTML = options;
  els.targetNode.innerHTML = options;
  if (state.nodes.some((node) => node.id === currentSource)) {
    els.sourceNode.value = currentSource;
  } else if (state.nodes[0]) {
    els.sourceNode.value = state.nodes[0].id;
  }
  if (state.nodes.some((node) => node.id === currentTarget)) {
    els.targetNode.value = currentTarget;
  } else if (state.nodes[1]) {
    els.targetNode.value = state.nodes[1].id;
  }
}

function renderInspector() {
  const selectedNode = state.selected?.type === "node" ? state.nodes.find((node) => node.id === state.selected.id) : null;
  const selectedEdge = state.selected?.type === "edge" ? state.edges.find((edge) => edge.id === state.selected.id) : null;
  const selectedText = state.selected?.type === "text" ? state.texts.find((text) => text.id === state.selected.id) : null;
  const selectedGroup = selectedEdge || selectedText
    ? null
    : state.groups.find((group) => group.id === (state.selected?.type === "group" ? state.selected.id : state.editingGroupId));
  els.emptyInspector.classList.toggle("hidden", Boolean(selectedNode || selectedEdge || selectedGroup || selectedText));
  els.nodeInspector.classList.toggle("hidden", !selectedNode);
  els.edgeInspector.classList.toggle("hidden", !selectedEdge);
  els.groupInspector.classList.toggle("hidden", !selectedGroup);
  els.textInspector.classList.toggle("hidden", !selectedText);

  if (selectedNode) {
    els.editNodeName.value = selectedNode.name;
    els.editNodeImageFile.value = "";
    els.editPastePreview.src = selectedNode.image || fallbackImage;
    els.editNodeNote.value = selectedNode.note || "";
    els.editNodeColor.value = selectedNode.color;
  }

  if (selectedEdge) {
    els.editEdgeLabel.value = selectedEdge.label;
    els.editEdgeColor.value = selectedEdge.color;
    els.editEdgeDashed.checked = selectedEdge.dashed;
    els.editEdgeBidirectional.checked = Boolean(selectedEdge.bidirectional);
  }

  if (selectedGroup) {
    els.editGroupName.value = selectedGroup.name;
    els.editGroupColor.value = selectedGroup.color;
  }

  if (selectedText) {
    els.editTextContent.value = selectedText.text;
    els.editTextSize.value = selectedText.fontSize;
    els.editTextColor.value = selectedText.color;
    els.editTextBackground.value = selectedText.background;
    const alignInput = document.querySelector(`[name="textAlign"][value="${selectedText.align}"]`);
    if (alignInput) alignInput.checked = true;
  }
}

function renderList() {
  els.nodeList.innerHTML = "";
  els.groupList.innerHTML = "";
  els.selectionSummary.textContent = state.selectedNodeIds.length
    ? `${state.selectedNodeIds.length}人を選択中`
    : "Shiftクリックで複数選択";
  state.nodes.forEach((node) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<img alt=""><span></span><span class="row-delete" title="削除">×</span>`;
    button.querySelector("img").src = node.image || fallbackImage;
    button.querySelector("span").textContent = node.name;
    button.classList.toggle("is-selected", state.selectedNodeIds.includes(node.id));
    button.addEventListener("click", (event) => {
      if (event.target.closest(".row-delete")) {
        event.stopPropagation();
        deleteNodeById(node.id);
        return;
      }
      if (event.shiftKey) {
        toggleNodeSelection(node.id);
      } else {
        state.selectedNodeIds = [];
        select("node", node.id);
      }
    });
    els.nodeList.append(button);
  });

  state.groups.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-row";
    button.style.setProperty("--group-color", group.color);
    button.innerHTML = `<span class="group-dot"></span><span></span><span class="row-delete" title="削除">×</span>`;
    button.querySelector("span:nth-child(2)").textContent = `${group.name}（${group.nodeIds.length}人）`;
    button.classList.toggle("is-selected", (state.selected?.type === "group" && state.selected.id === group.id) || state.editingGroupId === group.id);
    button.addEventListener("click", (event) => {
      if (event.target.closest(".row-delete")) {
        event.stopPropagation();
        deleteGroupById(group.id);
        return;
      }
      select("group", group.id);
    });
    els.groupList.append(button);
  });
}

function render() {
  els.chartTitle.value = state.title;
  renderGroups();
  renderEdges();
  renderNodes();
  renderTexts();
  renderSelects();
  renderInspector();
  renderList();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function toggleNodeSelection(id) {
  state.linkSource = null;
  if (state.selectedNodeIds.includes(id)) {
    state.selectedNodeIds = state.selectedNodeIds.filter((nodeId) => nodeId !== id);
  } else {
    state.selectedNodeIds = [...state.selectedNodeIds, id];
  }
  state.selected = { type: "node", id };
  render();
  persist();
}

function createGroupFromSelection() {
  const nodeIds = state.selectedNodeIds.filter((id) => state.nodes.some((node) => node.id === id));
  if (nodeIds.length < 2) {
    els.selectionSummary.textContent = "2人以上をShiftクリックで選択";
    return;
  }
  const group = {
    id: uid("group"),
    name: els.groupName.value.trim() || `グループ${state.groups.length + 1}`,
    color: els.groupColor.value || "#00a6a6",
    nodeIds,
    padding: 30
  };
  state.groups.push(group);
  els.groupName.value = "";
  state.selectedNodeIds = [];
  state.selected = { type: "group", id: group.id };
  state.editingGroupId = group.id;
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function handleNodeClick(id, event) {
  if (event?.shiftKey) {
    toggleNodeSelection(id);
    return;
  }

  if (!state.linkSource) {
    state.selectedNodeIds = [];
    select("node", id);
    setLinkSource(id);
    render();
    return;
  }

  if (state.linkSource === id) {
    setLinkSource(null);
    select("node", id);
    return;
  }

  addEdge({
    source: state.linkSource,
    target: id,
    ...currentRelationOptions()
  });
  setLinkSource(null);
  els.relationLabel.value = "";
  render();
}

function startDrag(event) {
  const id = event.currentTarget.dataset.id;
  const node = state.nodes.find((item) => item.id === id);
  if (!node) return;
  const dragEl = event.currentTarget;
  dragEl.dataset.dragged = "false";
  const start = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    nodeX: node.x,
    nodeY: node.y,
    moved: false
  };
  dragEl.setPointerCapture(event.pointerId);

  function move(moveEvent) {
    const deltaX = moveEvent.clientX - start.pointerX;
    const deltaY = moveEvent.clientY - start.pointerY;
    if (!start.moved && Math.hypot(deltaX, deltaY) < 5) return;
    start.moved = true;
    dragEl.dataset.dragged = "true";
    const nextX = start.nodeX + deltaX / state.scale;
    const nextY = start.nodeY + deltaY / state.scale;
    node.x = Math.max(8, nextX);
    node.y = Math.max(8, nextY);
    ensureCanvasContains(node.x, node.y);
    dragEl.style.left = `${node.x}px`;
    dragEl.style.top = `${node.y}px`;
    renderGroups();
    renderEdges();
  }

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    if (start.moved) {
      state.selected = { type: "node", id };
      normalizeCanvas({ renderAfter: true, persistAfter: true });
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function startTextDrag(event) {
  const id = event.currentTarget.dataset.id;
  const text = state.texts.find((item) => item.id === id);
  if (!text) return;
  const dragEl = event.currentTarget;
  dragEl.dataset.dragged = "false";
  const start = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: text.x,
    y: text.y,
    moved: false
  };
  dragEl.setPointerCapture(event.pointerId);

  function move(moveEvent) {
    const deltaX = moveEvent.clientX - start.pointerX;
    const deltaY = moveEvent.clientY - start.pointerY;
    if (!start.moved && Math.hypot(deltaX, deltaY) < 5) return;
    start.moved = true;
    dragEl.dataset.dragged = "true";
    text.x = Math.max(8, start.x + deltaX / state.scale);
    text.y = Math.max(8, start.y + deltaY / state.scale);
    ensureCanvasContains(text.x + text.width, text.y + text.height);
    dragEl.style.left = `${text.x}px`;
    dragEl.style.top = `${text.y}px`;
  }

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    if (start.moved) {
      state.selected = { type: "text", id };
      normalizeCanvas({ renderAfter: true, persistAfter: true });
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function startCanvasPan(event) {
  if (event.button !== 0) return;
  if (event.target.closest(".person-node, .text-box, .edge-label, .group-label, .group-shape, input, button, textarea, select")) return;
  const start = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: els.viewport.scrollLeft,
    scrollTop: els.viewport.scrollTop,
    moved: false
  };
  els.viewport.classList.add("panning");

  function move(moveEvent) {
    const dx = moveEvent.clientX - start.x;
    const dy = moveEvent.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 4) return;
    start.moved = true;
    els.viewport.scrollLeft = start.scrollLeft - dx;
    els.viewport.scrollTop = start.scrollTop - dy;
  }

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    els.viewport.classList.remove("panning");
    if (start.moved) {
      window.setTimeout(() => {
        els.board.dataset.panned = "false";
      });
      els.board.dataset.panned = "true";
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function updateSelectedNode(patch) {
  const node = state.nodes.find((item) => item.id === state.selected?.id);
  if (!node) return;
  Object.assign(node, patch);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function updateSelectedEdge(patch) {
  const edge = state.edges.find((item) => item.id === state.selected?.id);
  if (!edge) return;
  Object.assign(edge, patch);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function updateSelectedGroup(patch) {
  const group = state.groups.find((item) => item.id === (state.selected?.type === "group" ? state.selected.id : state.editingGroupId));
  if (!group) return;
  Object.assign(group, patch);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function updateSelectedText(patch) {
  const text = state.texts.find((item) => item.id === state.selected?.id);
  if (!text) return;
  Object.assign(text, patch);
  ensureCanvasContains(text.x + text.width, text.y + text.height);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function deleteNodeById(id) {
  state.nodes = state.nodes.filter((node) => node.id !== id);
  state.edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
  state.groups = state.groups
    .map((group) => ({ ...group, nodeIds: group.nodeIds.filter((nodeId) => nodeId !== id) }))
    .filter((group) => group.nodeIds.length >= 2);
  state.selectedNodeIds = state.selectedNodeIds.filter((nodeId) => nodeId !== id);
  if (state.selected?.id === id) state.selected = null;
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function deleteGroupById(id) {
  state.groups = state.groups.filter((group) => group.id !== id);
  if (state.selected?.id === id) state.selected = null;
  if (state.editingGroupId === id) state.editingGroupId = null;
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function addSelectedNodesToGroup() {
  const group = state.groups.find((item) => item.id === (state.selected?.type === "group" ? state.selected.id : state.editingGroupId));
  if (!group) return;
  const additions = state.selectedNodeIds.filter((id) => state.nodes.some((node) => node.id === id));
  if (!additions.length) return;
  group.nodeIds = Array.from(new Set([...group.nodeIds, ...additions]));
  state.selectedNodeIds = [];
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function updateSelectedNodeImage(image) {
  if (state.selected?.type !== "node" || !image) return;
  updateSelectedNode({ image });
}

function deleteTextById(id) {
  state.texts = state.texts.filter((text) => text.id !== id);
  if (state.selected?.id === id) state.selected = null;
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    state.title = saved.title || "相関図";
    state.nodes = Array.isArray(saved.nodes) ? saved.nodes : [];
    state.edges = Array.isArray(saved.edges) ? saved.edges : [];
    state.groups = Array.isArray(saved.groups) ? saved.groups : [];
    state.texts = Array.isArray(saved.texts) ? saved.texts : [];
    state.canvasWidth = saved.canvasWidth || 1600;
    state.canvasHeight = saved.canvasHeight || 1000;
    setCanvasSize(state.canvasWidth, state.canvasHeight);
    ensureCanvasForAll();
    state.selected = null;
    state.editingGroupId = null;
    state.selectedNodeIds = [];
    state.linkSource = null;
    state.scale = saved.scale || 1;
    return true;
  } catch {
    return false;
  }
}

function seedDemo() {
  state.nodes = [
    { id: uid("node"), name: "主人公", image: fallbackImage, color: "#2f8fff", note: "中心人物", x: 520, y: 420 },
    { id: uid("node"), name: "親友", image: fallbackImage, color: "#34b75a", note: "", x: 285, y: 295 },
    { id: uid("node"), name: "ライバル", image: fallbackImage, color: "#f04f42", note: "", x: 755, y: 295 },
    { id: uid("node"), name: "情報屋", image: fallbackImage, color: "#111827", note: "", x: 485, y: 170 }
  ];
  state.edges = [
    { id: uid("edge"), source: state.nodes[0].id, target: state.nodes[1].id, label: "親友", color: "#34b75a", dashed: false, type: "friend" },
    { id: uid("edge"), source: state.nodes[2].id, target: state.nodes[0].id, label: "対立", color: "#f04f42", dashed: true, type: "block" },
    { id: uid("edge"), source: state.nodes[3].id, target: state.nodes[0].id, label: "知ってる", color: "#2f8fff", dashed: false, type: "info" }
  ];
  state.groups = [
    { id: uid("group"), name: "主人公周辺", color: "#00a6a6", nodeIds: [state.nodes[0].id, state.nodes[1].id, state.nodes[3].id], padding: 30 }
  ];
  state.texts = [
    { id: uid("text"), text: "相関図メモ", x: 80, y: 60, width: 260, height: 66, fontSize: 24, color: "#111827", background: "#ffffff", align: "center" }
  ];
}

function resetProject() {
  state.title = "相関図";
  state.nodes = [];
  state.edges = [];
  state.groups = [];
  state.texts = [];
  setCanvasSize(1600, 1000);
  state.selected = null;
  state.editingGroupId = null;
  state.selectedNodeIds = [];
  state.linkSource = null;
  state.scale = 1;
  seedDemo();
  setScale(1);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
}

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  download(`${state.title || "relationship-chart"}.json`, blob);
}

function loadJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      state.title = data.title || "相関図";
      state.nodes = Array.isArray(data.nodes) ? data.nodes : [];
      state.edges = Array.isArray(data.edges) ? data.edges : [];
      state.groups = Array.isArray(data.groups) ? data.groups : [];
      state.texts = Array.isArray(data.texts) ? data.texts : [];
      state.canvasWidth = data.canvasWidth || 1600;
      state.canvasHeight = data.canvasHeight || 1000;
      setCanvasSize(state.canvasWidth, state.canvasHeight);
      ensureCanvasForAll();
      state.selected = null;
      state.editingGroupId = null;
      state.selectedNodeIds = [];
      state.linkSource = null;
      state.scale = data.scale || 1;
      setScale(state.scale);
      render();
      persist();
    } catch {
      alert("JSONを読み込めませんでした。");
    }
  };
  reader.readAsText(file);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.src = fallbackImage;
    };
    img.src = src || fallbackImage;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const chars = Array.from(text);
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function textBoxLines(ctx, text, maxWidth) {
  return String(text || "")
    .split("\n")
    .flatMap((line) => wrapText(ctx, line, maxWidth));
}

function contentBounds() {
  const boxes = [];
  state.nodes.forEach((node) => {
    boxes.push({ x: node.x - 12, y: node.y - 12, width: NODE.width + 24, height: 145 });
  });
  state.groups.forEach((group) => {
    const bounds = groupBounds(group);
    if (bounds) boxes.push({ x: bounds.x - 8, y: bounds.y - 24, width: bounds.width + 16, height: bounds.height + 36 });
  });
  state.texts.forEach((text) => {
    boxes.push({ x: text.x - 8, y: text.y - 8, width: text.width + 16, height: text.height + 16 });
  });
  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  state.edges.forEach((edge, index) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;
    const geometry = edgePathData(source, target, index);
    const xs = [geometry.a.x, geometry.b.x, geometry.c1.x, geometry.c2.x];
    const ys = [geometry.a.y, geometry.b.y, geometry.c1.y, geometry.c2.y];
    boxes.push({
      x: Math.min(...xs) - 28,
      y: Math.min(...ys) - 28,
      width: Math.max(...xs) - Math.min(...xs) + 56,
      height: Math.max(...ys) - Math.min(...ys) + 56
    });
    if (edge.label) {
      const box = labelBox(edge, geometry, { x: edge.labelDx || 0, y: edge.labelDy || 0 });
      boxes.push({ x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 });
    }
  });
  if (!boxes.length) return { x: 0, y: 0, width: 900, height: 650 };
  const minX = Math.max(0, Math.min(...boxes.map((box) => box.x)) - 32);
  const minY = Math.max(0, Math.min(...boxes.map((box) => box.y)) - 32);
  const maxX = Math.min(BOARD.width, Math.max(...boxes.map((box) => box.x + box.width)) + 32);
  const maxY = Math.min(BOARD.height, Math.max(...boxes.map((box) => box.y + box.height)) + 32);
  return {
    x: Math.floor(minX),
    y: Math.floor(minY),
    width: Math.max(240, Math.ceil(maxX - minX)),
    height: Math.max(180, Math.ceil(maxY - minY))
  };
}

function drawTextBox(ctx, text) {
  ctx.save();
  ctx.fillStyle = text.background;
  drawRoundedRect(ctx, text.x, text.y, text.width, text.height, 6);
  ctx.fill();
  ctx.fillStyle = text.color;
  ctx.font = `800 ${text.fontSize}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = text.align;
  const x = text.align === "center" ? text.x + text.width / 2 : text.align === "right" ? text.x + text.width - 12 : text.x + 12;
  const lines = textBoxLines(ctx, text.text, text.width - 24);
  const lineHeight = text.fontSize * 1.35;
  const startY = text.y + text.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
  ctx.restore();
}

async function exportPng() {
  const bounds = contentBounds();
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffefa";
  ctx.fillRect(0, 0, bounds.width, bounds.height);
  ctx.translate(-bounds.x, -bounds.y);

  const byId = new Map(state.nodes.map((node) => [node.id, node]));

  state.groups.forEach((group) => {
    const bounds = groupBounds(group);
    if (!bounds) return;
    ctx.save();
    ctx.fillStyle = group.color;
    ctx.globalAlpha = 0.08;
    drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = group.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "900 15px sans-serif";
    const labelWidth = Math.max(64, Math.min(220, ctx.measureText(group.name).width + 24));
    ctx.fillStyle = group.color;
    drawRoundedRect(ctx, bounds.x + 12, bounds.y - 14, labelWidth, 28, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(group.name, bounds.x + 24, bounds.y);
    ctx.restore();

  });

  state.edges.forEach((edge, index) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;
    const geometry = edgePathData(source, target, index);

    ctx.save();
    ctx.strokeStyle = edge.color;
    ctx.lineWidth = 3;
    if (edge.dashed) ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(geometry.a.x, geometry.a.y);
    ctx.bezierCurveTo(geometry.c1.x, geometry.c1.y, geometry.c2.x, geometry.c2.y, geometry.b.x, geometry.b.y);
    ctx.stroke();
    ctx.restore();

    const angle = Math.atan2(geometry.b.y - geometry.c2.y, geometry.b.x - geometry.c2.x);
    ctx.save();
    ctx.translate(geometry.b.x, geometry.b.y);
    ctx.rotate(angle);
    ctx.fillStyle = edge.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (edge.bidirectional) {
      const startAngle = Math.atan2(geometry.a.y - geometry.c1.y, geometry.a.x - geometry.c1.x);
      ctx.save();
      ctx.translate(geometry.a.x, geometry.a.y);
      ctx.rotate(startAngle);
      ctx.fillStyle = edge.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-14, -7);
      ctx.lineTo(-14, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (edge.label) {
      const midX = (geometry.a.x + geometry.b.x) / 2 + geometry.normalX + (edge.labelDx || 0);
      const midY = (geometry.a.y + geometry.b.y) / 2 + geometry.normalY + (edge.labelDy || 0);
      ctx.font = "900 16px sans-serif";
      const label = edge.label.length > 12 ? `${edge.label.slice(0, 12)}…` : edge.label;
      const width = Math.max(44, Math.min(190, ctx.measureText(label).width + 20));
      ctx.fillStyle = edge.color;
      drawRoundedRect(ctx, midX - width / 2, midY - 14, width, 28, 5);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, midX, midY + 1);
    }
  });

  for (const node of state.nodes) {
    const img = await loadImage(node.image);
    ctx.save();
    drawRoundedRect(ctx, node.x + 10, node.y, 74, 74, 7);
    ctx.clip();
    ctx.drawImage(img, node.x + 10, node.y, 74, 74);
    ctx.restore();

    ctx.strokeStyle = node.color;
    ctx.lineWidth = 5;
    drawRoundedRect(ctx, node.x + 10, node.y, 74, 74, 7);
    ctx.stroke();

    ctx.font = "900 14px sans-serif";
    const nameLines = wrapText(ctx, node.name, 84);
    const nameHeight = Math.max(26, nameLines.length * 17 + 8);
    ctx.fillStyle = node.color;
    drawRoundedRect(ctx, node.x, node.y + 82, 94, nameHeight, 5);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    nameLines.forEach((line, i) => ctx.fillText(line, node.x + 47, node.y + 88 + i * 17));

    if (node.note) {
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#657182";
      wrapText(ctx, node.note, 90).forEach((line, i) => ctx.fillText(line, node.x + 47, node.y + 90 + nameHeight + i * 14));
    }
  }

  state.texts.forEach((text) => drawTextBox(ctx, text));

  canvas.toBlob((blob) => {
    if (blob) download(`${state.title || "relationship-chart"}.png`, blob);
  }, "image/png");
}

els.personForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const uploaded = await readSelectedFile(els.imageFile);
  addNode({
    name: els.personName.value.trim(),
    image: uploaded || pastedImage || fallbackImage,
    color: els.personColor.value
  });
  els.personForm.reset();
  setPastedImage("");
  els.personColor.value = "#2f8fff";
});
els.imageFile.addEventListener("change", async () => {
  const uploaded = await readSelectedFile(els.imageFile);
  if (uploaded) setPastedImage(uploaded);
});

els.pasteZone.addEventListener("paste", async (event) => {
  const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  await acceptImageFile(file);
});

document.addEventListener("paste", async (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
  const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  await acceptImageFile(file);
});

["dragenter", "dragover"].forEach((name) => {
  els.pasteZone.addEventListener(name, (event) => {
    event.preventDefault();
    els.pasteZone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((name) => {
  els.pasteZone.addEventListener(name, () => {
    els.pasteZone.classList.remove("drag-over");
  });
});
els.pasteZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
  await acceptImageFile(file);
});

els.editPasteZone.addEventListener("paste", async (event) => {
  const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  updateSelectedNodeImage(await readImageFile(file));
});

["dragenter", "dragover"].forEach((name) => {
  els.editPasteZone.addEventListener(name, (event) => {
    event.preventDefault();
    els.editPasteZone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((name) => {
  els.editPasteZone.addEventListener(name, () => {
    els.editPasteZone.classList.remove("drag-over");
  });
});
els.editPasteZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;
  updateSelectedNodeImage(await readImageFile(file));
});

els.relationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = new FormData(els.relationForm).get("relationType") || "friend";
  const defaults = relationDefaults[type] || relationDefaults.friend;
  addEdge({
    source: els.sourceNode.value,
    target: els.targetNode.value,
    label: els.relationLabel.value.trim(),
    color: els.relationColor.value || defaults.color,
    dashed: els.relationDashed.checked,
    bidirectional: els.relationBidirectional.checked,
    type
  });
  els.relationLabel.value = "";
});

document.querySelectorAll("[name='relationType']").forEach((radio) => {
  radio.addEventListener("change", () => {
    const defaults = relationDefaults[radio.value];
    if (radio.checked && defaults) els.relationColor.value = defaults.color;
  });
});

els.chartTitle.addEventListener("input", () => {
  state.title = els.chartTitle.value;
  persist();
});

els.editNodeName.addEventListener("input", () => updateSelectedNode({ name: els.editNodeName.value }));
els.editNodeImageFile.addEventListener("change", async () => {
  const image = await readSelectedFile(els.editNodeImageFile);
  if (!image) return;
  updateSelectedNodeImage(image);
});
els.editNodeNote.addEventListener("input", () => updateSelectedNode({ note: els.editNodeNote.value }));
els.editNodeColor.addEventListener("input", () => updateSelectedNode({ color: els.editNodeColor.value }));
els.editEdgeLabel.addEventListener("input", () => updateSelectedEdge({ label: els.editEdgeLabel.value }));
els.editEdgeColor.addEventListener("input", () => updateSelectedEdge({ color: els.editEdgeColor.value }));
els.editEdgeDashed.addEventListener("change", () => updateSelectedEdge({ dashed: els.editEdgeDashed.checked }));
els.editEdgeBidirectional.addEventListener("change", () => updateSelectedEdge({ bidirectional: els.editEdgeBidirectional.checked }));
els.editGroupName.addEventListener("input", () => updateSelectedGroup({ name: els.editGroupName.value }));
els.editGroupColor.addEventListener("input", () => updateSelectedGroup({ color: els.editGroupColor.value }));
els.addSelectedToGroup.addEventListener("click", addSelectedNodesToGroup);
els.deleteGroup.addEventListener("click", () => {
  const id = state.selected?.type === "group" ? state.selected.id : state.editingGroupId;
  if (id) deleteGroupById(id);
});
els.createGroup.addEventListener("click", createGroupFromSelection);
els.arrangeLabels.addEventListener("click", arrangeEdgeLabels);
els.addTextBox.addEventListener("click", addTextBox);
els.editTextContent.addEventListener("input", () => updateSelectedText({ text: els.editTextContent.value }));
els.editTextSize.addEventListener("input", () => updateSelectedText({ fontSize: Number(els.editTextSize.value) || 16 }));
els.editTextColor.addEventListener("input", () => updateSelectedText({ color: els.editTextColor.value }));
els.editTextBackground.addEventListener("input", () => updateSelectedText({ background: els.editTextBackground.value }));
document.querySelectorAll("[name='textAlign']").forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) updateSelectedText({ align: input.value });
  });
});
els.deleteTextBox.addEventListener("click", () => {
  if (state.selected?.type === "text") deleteTextById(state.selected.id);
});

els.deleteNode.addEventListener("click", () => {
  if (state.selected?.type === "node") deleteNodeById(state.selected.id);
});

els.deleteEdge.addEventListener("click", () => {
  const id = state.selected?.id;
  state.edges = state.edges.filter((edge) => edge.id !== id);
  select(null, null);
  normalizeCanvas({ renderAfter: true, persistAfter: true });
});

els.board.addEventListener("click", () => {
  if (els.board.dataset.panned === "true") {
    els.board.dataset.panned = "false";
    return;
  }
  setLinkSource(null);
  state.selectedNodeIds = [];
  state.editingGroupId = null;
  select(null, null);
});
els.viewport.addEventListener("pointerdown", startCanvasPan);
els.board.addEventListener("dragover", (event) => {
  const hasImageFile = Array.from(event.dataTransfer?.items || []).some((item) => item.kind === "file" && item.type.startsWith("image/"));
  if (hasImageFile) event.preventDefault();
});
els.board.addEventListener("drop", async (event) => {
  const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  await acceptImageFile(file, boardPointFromEvent(event));
});
els.viewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = els.board.getBoundingClientRect();
  const boardX = (event.clientX - rect.left) / state.scale;
  const boardY = (event.clientY - rect.top) / state.scale;
  const oldScale = state.scale;
  const factor = event.deltaY < 0 ? 1.08 : 0.92;
  setScale(state.scale * factor);
  const nextRect = els.board.getBoundingClientRect();
  els.viewport.scrollLeft += boardX * state.scale - boardX * oldScale + (nextRect.left - rect.left);
  els.viewport.scrollTop += boardY * state.scale - boardY * oldScale + (nextRect.top - rect.top);
  persist();
}, { passive: false });
els.zoomIn.addEventListener("click", () => {
  setScale(state.scale + 0.1);
  persist();
});
els.zoomOut.addEventListener("click", () => {
  setScale(state.scale - 0.1);
  persist();
});
els.fitView.addEventListener("click", () => {
  const scaleX = (els.viewport.clientWidth - 56) / BOARD.width;
  const scaleY = (els.viewport.clientHeight - 56) / BOARD.height;
  setScale(Math.min(1, scaleX, scaleY));
  els.viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
});
els.exportPng.addEventListener("click", exportPng);
els.clearAll.addEventListener("click", clearAll);
els.saveProject.addEventListener("click", saveJson);
els.loadProject.addEventListener("change", (event) => loadJson(event.target.files[0]));
els.newProject.addEventListener("click", resetProject);

if (!loadFromStorage()) {
  setCanvasSize(state.canvasWidth, state.canvasHeight);
  seedDemo();
  ensureCanvasForAll();
}
setScale(state.scale);
setPastedImage("");
bindColorPresets();
render();
