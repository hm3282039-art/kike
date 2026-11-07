/**
 * Vérification statique du projet (sans navigateur).
 *  - ids utilisés par app.js présents dans index.html
 *  - <use href="#..."> pointant vers un <symbol> existant
 *  - classes générées dynamiquement présentes dans le CSS compilé
 *  - balises HTML équilibrées
 *  - sections clés du jeu présentes
 *
 * Usage : npm run check
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/app.css"), "utf8");

const problems = [];
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

// 1. ids demandés par le JS
const jsIds = new Set([...js.matchAll(/\$\("#([A-Za-z0-9_-]+)"/g)].map((m) => m[1]));
[...jsIds].forEach((id) => {
  if (!ids.has(id)) problems.push(`id manquant dans le HTML : #${id}`);
});
// ids passés en tableau / helper set("#id", ...) — on ignore les couleurs hex et le pseudo-ID joueur
const HEX_OR_LABEL = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$|^#[A-Z]{2}-\d+$/;
for (const [, id] of js.matchAll(/"#([A-Za-z0-9_-]+)"/g)) {
  if (HEX_OR_LABEL.test(`#${id}`)) continue;
  if (!ids.has(id)) problems.push(`id manquant dans le HTML (référence JS) : #${id}`);
}

// 2. symboles SVG
const symbols = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
for (const [, ref] of html.matchAll(/<use href="#([^"]+)"/g)) {
  if (!symbols.has(ref)) problems.push(`symbole SVG introuvable : #${ref}`);
}
for (const [, ref] of js.matchAll(/<use href=\\?"#([^"\\]+)/g)) {
  if (!symbols.has(ref)) problems.push(`symbole SVG introuvable (JS) : #${ref}`);
}

// 3. classes générées dynamiquement
const cssNorm = css.replace(/\\/g, "");
const dynamicClasses = new Set();
for (const [, cls] of js.matchAll(/class="([^"$]*?)"/g)) {
  cls.split(/\s+/).filter(Boolean).forEach((c) => dynamicClasses.add(c));
}
const missing = [];
dynamicClasses.forEach((cls) => {
  if (cls.includes("${")) return;
  const base = cls.replace(/^!/, "");
  if (!cssNorm.includes("." + base)) missing.push(cls);
});
missing.forEach((c) => problems.push(`classe absente du CSS compilé : ${c}`));

// 4. balises HTML équilibrées
const voids = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "use", "path", "circle", "rect", "ellipse", "stop", "polygon", "line"]);
const stack = [];
for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
  const [, closing, tag, attrs] = m;
  const t = tag.toLowerCase();
  if (voids.has(t) || attrs.trim().endsWith("/")) continue;
  if (!closing) stack.push(t);
  else {
    const last = stack.pop();
    if (last !== t) problems.push(`balise mal fermée : <${last}> fermée par </${tag}>`);
  }
}
if (stack.length) problems.push(`balises non fermées : ${stack.join(", ")}`);

// 5. sections clés
["arena", "tray", "colorGrid", "betChips", "duelBtn", "myDuelCard", "botDuelCard", "historyList", "chatList", "lockerModal", "profileFrame", "lobbyList", "viewCreate", "viewHistory"]
  .forEach((id) => { if (!ids.has(id)) problems.push(`section clé manquante : #${id}`); });

// 6. les 6 couleurs sont présentes dans les données du jeu
["red", "blue", "green", "yellow", "purple", "orange"].forEach((c) => {
  if (!js.includes(`id: "${c}"`)) problems.push(`couleur manquante dans app.js : ${c}`);
});

if (problems.length) {
  console.log("PROBLEMES :");
  problems.forEach((p) => console.log(" - " + p));
  process.exit(1);
}
console.log(`OK — ${ids.size} ids, ${symbols.size} symboles, ${dynamicClasses.size} classes JS vérifiés.`);
