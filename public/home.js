// X Border Hub - Home page interactions
// Now includes simplified continent silhouettes as background
(function() {
  if (typeof regions === 'undefined' || typeof trends === 'undefined') {
    console.error('map-data.js が読み込まれていません');
    return;
  }

  // Simplified continent/region silhouettes (SVG paths)
  // Drawn to approximately match city coordinates in map-data.js
  const regionMaps = {
    asia: {
      // Japan, Korea, China coast, SE Asia mainland and islands
      shapes: [
        // China mainland (large blob upper-left to upper-mid)
        'M 5 30 L 60 25 L 130 30 L 175 50 L 195 70 L 200 95 L 175 105 L 150 110 L 110 105 L 70 95 L 35 80 L 15 60 Z',
        // Korea peninsula
        'M 250 15 L 275 18 L 280 35 L 268 55 L 255 55 Z',
        // Japan main island (Honshu)
        'M 215 35 L 240 45 L 260 60 L 268 78 L 250 88 L 230 78 L 218 60 Z',
        // Japan southern (Kyushu/Shikoku area)
        'M 218 65 L 235 75 L 230 92 L 215 88 Z',
        // Japan northern (Hokkaido)
        'M 255 12 L 280 18 L 280 35 L 265 38 Z',
        // SE Asia mainland (Vietnam/Thailand/Cambodia)
        'M 60 115 L 105 110 L 115 130 L 110 170 L 90 195 L 75 200 L 65 180 L 60 150 Z',
        // Malay peninsula
        'M 110 170 L 130 175 L 135 205 L 120 225 L 110 210 Z',
        // Taiwan
        'M 213 95 L 225 100 L 222 118 L 215 115 Z',
        // Hong Kong / Southern China nub
        'M 175 105 L 200 108 L 195 125 L 180 125 Z',
        // Philippines (rough archipelago)
        'M 195 145 L 215 145 L 218 175 L 200 178 L 192 165 Z',
        // Sumatra/Indonesia (long island)
        'M 90 220 L 145 218 L 165 230 L 155 250 L 100 245 Z',
        // Java
        'M 140 240 L 175 240 L 175 252 L 145 252 Z',
        // Borneo
        'M 160 200 L 195 200 L 200 230 L 175 235 L 158 220 Z',
      ],
      labels: [
        {text:'CHINA', x:85, y:80, size:9},
        {text:'INDONESIA', x:118, y:248, size:8},
      ],
    },
    japan: {
      // Japanese archipelago centered/zoomed
      shapes: [
        // Hokkaido (upper right)
        'M 240 35 L 285 30 L 290 60 L 275 75 L 250 70 Z',
        // Honshu main (the long one, top-right to bottom-left)
        'M 245 75 L 260 85 L 230 110 L 215 125 L 195 140 L 165 155 L 130 160 L 110 145 L 130 130 L 165 120 L 195 105 L 220 90 Z',
        // Kyushu (lower left)
        'M 70 175 L 105 175 L 110 200 L 85 215 L 65 205 Z',
        // Shikoku
        'M 120 165 L 155 162 L 158 180 L 130 185 Z',
        // Okinawa scatter
        'M 40 225 L 65 230 L 60 245 L 42 240 Z',
        'M 25 252 L 45 255 L 42 270 L 22 265 Z',
      ],
      labels: [
        {text:'日本 / JAPAN', x:155, y:265, size:10, weight:800},
      ],
    },
    namerica: {
      // North America simplified
      shapes: [
        // Mainland Canada/US/Mexico
        'M 35 30 L 90 25 L 140 28 L 200 30 L 270 35 L 295 60 L 290 95 L 270 120 L 250 145 L 240 180 L 235 220 L 215 240 L 180 245 L 150 230 L 125 215 L 105 195 L 85 180 L 70 165 L 55 145 L 45 120 L 35 90 L 30 60 Z',
        // Florida nub
        'M 235 200 L 260 210 L 258 235 L 240 230 Z',
        // Alaska
        'M 5 35 L 35 30 L 30 55 L 10 60 Z',
      ],
      labels: [
        {text:'NORTH AMERICA', x:140, y:115, size:11, weight:800},
      ],
    },
    europe: {
      // Europe simplified
      shapes: [
        // Mainland Europe
        'M 80 90 L 130 80 L 175 75 L 215 65 L 245 60 L 260 80 L 250 110 L 235 135 L 210 160 L 175 175 L 145 175 L 115 165 L 95 140 L 80 115 Z',
        // Scandinavia
        'M 175 20 L 215 18 L 230 50 L 215 65 L 195 60 L 180 45 Z',
        // British Isles
        'M 90 70 L 120 65 L 130 90 L 115 105 L 95 100 Z',
        'M 50 75 L 75 72 L 80 90 L 65 95 Z',
        // Iberia (Spain/Portugal)
        'M 75 180 L 115 175 L 120 210 L 95 220 L 75 205 Z',
        // Italy boot
        'M 175 155 L 195 155 L 200 195 L 190 215 L 178 195 Z',
      ],
      labels: [
        {text:'EUROPE', x:155, y:115, size:11, weight:800},
      ],
    },
    oceania: {
      shapes: [
        // Australia
        'M 40 145 L 110 135 L 175 138 L 235 145 L 275 160 L 280 200 L 260 230 L 215 240 L 165 235 L 115 230 L 75 215 L 50 195 L 38 170 Z',
        // Tasmania
        'M 205 240 L 225 245 L 220 260 L 208 258 Z',
        // New Zealand (2 islands)
        'M 290 195 L 310 200 L 308 225 L 295 220 Z',
        'M 295 230 L 320 235 L 318 260 L 300 255 Z',
        // PNG
        'M 175 95 L 230 95 L 235 115 L 200 120 L 175 115 Z',
      ],
      labels: [
        {text:'AUSTRALIA', x:140, y:195, size:11, weight:800},
        {text:'NZ', x:303, y:248, size:8},
      ],
    },
    africa: {
      shapes: [
        // Africa continent
        'M 75 50 L 130 40 L 180 45 L 230 55 L 260 75 L 270 110 L 260 145 L 240 175 L 215 210 L 190 240 L 165 250 L 140 240 L 115 215 L 95 180 L 80 145 L 70 110 L 68 80 Z',
        // Madagascar
        'M 260 175 L 280 180 L 280 220 L 268 225 Z',
      ],
      labels: [
        {text:'AFRICA', x:165, y:145, size:12, weight:800},
      ],
    },
  };

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
    const mapData = regionMaps[regionKey];
    if (!region) return;

    map.classList.add('swapping');

    setTimeout(() => {
      const cityMap = {};
      region.cities.forEach(c => cityMap[c.code] = c);

      let svg = '';

      // Background grid + defs
      svg += `<defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(10,31,61,0.04)" stroke-width="0.5"/>
        </pattern>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(10,31,61,0.06)" stroke-width="1"/>
        </pattern>
      </defs>`;

      // Ocean background (subtle blue tint)
      svg += `<rect width="360" height="280" fill="#E8F0F5"/>`;
      svg += `<rect width="360" height="280" fill="url(#grid)"/>`;

      // Continent shapes (LAND)
      if (mapData && mapData.shapes) {
        mapData.shapes.forEach(path => {
          // Slight shadow for depth
          svg += `<path d="${path}" fill="#FBF0DD" stroke="#0A1F3D" stroke-width="0.8" stroke-linejoin="round" opacity="0.95"/>`;
        });
      }

      // Region labels (light text on land)
      if (mapData && mapData.labels) {
        mapData.labels.forEach(l => {
          svg += `<text x="${l.x}" y="${l.y}" font-family="Bricolage Grotesque, sans-serif"
            font-size="${l.size}" font-weight="${l.weight || 700}"
            fill="rgba(10,31,61,0.25)" letter-spacing="0.15em" text-anchor="middle">${l.text}</text>`;
        });
      }

      // Flows (arcs)
      region.flows.forEach((flow, i) => {
        const from = cityMap[flow.from];
        const to = cityMap[flow.to];
        if (!from || !to) return;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 28 - flow.volume * 1.2;
        const strokeW = Math.max(1.8, flow.volume * 0.4);
        // White glow behind arc
        svg += `<path d="M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}"
          fill="none" stroke="#FFF6E8" stroke-width="${strokeW + 2}"
          stroke-linecap="round" opacity="0.7"/>`;
        // Actual flow arc
        svg += `<path d="M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}"
          fill="none" stroke="${flow.color}" stroke-width="${strokeW}"
          stroke-linecap="round" opacity="0.95"
          class="arc-flow" style="animation-delay:${i * 0.2}s"/>`;
      });

      // Cities
      region.cities.forEach(city => {
        const r = sizeMap[city.size] || 3;
        const color = city.color || '#3A4658';
        const isExternal = city.external;

        if (isExternal) {
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r}"
            fill="#FFF6E8" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
        } else {
          // White outline ring for clarity
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r + 2}"
            fill="#FFF6E8" opacity="0.9"/>`;
          // Halo for pulse
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r + 1.5}"
            fill="${color}" opacity="0.18"/>`;
          // Solid dot
          svg += `<circle cx="${city.x}" cy="${city.y}" r="${r}"
            fill="${color}" stroke="#0A1F3D" stroke-width="1"
            ${city.size === 'major' ? 'class="pulse-soft"' : ''}/>`;
        }

        // Labels with white background pill for readability
        let labelText = '', fontSize = 0, fontWeight = 0;
        if (city.size === 'major') {
          labelText = city.name; fontSize = 9; fontWeight = 800;
        } else if (city.size === 'medium') {
          labelText = city.name; fontSize = 7.5; fontWeight = 700;
        } else if (!isExternal && city.size === 'small') {
          labelText = city.name; fontSize = 6.5; fontWeight = 700;
        }

        if (labelText) {
          const labelX = city.x + r + 4;
          const labelY = city.y + 3;
          const textWidth = labelText.length * (fontSize * 0.55);
          // Background pill
          svg += `<rect x="${labelX - 2}" y="${labelY - fontSize + 1}"
            width="${textWidth + 4}" height="${fontSize + 2}"
            fill="#FFF6E8" rx="3" opacity="0.85"/>`;
          // Text
          svg += `<text x="${labelX}" y="${labelY}"
            font-family="Bricolage Grotesque, sans-serif"
            font-size="${fontSize}" font-weight="${fontWeight}"
            fill="#0A1F3D">${labelText}</text>`;
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
