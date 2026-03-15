/* ============================================
   ISO 27001 Explorer — Application
   ============================================ */

const state = {
  controls: null,
  domains: null,
  requirements: {},
  evidence: null,
  riskMgmt: {},
  crossRefs: {},
  templates: null,
  route: { view: 'overview' }
};

const cache = new Map();

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache.set(path, data);
    return data;
  } catch (e) {
    console.error(`Failed to load ${path}:`, e);
    return null;
  }
}

/* ---- Router ---- */
function parseHash() {
  const hash = location.hash.slice(1);
  if (!hash) return { view: 'overview' };
  if (hash === 'controls') return { view: 'controls' };
  if (hash.startsWith('control/')) return { view: 'control-detail', slug: hash.slice(8) };
  if (hash === 'requirements') return { view: 'requirements' };
  if (hash === 'risk-management') return { view: 'risk-management' };
  if (hash.startsWith('risk/')) return { view: 'risk-management', sub: hash.slice(5) };
  if (hash === 'reference') return { view: 'reference' };
  if (hash.startsWith('search/')) return { view: 'search', query: decodeURIComponent(hash.slice(7)) };
  return { view: 'overview' };
}

function navigate(hash) { location.hash = hash; }

/* ---- Data Loading ---- */
async function loadData() {
  const [controls, domains, evidence, methodology, register, nistMap, rmitMap, soa] = await Promise.all([
    fetchJSON('controls/library.json'),
    fetchJSON('controls/domains.json'),
    fetchJSON('evidence/index.json'),
    fetchJSON('risk-management/methodology.json'),
    fetchJSON('risk-management/risk-register.json'),
    fetchJSON('cross-references/nist-mapping.json'),
    fetchJSON('cross-references/rmit-mapping.json'),
    fetchJSON('templates/soa-template.json')
  ]);

  state.controls = controls;
  state.domains = domains;
  state.evidence = evidence;
  state.riskMgmt = { methodology, register };
  state.crossRefs = { nist: nistMap, rmit: rmitMap };
  state.templates = soa;

  // Load requirements per domain
  const domainSlugs = ['organizational', 'people', 'physical', 'technological'];
  const reqResults = await Promise.all(
    domainSlugs.map(d => fetchJSON(`requirements/by-domain/${d}.json`))
  );
  domainSlugs.forEach((d, i) => { state.requirements[d] = reqResults[i]; });
}

/* ---- Render Helpers ---- */
function getAllControls() {
  if (!state.controls) return [];
  const all = [];
  for (const domain of ['organizational', 'people', 'physical', 'technological']) {
    const controls = state.controls[domain] || [];
    controls.forEach(c => all.push({ ...c, domain }));
  }
  return all;
}

function renderBadge(text, cls) {
  return `<span class="badge ${cls}">${escHtml(text)}</span>`;
}

function renderDomainBadge(domain) {
  const names = { organizational: 'Organizational', people: 'People', physical: 'Physical', technological: 'Technological' };
  const colors = { organizational: '#2563EB', people: '#7C3AED', physical: '#D97706', technological: '#0891B2' };
  return `<span class="badge badge-domain" style="--domain-color:${colors[domain]}">${names[domain]}</span>`;
}

function renderTypeBadge(type) {
  const cls = { preventive: 'badge-type-preventive', detective: 'badge-type-detective', corrective: 'badge-type-corrective' };
  return `<span class="badge ${cls[type] || 'badge-category'}">${type}</span>`;
}

