

/* ---------- 工具函数 ---------- */
// 选择器简写
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// 读取与设置语言（'zh' | 'en'）
const LANG_KEY = 'ws_lang';
const OWNER_KEY = 'ws_owner_mode';
const FOCUS_ZH_KEY = 'ws_focus_zh';
const FOCUS_EN_KEY = 'ws_focus_en';

// 获取 URL 查询参数
function getQuery() {
  return new URLSearchParams(window.location.search);
}

// 简单节流
function throttle(fn, wait = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

// 极简安全 HTML 清洗（白名单）
function sanitizeHTML(dirty) {
  // 创建独立文档解析
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');

  const WHITELIST_TAGS = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'UL', 'OL', 'LI',
    'STRONG', 'EM', 'B', 'I', 'U',
    'BR', 'HR', 'BLOCKQUOTE', 'CODE', 'PRE'
  ]);

  const WHITELIST_ATTRS = new Set([]); // 不允许任何属性（更安全）

  (function walk(node) {
    // 移除 script/style 等潜在危险
    if (node.nodeType === 1) {
      const tag = node.tagName;

      if (!WHITELIST_TAGS.has(tag)) {
        // 用其文本替换未知元素
        const text = doc.createTextNode(node.textContent || '');
        node.replaceWith(text);
        return;
      }

      // 清空所有属性
      for (const attr of Array.from(node.attributes)) {
        if (!WHITELIST_ATTRS.has(attr.name.toLowerCase())) {
          node.removeAttribute(attr.name);
        }
      }
    }

    // 递归
    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  })(doc.body);

  return doc.body.innerHTML;
}

/* ---------- 语言切换 ---------- */
function getCurrentLang() {
  const q = getQuery();
  if (q.get('lang') === 'en') return 'en';
  if (q.get('lang') === 'zh') return 'zh';
  return localStorage.getItem(LANG_KEY) || 'zh';
}

function applyLang(lang) {
  // 切换所有 data-zh / data-en 的文案
  $$('.lang-text').forEach(el => {
    const text = el.getAttribute(lang === 'zh' ? 'data-zh' : 'data-en');
    if (typeof text === 'string') el.textContent = text;
  });

  // 切换分语种块显示
  $$('.lang-content').forEach(el => {
    const shouldShow = el.getAttribute('data-lang') === lang;
    el.style.display = shouldShow ? '' : 'none';
  });

  // 导航链接的文案（这些也是 .lang-text，前面已处理，这里仅保险）
  $$('.nav-menu a').forEach(a => {
    const text = a.getAttribute(lang === 'zh' ? 'data-zh' : 'data-en');
    if (text) a.textContent = text;
  });

  // 切换按钮上的提示
  const langText = $('#langText');
  if (langText) {
    langText.textContent = lang === 'zh' ? 'English' : '中文';
  }

  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

function toggleLang() {
  const next = getCurrentLang() === 'zh' ? 'en' : 'zh';
  applyLang(next);
}

/* ---------- 模态框 ---------- */
const modals = {
  detail: $('#detailModal'),
  pro: $('#professionalModal')
};

function openModal(which) {
  const modal = modals[which];
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // 防滚动
}

function closeModal(which) {
  const modal = modals[which];
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// 点击按钮（HTML 内联调用）
window.showDetailedInfo = () => openModal('detail');
window.showProfessionalInfo = () => openModal('pro');

/* ---------- 平滑滚动 & 导航高亮 ---------- */
function enableSmoothScroll() {
  $$('.nav-menu a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const hash = a.getAttribute('href');
      const target = $(hash);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 90; // 顶部导航高度
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', hash);
    });
  });
}

