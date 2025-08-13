/* script.js
   安全说明：
   - 所有会显示给访客的可变文本都来自下面的常量（OWNER_* 等）。
   - 仅通过修改这些源码常量并在 GitHub 上提交（或通过受保护分支的流程）更新页面内容 —— 防止外部注入。
   - 渲染时使用 textContent / createElement（避免 innerHTML）。
*/

/* ========== OWNER-CONTROLLED CONTENT ========== */
/* 修改这些常量来更新“最近在忙的事项”/帖子/项目/笔记 */
const OWNER_BUSY = {
  en: "Working on a personal portfolio site, research notes on systems and large models.\nNext: polishing a small webapp.",
  zh: "正在开发个人作品集网站，整理系统与大模型的学习笔记。\n接下来：打磨一个小型 Web 应用。"
};

const OWNER_PROJECTS = [
  {
    id: "p1",
    title: { en: "Portfolio Site", zh: "个人主页" },
    summary: { en: "A lightweight bilingual static site.", zh: "一个轻量的中英双语静态站点。" }
  },
  {
    id: "p2",
    title: { en: "Study Notes", zh: "学习笔记" },
    summary: { en: "Collection of notes on algorithms & systems.", zh: "算法与系统的笔记集合。" }
  }
];

const OWNER_NOTES = [
  { id: "n1", title: { en: "Notes on BTree", zh: "B 树笔记" }, excerpt: { en: "Balanced tree structures...", zh: "平衡树结构..." } }
];

const OWNER_POSTS = [
  { id: "post1", date: "2025-08-13", en: "Hello — first public post.", zh: "你好 — 第一条公开帖子。" }
];
/* ========== END OWNER-CONTROLLED CONTENT ========== */

/* ====== Language handling ====== */
const SupportedLangs = ['en', 'zh'];
let currentLang = 'en'; // default

function setLanguage(lang){
  if(!SupportedLangs.includes(lang)) return;
  currentLang = lang;
  // Set attribute on <html> for screen readers / search engines
  document.documentElement.lang = (lang === 'zh') ? 'zh' : 'en';
  // Toggle visible elements
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.style.display = (el.getAttribute('data-lang') === lang) ? '' : 'none';
  });
  // Update lang button aria-pressed
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.langToggle === lang ? 'true' : 'false');
  });
}

/* ====== Render functions (safe: use textContent) ====== */
function renderBusy(){
  const box = document.getElementById('busy-content');
  box.textContent = currentLang === 'zh' ? OWNER_BUSY.zh : OWNER_BUSY.en;
}

function renderProjects(){
  const container = document.getElementById('projects-list');
  container.innerHTML = ''; // safe: we will append nodes
  OWNER_PROJECTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project';
    const title = document.createElement('h4');
    title.textContent = currentLang === 'zh' ? p.title.zh : p.title.en;
    const summ = document.createElement('p');
    summ.className = 'muted';
    summ.textContent = currentLang === 'zh' ? p.summary.zh : p.summary.en;
    card.appendChild(title);
    card.appendChild(summ);
    container.appendChild(card);
  });
}

function renderNotes(){
  const container = document.getElementById('notes-list');
  container.innerHTML = '';
  OWNER_NOTES.forEach(n => {
    const item = document.createElement('div');
    item.className = 'post';
    const h = document.createElement('h4');
    h.textContent = currentLang === 'zh' ? n.title.zh : n.title.en;
    const p = document.createElement('p');
    p.textContent = currentLang === 'zh' ? n.excerpt.zh : n.excerpt.en;
    item.appendChild(h);
    item.appendChild(p);
    container.appendChild(item);
  });
}

function renderPosts(){
  const container = document.getElementById('posts-list');
  container.innerHTML = '';
  OWNER_POSTS.forEach(p => {
    const e = document.createElement('article');
    e.className = 'post';
    const meta = document.createElement('div');
    meta.className = 'muted small';
    meta.textContent = `${p.date}`;
    const body = document.createElement('p');
    body.textContent = currentLang === 'zh' ? p.zh : p.en;
    e.appendChild(meta);
    e.appendChild(body);
    container.appendChild(e);
  });
}

/* ====== Interaction wiring ====== */
function wireLangButtons(){
  document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.langToggle);
      // re-render text areas that depend on language
      renderBusy();
      renderProjects();
      renderNotes();
      renderPosts();
    });
  });
}

function wireMenuToggle(){
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  menuBtn.addEventListener('click', () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!expanded));
    nav.style.display = expanded ? '' : 'block';
  });
}

/* ====== Mouse wheel support improvements (just ensure smooth behavior) ====== */
function enableWheelSmoothing(){
  // default scroll-behavior: smooth is set in CSS; also ensure sidebar handles wheels properly
  const sidebar = document.querySelector('.sidebar');
  if(!sidebar) return;
  // nothing fancy — let browser handle natural scrolling; ensure no JS stops it
}

/* ====== On load ====== */
document.addEventListener('DOMContentLoaded', () => {
  // initial language visibility setup
  // hide all localized blocks except for default
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.style.display = el.getAttribute('data-lang') === currentLang ? '' : 'none';
  });

  wireLangButtons();
  wireMenuToggle();
  enableWheelSmoothing();

  // initial renders
  renderBusy();
  renderProjects();
  renderNotes();
  renderPosts();

  // optional: keyboard shortcut L to toggle language (owner-friendly)
  document.addEventListener('keydown', (e) => {
    if((e.key === 'L' || e.key === 'l') && e.altKey){
      setLanguage(currentLang === 'en' ? 'zh' : 'en');
      renderBusy(); renderProjects(); renderNotes(); renderPosts();
    }
  });
});

