// X Border Hub - Search page interactions

const options = {
  country: [
    {label:'🇸🇬 Singapore', count:234},
    {label:'🇯🇵 Japan - 東京', count:187},
    {label:'🇯🇵 Japan - 大阪', count:42},
    {label:'🇭🇰 Hong Kong', count:96},
    {label:'🇹🇭 Bangkok', count:72},
    {label:'🇻🇳 Ho Chi Minh', count:58},
    {label:'🇺🇸 New York', count:51},
    {label:'🇺🇸 San Francisco', count:43},
    {label:'🇮🇩 Jakarta', count:41},
    {label:'🇲🇾 Kuala Lumpur', count:34},
    {label:'🇰🇷 Seoul', count:29},
    {label:'🇹🇼 Taipei', count:26},
    {label:'🇬🇧 London', count:23},
    {label:'🇦🇺 Sydney', count:11},
  ],
  industry: [
    {label:'💻 Tech / IT', count:445},
    {label:'🏦 Finance / 金融', count:312},
    {label:'🚀 Startup', count:220},
    {label:'🏭 Manufacturing', count:156},
    {label:'🛍 Consumer', count:141},
    {label:'🏥 Healthcare', count:88},
    {label:'🛢 Energy', count:62},
    {label:'🎓 Education', count:54},
    {label:'📺 Media', count:48},
    {label:'⚖️ Legal', count:31},
    {label:'🏛 Government / NGO', count:19},
  ],
  role: [
    {label:'📐 Product Manager', count:189},
    {label:'⚙️ Engineer (Software)', count:167},
    {label:'💼 BD / Sales', count:152},
    {label:'📣 Marketing', count:98},
    {label:'🎨 Designer', count:61},
    {label:'📊 Finance / Accounting', count:54},
    {label:'👥 HR / People', count:38},
    {label:'🔬 Research / R&D', count:35},
    {label:'📈 Strategy / Consulting', count:32},
    {label:'🎯 Operations', count:28},
    {label:'⚖️ Legal / Compliance', count:14},
    {label:'🚀 Founder / CEO', count:12},
  ],
};

const labels = {
  country: '国・都市を選ぶ',
  industry: '業界を選ぶ',
  role: '職種を選ぶ',
};

const sideLabel = { from: '移動前(FROM)', to: '移動後(TO)' };

const state = {
  filters: { from: {}, to: {} },
  current: null,
};

const overlay = document.getElementById('modal-overlay');
const sheet = document.getElementById('modal-sheet');
const modalTitle = document.getElementById('modal-title');
const modalSub = document.getElementById('modal-sub');
const modalOptions = document.getElementById('modal-options');
const modalSearch = document.getElementById('modal-search');

function openModal(type, side) {
  state.current = { type, side };
  modalTitle.textContent = labels[type];
  modalSub.textContent = `${sideLabel[side]}を指定`;
  modalSearch.value = '';
  renderOptions('');
  overlay.classList.add('open');
  sheet.classList.add('open');
}

function closeModal() {
  overlay.classList.remove('open');
  sheet.classList.remove('open');
}

function renderOptions(query) {
  if (!state.current) return;
  const items = options[state.current.type];
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter(o => o.label.toLowerCase().includes(q)) : items;
  const currentSelection = state.filters[state.current.side][state.current.type];

  let html = `<div class="opt ${!currentSelection ? 'selected' : ''}" data-value="">
    <span class="font-bold text-[13px]">指定なし</span>
    <span class="opt-count text-[11px] text-ink-faint font-bold">全て</span>
  </div>`;

  html += filtered.map(o => `
    <div class="opt ${currentSelection === o.label ? 'selected' : ''}" data-value="${o.label}">
      <span class="font-bold text-[13px]">${o.label}</span>
      <span class="opt-count text-[11px] text-ink-faint font-bold">${o.count}人</span>
    </div>
  `).join('');

  modalOptions.innerHTML = html;

  modalOptions.querySelectorAll('.opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value;
      if (val === '') {
        delete state.filters[state.current.side][state.current.type];
      } else {
        state.filters[state.current.side][state.current.type] = val;
      }
      updateFilterButtons();
      updateResultMeta();
      closeModal();
    });
  });
}

modalSearch.addEventListener('input', e => renderOptions(e.target.value));
overlay.addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.type, btn.dataset.side));
});

function updateFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const v = state.filters[btn.dataset.side][btn.dataset.type];
    const placeholder = btn.querySelector('.placeholder');
    const value = btn.querySelector('.value');
    if (v) {
      btn.classList.add('filled');
      placeholder.classList.add('hidden');
      value.classList.remove('hidden');
      const shortLabel = v.length > 12 ? v.slice(0, 11) + '…' : v;
      value.textContent = shortLabel;
    } else {
      btn.classList.remove('filled');
      placeholder.classList.remove('hidden');
      value.classList.add('hidden');
    }
  });
}

function updateResultMeta() {
  const parts = [];
  const fromCountry = state.filters.from.country;
  const toCountry = state.filters.to.country;
  const fromInd = state.filters.from.industry;
  const toInd = state.filters.to.industry;
  const fromRole = state.filters.from.role;
  const toRole = state.filters.to.role;

  if (fromCountry || toCountry) {
    parts.push(`${fromCountry || '全て'} → ${toCountry || '全て'}`);
  } else {
    parts.push('すべての経路');
  }
  if (fromInd || toInd) {
    parts.push(`${fromInd || '全業界'} → ${toInd || '全業界'}`);
  } else {
    parts.push('全業界');
  }
  if (fromRole || toRole) {
    parts.push(`${fromRole || '全職種'} → ${toRole || '全職種'}`);
  } else {
    parts.push('全職種');
  }

  document.getElementById('result-meta').textContent = parts.join(' · ');

  let count = 47;
  Object.values(state.filters.from).forEach(_ => count = Math.max(2, Math.floor(count * 0.55)));
  Object.values(state.filters.to).forEach(_ => count = Math.max(2, Math.floor(count * 0.6)));
  document.getElementById('result-count').textContent = count;
}

document.getElementById('clear-all').addEventListener('click', () => {
  state.filters = { from: {}, to: {} };
  updateFilterButtons();
  updateResultMeta();
});

document.querySelectorAll('.sort-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-tab').forEach(b => {
      b.classList.remove('active');
      b.classList.add('text-ink-soft');
    });
    btn.classList.add('active');
    btn.classList.remove('text-ink-soft');
  });
});