function highlightOnScroll() {
  const sections = ['#home', '#education', '#current', '#projects', '#notes', '#posts']
    .map(id => $(id))
    .filter(Boolean);
  const menuLinks = $$('.nav-menu a');

  const onScroll = throttle(() => {
    const pos = window.scrollY + 120; // 提前量
    let currentId = '#home';
    for (const sec of sections) {
      if (sec.offsetTop <= pos) currentId = `#${sec.id}`;
    }
    menuLinks.forEach(a => {
      if (a.getAttribute('href') === currentId) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', onScroll);
  onScroll();
}

/* ---------- “最近在忙”仅本人可编辑（安全） ---------- */
function isOwnerMode() {
  const q = getQuery();
  if (q.get('owner') === '1') return true;
  return localStorage.getItem(OWNER_KEY) === '1';
}

function setOwnerMode(on) {
  if (on) localStorage.setItem(OWNER_KEY, '1');
  else localStorage.removeItem(OWNER_KEY);
  renderOwnerMode();
}

function getFocusNodes() {
  const box = $('.current-focus-box');
  const zh = $('.current-focus-box .lang-content[data-lang="zh"]');
  const en = $('.current-focus-box .lang-content[data-lang="en"]');
  return { box, zh, en };
}

function loadFocusFromStorage() {
  const { zh, en } = getFocusNodes();
  const savedZh = localStorage.getItem(FOCUS_ZH_KEY);
  const savedEn = localStorage.getItem(FOCUS_EN_KEY);
  if (savedZh) zh.innerHTML = savedZh;
  if (savedEn) en.innerHTML = savedEn;
}

function saveFocusToStorage() {
  const { zh, en } = getFocusNodes();
  // 清洗后再存
  const cleanZh = sanitizeHTML(zh.innerHTML);
  const cleanEn = sanitizeHTML(en.innerHTML);
  localStorage.setItem(FOCUS_ZH_KEY, cleanZh);
  localStorage.setItem(FOCUS_EN_KEY, cleanEn);
  // 再次赋值以移除任何潜在残留
  zh.innerHTML = cleanZh;
  en.innerHTML = cleanEn;
  toast('已保存 / Saved');
}

function handlePasteSanitized(e) {
  // 仅粘贴纯文本，防止引入恶意标签
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  document.execCommand('insertText', false, text);
}

function createOwnerToolbar() {
  let bar = $('#ownerToolbar');
  if (bar) return bar;

  bar = document.createElement('div');
  bar.id = 'ownerToolbar';
  bar.style.position = 'fixed';
  bar.style.bottom = '20px';
  bar.style.right = '20px';
  bar.style.zIndex = '1001';
  bar.style.background = 'rgba(0,0,0,0.75)';
  bar.style.color = '#fff';
  bar.style.borderRadius = '12px';
  bar.style.padding = '10px 12px';
  bar.style.display = 'flex';
  bar.style.gap = '8px';
  bar.style.fontSize = '14px';
  bar.style.boxShadow = '0 6px 20px rgba(0,0,0,.25)';

  const info = document.createElement('span');
  info.textContent = '编辑模式 (Owner)';
  info.style.opacity = '0.9';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '保存 Ctrl+S';
  saveBtn.style.background = '#87CEEB';
  saveBtn.style.border = 'none';
  saveBtn.style.borderRadius = '8px';
  saveBtn.style.padding = '6px 10px';
  saveBtn.style.cursor = 'pointer';

  const exitBtn = document.createElement('button');
  exitBtn.textContent = '退出';
  exitBtn.style.background = '#DDA0DD';
  exitBtn.style.border = 'none';
  exitBtn.style.borderRadius = '8px';
  exitBtn.style.padding = '6px 10px';
  exitBtn.style.cursor = 'pointer';

  saveBtn.addEventListener('click', saveFocusToStorage);
  exitBtn.addEventListener('click', () => setOwnerMode(false));

  bar.append(info, saveBtn, exitBtn);
  document.body.appendChild(bar);
  return bar;
}

function toast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.bottom = '80px';
  el.style.transform = 'translateX(-50%)';
  el.style.background = 'rgba(0,0,0,0.75)';
  el.style.color = '#fff';
  el.style.padding = '8px 12px';
  el.style.borderRadius = '10px';
  el.style.zIndex = '1002';
  el.style.fontSize = '14px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function renderOwnerMode() {
  const owner = isOwnerMode();
  const { zh, en, box } = getFocusNodes();

  // 帖子区强制只读（无论是否 owner）
  $$('#posts .post-card').forEach(card => {
    card.setAttribute('contenteditable', 'false');
  });

  if (!zh || !en || !box) return;

  if (owner) {
    zh.setAttribute('contenteditable', 'true');
    en.setAttribute('contenteditable', 'true');
    zh.addEventListener('paste', handlePasteSanitized);
    en.addEventListener('paste', handlePasteSanitized);
    createOwnerToolbar();
  } else {
    zh.removeAttribute('contenteditable');
    en.removeAttribute('contenteditable');
    const bar = $('#ownerToolbar');
    if (bar) bar.remove();
  }
}

/* ---------- 事件绑定 ---------- */
function bindModalEvents() {
  // 关闭按钮
  $$('#detailModal .close, #professionalModal .close').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.modal');
      if (parent === modals.detail) closeModal('detail');
      if (parent === modals.pro) closeModal('pro');
    });
  });

  // 点击遮罩关闭
  window.addEventListener('click', e => {
    if (e.target === modals.detail) closeModal('detail');
    if (e.target === modals.pro) closeModal('pro');
  });

  // ESC 关闭
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('detail');
      closeModal('pro');
    }
    // owner 快捷键
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === '.') {
      setOwnerMode(!isOwnerMode());
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      if (isOwnerMode()) {
        e.preventDefault();
        saveFocusToStorage();
      }
    }
  });
}

function bindLanguageToggle() {
  const btn = $('#langToggle');
  if (btn) btn.addEventListener('click', toggleLang);
}

/* ---------- 初始化 ---------- */
function init() {
  // 语言
  const lang = getCurrentLang();
  applyLang(lang);

  // 平滑滚动 + 高亮
  enableSmoothScroll();
  highlightOnScroll();

  // 模态框事件
  bindModalEvents();

  // 语言切换按钮
  bindLanguageToggle();

  // 加载“最近在忙”的本地保存内容
  loadFocusFromStorage();

  // 根据是否 owner 渲染编辑状态
  renderOwnerMode();

  // 支持通过 ?view=detail / ?view=pro 直接打开对应页面（以模态形式展示）
  const view = getQuery().get('view');
  if (view === 'detail') openModal('detail');
  if (view === 'pro' || view === 'professional') openModal('pro');

  // 初次进入时滚动到 hash
  if (location.hash) {
    const target = $(location.hash);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top });
    }
  }
}

// DOM 就绪
document.addEventListener('DOMContentLoaded', init);