/* ---- Views ---- */
function renderOverview() {
  const allControls = getAllControls();
  const domains = state.controls ? state.controls.domains : [];
  return `
    <div class="main">
      <div class="disclaimer">
        <strong>Constructed-Indicative Content.</strong> This explorer contains paraphrased and indicative content based on ISO/IEC 27001:2022.
        It is not a substitute for the official standard. Organizations must purchase and reference the official ISO/IEC 27001:2022 document for certification purposes.
      </div>
      <div class="stats-banner">
        <div class="stat"><div class="stat-value">93</div><div class="stat-label">Annex A Controls</div></div>
        <div class="stat"><div class="stat-value">4</div><div class="stat-label">Themes</div></div>
        <div class="stat"><div class="stat-value">${state.evidence ? state.evidence.evidence.length : 0}</div><div class="stat-label">Evidence Items</div></div>
        <div class="stat"><div class="stat-value">${state.riskMgmt.register ? state.riskMgmt.register.risks.length : 0}</div><div class="stat-label">Risk Items</div></div>
      </div>
      <h2 style="margin-bottom:1rem">Annex A Themes</h2>
      <div class="control-grid">
        ${domains.map(d => `
          <div class="control-card" onclick="navigate('controls')">
            <div class="control-card-header">
              ${renderDomainBadge(d.slug)}
            </div>
            <div class="control-card-title">${escHtml(d.name)}</div>
            <div class="control-card-desc">${escHtml(d.description)}</div>
            <div class="control-card-meta">
              <span class="badge badge-category">${(state.controls[d.slug] || []).length} controls</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderControls() {
  const allControls = getAllControls();
  let activeDomain = 'all';

  function render(domain) {
    const filtered = domain === 'all' ? allControls : allControls.filter(c => c.domain === domain);
    return `
      <div class="main">
        <h2 style="margin-bottom:1rem">Annex A Controls (${filtered.length})</h2>
        <div class="domain-filter">
          <button class="domain-pill ${domain === 'all' ? 'active' : ''}" onclick="window._filterDomain('all')">All (93)</button>
          <button class="domain-pill ${domain === 'organizational' ? 'active' : ''}" onclick="window._filterDomain('organizational')">Organizational (37)</button>
          <button class="domain-pill ${domain === 'people' ? 'active' : ''}" onclick="window._filterDomain('people')">People (8)</button>
          <button class="domain-pill ${domain === 'physical' ? 'active' : ''}" onclick="window._filterDomain('physical')">Physical (14)</button>
          <button class="domain-pill ${domain === 'technological' ? 'active' : ''}" onclick="window._filterDomain('technological')">Technological (34)</button>
        </div>
        <div class="control-grid">
          ${filtered.map(c => `
            <div class="control-card domain-${c.domain}" onclick="navigate('control/${c.slug}')">
              <div class="control-card-header">
                <span class="control-id">${escHtml(c.id)}</span>
                ${renderDomainBadge(c.domain)}
              </div>
              <div class="control-card-title">${escHtml(c.name)}</div>
              <div class="control-card-desc">${escHtml(c.description)}</div>
              <div class="control-card-meta">
                ${renderTypeBadge(c.type)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  window._filterDomain = function(d) {
    activeDomain = d;
    document.getElementById('app').innerHTML = render(d);
  };

  return render(activeDomain);
}

function renderControlDetail(slug) {
  const allControls = getAllControls();
  const ctrl = allControls.find(c => c.slug === slug);
  if (!ctrl) return '<div class="main"><div class="error-state"><h2>Control not found</h2></div></div>';

  const evidenceItems = state.evidence ? state.evidence.evidence.filter(e => e.controlRef === ctrl.id) : [];

  return `
    <div class="main">
      <nav class="breadcrumbs">
        <a href="#controls">Controls</a><span class="sep">›</span>
        <span class="current">${escHtml(ctrl.id)} ${escHtml(ctrl.name)}</span>
      </nav>
      <div class="control-detail">
        <div class="control-detail-header">
          <div class="control-detail-id-row">
            <span class="control-id" style="font-size:1rem">${escHtml(ctrl.id)}</span>
            ${renderDomainBadge(ctrl.domain)}
            ${renderTypeBadge(ctrl.type)}
          </div>
          <h2 class="control-detail-title">${escHtml(ctrl.name)}</h2>
          <p class="control-detail-desc">${escHtml(ctrl.description)}</p>
        </div>
        ${ctrl.keyActivities ? `
          <div class="detail-section">
            <h3 class="detail-section-title">Key Activities</h3>
            <ul class="activity-list">
              ${ctrl.keyActivities.map(a => `<li>${escHtml(a)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${evidenceItems.length > 0 ? `
          <div class="detail-section">
            <h3 class="detail-section-title">Evidence Items</h3>
            ${evidenceItems.map(e => `
              <div class="evidence-item">
                <div class="evidence-item-header">
                  <span class="evidence-id">${escHtml(e.id)}</span>
                  <span class="evidence-item-name">${escHtml(e.name)}</span>
                </div>
                <p class="evidence-item-desc">${escHtml(e.description)}</p>
                <div class="evidence-item-meta">
                  <span><strong>Format:</strong> ${escHtml(e.format)}</span>
                  <span><strong>Frequency:</strong> ${escHtml(e.frequency)}</span>
                  <span><strong>Owner:</strong> ${escHtml(e.owner)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>`;
}

function renderRequirements() {
  const domains = ['organizational', 'people', 'physical', 'technological'];
  const names = { organizational: 'Organizational', people: 'People', physical: 'Physical', technological: 'Technological' };

  return `
    <div class="main">
      <h2 style="margin-bottom:1rem">Requirements by Theme</h2>
      ${domains.map(d => {
        const req = state.requirements[d];
        if (!req) return '';
        return `
          <div class="detail-section">
            <h3 class="detail-section-title">${names[d]} (${req.requirements.length} requirements)</h3>
            ${req.requirements.map(r => `
              <div class="artifact-card">
                <div class="artifact-card-header">
                  <span class="artifact-card-name">${escHtml(r.id)} — ${escHtml(r.requirement).slice(0, 80)}…</span>
                  <span class="badge ${r.priority === 'critical' ? 'badge-mandatory' : r.priority === 'high' ? 'badge-type-corrective' : 'badge-category'}">${r.priority}</span>
                </div>
                <p class="artifact-card-desc">${escHtml(r.requirement)}</p>
                <div class="artifact-card-meta">
                  <span class="meta-item"><strong>Control:</strong> ${escHtml(r.controlRef)}</span>
                  <span class="meta-item"><strong>Owner:</strong> ${escHtml(r.owner)}</span>
                </div>
              </div>
            `).join('')}
          </div>`;
      }).join('')}
    </div>`;
}

function renderRiskManagement() {
  const meth = state.riskMgmt.methodology;
  const reg = state.riskMgmt.register;

  return `
    <div class="main">
      <h2 style="margin-bottom:1rem">Risk Management</h2>
      ${meth ? `
        <div class="detail-section">
          <h3 class="detail-section-title">Methodology</h3>
          <p style="color:var(--text-secondary);margin-bottom:1rem">${escHtml(meth.description)}</p>
          <div class="requirements-grid">
            ${meth.riskRating.bands.map(b => `
              <div class="requirement-block" style="background:${b.color}15;border-color:${b.color}">
                <div class="requirement-block-label" style="color:${b.color}">${b.label} (${b.range[0]}-${b.range[1]})</div>
                <p style="font-size:var(--font-size-sm);color:var(--text-secondary)">${escHtml(b.action)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${reg ? `
        <div class="detail-section">
          <h3 class="detail-section-title">Risk Register (${reg.risks.length} risks)</h3>
          ${reg.risks.map(r => {
            const color = r.inherentRisk >= 16 ? '#ef4444' : r.inherentRisk >= 10 ? '#f97316' : r.inherentRisk >= 5 ? '#f59e0b' : '#22c55e';
            const resColor = r.residualRisk >= 16 ? '#ef4444' : r.residualRisk >= 10 ? '#f97316' : r.residualRisk >= 5 ? '#f59e0b' : '#22c55e';
            return `
              <div class="artifact-card">
                <div class="artifact-card-header">
                  <span class="artifact-card-name">${escHtml(r.id)} — ${escHtml(r.title)}</span>
                  <div style="display:flex;gap:0.5rem">
                    <span class="risk-score-badge" style="background:${color}20;color:${color}">Inherent: ${r.inherentRisk}</span>
                    <span class="risk-score-badge" style="background:${resColor}20;color:${resColor}">Residual: ${r.residualRisk}</span>
                  </div>
                </div>
                <p class="artifact-card-desc">${escHtml(r.description)}</p>
                <div class="artifact-card-meta">
                  <span class="meta-item"><strong>Category:</strong> ${escHtml(r.category)}</span>
                  <span class="meta-item"><strong>Control:</strong> ${escHtml(r.annexRef)}</span>
                  <span class="meta-item"><strong>Treatment:</strong> ${escHtml(r.treatment)}</span>
                  <span class="meta-item"><strong>Owner:</strong> ${escHtml(r.owner)}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      ` : ''}
    </div>`;
}

function renderReference() {
  return `
    <div class="main">
      <h2 style="margin-bottom:1rem">Cross-References</h2>
      ${state.crossRefs.nist ? `
        <div class="detail-section">
          <h3 class="detail-section-title">ISO 27001 → NIST CSF 2.0 (${state.crossRefs.nist.mappings.length} mappings)</h3>
          <div class="fw-mappings">
            ${state.crossRefs.nist.mappings.map(m => `
              <div class="xref-card">
                <span class="xref-source">${escHtml(m.isoControl)}</span>
                <span class="badge badge-category">${escHtml(m.relationship)}</span>
                <span class="xref-target">${escHtml(m.nistFunction)} / ${escHtml(m.nistSubcategory)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${state.crossRefs.rmit ? `
        <div class="detail-section">
          <h3 class="detail-section-title">ISO 27001 → BNM RMiT (${state.crossRefs.rmit.mappings.length} mappings)</h3>
          <div class="fw-mappings">
            ${state.crossRefs.rmit.mappings.map(m => `
              <div class="xref-card">
                <span class="xref-source">${escHtml(m.isoControl)}</span>
                <span class="badge badge-category">${escHtml(m.relationship)}</span>
                <span class="xref-target">${escHtml(m.rmitSection)} (${escHtml(m.rmitClause)})</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${state.templates ? `
        <div class="detail-section">
          <h3 class="detail-section-title">Statement of Applicability Template</h3>
          <p style="color:var(--text-secondary);margin-bottom:1rem">${escHtml(state.templates.description)}</p>
          <p style="color:var(--text-muted);font-size:var(--font-size-sm)">${escHtml(state.templates.instructions)}</p>
        </div>
      ` : ''}
    </div>`;
}

function renderSearch(query) {
  const allControls = getAllControls();
  const q = query.toLowerCase();
  const results = allControls.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q)
  );

  return `
    <div class="main">
      <p class="search-results-header">${results.length} result${results.length !== 1 ? 's' : ''} for "${escHtml(query)}"</p>
      <div class="control-grid">
        ${results.map(c => `
          <div class="control-card" onclick="navigate('control/${c.slug}')">
            <div class="control-card-header">
              <span class="control-id">${escHtml(c.id)}</span>
              ${renderDomainBadge(c.domain)}
            </div>
            <div class="control-card-title">${escHtml(c.name)}</div>
            <div class="control-card-desc">${escHtml(c.description)}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

/* ---- Export ---- */
function exportToCSV() {
  const allControls = getAllControls();
  const rows = [['ID', 'Name', 'Theme', 'Type', 'Description']];
  allControls.forEach(c => {
    rows.push([c.id, c.name, c.domain, c.type, c.description.replace(/"/g, '""')]);
  });
  const csv = rows.map(r => r.map(f => `"${f}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'iso27001-controls.csv';
  a.click();
}

/* ---- Router + Render ---- */
async function render() {
  const app = document.getElementById('app');
  const route = parseHash();
  state.route = route;

  // Update active nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === route.view);
  });

  switch (route.view) {
    case 'overview': app.innerHTML = renderOverview(); break;
    case 'controls': app.innerHTML = renderControls(); break;
    case 'control-detail': app.innerHTML = renderControlDetail(route.slug); break;
    case 'requirements': app.innerHTML = renderRequirements(); break;
    case 'risk-management': app.innerHTML = renderRiskManagement(); break;
    case 'reference': app.innerHTML = renderReference(); break;
    case 'search': app.innerHTML = renderSearch(route.query); break;
    default: app.innerHTML = renderOverview();
  }
}

/* ---- Init ---- */
async function init() {
  await loadData();
  render();
  window.addEventListener('hashchange', render);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        navigate('search/' + encodeURIComponent(searchInput.value.trim()));
      }
    });
  }
}

init();
