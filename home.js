// X Border Hub - Home page interactions
(function() {
  if (typeof regions === 'undefined' || typeof trends === 'undefined') {
    console.error('map-data.js が読み込まれていません');
    return;
  }

  const sizeMap = {
    major: 6,
    medium: 4.5,
    small: 3,
    mini: 2.5,
  };

  function drawMap(regionKey) {
    const map = document.getElementById('migration-map');
    if (!map) return;
    const region = regions[regionKey];
    if (!region) return;

    map.classList.add('swapping');

    setTimeout(() => {
      // Build SVG content
      const cityMap = {};
      region.cities.forEach(c => cityMap[c.code] = c);

      let svg = '';

      // Background grid lines (decorative)
      svg += `<defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(10,31,61,0.05)" stroke-width="0.5"/>
        </pattern>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="currentColor"/>
        </marker>
      </defs>`;
      svg += `<rect width="360" height="280" fill="url(#grid)"/>`;

      // Flows (arcs)
      region.flows.forEach((flow, i) => {
        const from = cityMap[flow.from];
        const to = cityMap[flow.to];
        if (!from || !to) return;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 28 - flow.volume * 1.2;
        const strokeW = Math.max(1.5, flow.volume * 0.35);
        svg += `<path d="M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}"
          fill="none" stroke="${flow.color}" stroke-width="${strokeW}"
          stroke-linecap="round" opacity="0.85"
          class="arc-flow" style="animation-delay:${i * 0.2}s"/>`;
      });

      // Cities
      region.cities.forEach(city => {
        const r = sizeMap[city.size] || 3;
        const color = city.color || '#3A4658';
        const isExternal = city.external;

        if (isExternal) {
          // Dashed circle for off-region cities
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r}"
            fill="#FFF6E8" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
        } else {
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r + 1.5}"
            fill="${color}" opacity="0.15"/>`;
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r}"
            fill="${color}" stroke="#0A1F3D" stroke-width="1"
            ${city.size === 'major' ? 'class="pulse-soft"' : ''}/>`;
        }

        // Labels: major and medium cities get name labels
        if (city.size === 'major') {
          svg += `<text x="${city.x + r + 4}" y="${city.y + 3}" font-family="Bricolage Grotesque, sans-serif"
            font-size="9" font-weight="800" fill="#0A1F3D">${city.name}</text>`;
        } else if (city.size === 'medium') {
          svg += `<text x="${city.x + r + 3}" y="${city.y + 2}" font-family="Bricolage Grotesque, sans-serif"
            font-size="7.5" font-weight="700" fill="#3A4658">${city.name}</text>`;
        } else if (!isExternal) {
          svg += `<text x="${city.x + r + 2}" y="${city.y + 2}" font-family="Manrope, sans-serif"
            font-size="6.5" font-weight="600" fill="#7C8597">${city.code}</text>`;
        }
      });

      map.innerHTML = svg;

      // Update label
      const label = document.getElementById('region-label');
      if (label) label.textContent = region.label;
      const weekNum = document.getElementById('week-num');
      if (weekNum) weekNum.textContent = region.weekTotal;
      const weekTotal = document.getElementById('week-total');
      if (weekTotal) weekTotal.textContent = region.weekTotal;

      // Top flows
      const tf = document.getElementById('top-flows');
      if (tf) {
        tf.innerHTML = region.topFlows.map(f => `
          <div class="flex items-center justify-between text-[12px]">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" style="background:${f.color}"></span>
              <span class="font-bold text-ink">${f.label}</span>
            </div>
            <span class="text-[11px] font-bold" style="color:${f.color}">${f.vol}</span>
          </div>
        `).join('');
      }

      map.classList.remove('swapping');
    }, 100);
  }

  function renderTrend(type) {
    const list = document.getElementById('trend-list');
    if (!list) return;
    const data = trends[type] || [];
    list.innerHTML = data.map(item => {
      const isUp = item.change >= 0;
      const arrow = isUp ? '↗' : '↘';
      const color = isUp ? '#1FA89E' : '#6B4F8E';
      return `
        <div class="flex items-center justify-between bg-cream border-[1.5px] border-ink rounded-2xl px-4 py-3 shadow-pop-sm">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="text-lg flex-shrink-0">${item.flag}</span>
            <div class="min-w-0">
              <p class="font-bold text-[13px] text-ink truncate">${item.name}</p>
              <p class="text-[10px] text-ink-faint">${item.count}人が記録</p>
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <span style="color:${color}" class="font-bold text-[13px]">${arrow}</span>
            <span style="color:${color}" class="font-bold text-[13px]">${isUp ? '+' : ''}${item.change}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Region buttons
  document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      drawMap(btn.dataset.region);
    });
  });

  // Trend tabs
  document.querySelectorAll('.trend-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.trend-tab').forEach(b => {
        b.classList.remove('active');
        b.classList.add('text-ink-soft');
      });
      btn.classList.add('active');
      btn.classList.remove('text-ink-soft');
      renderTrend(btn.dataset.trend);
    });
  });

  // Initial render
  drawMap('asia');
  renderTrend('country');
})();
