/**
 * Standalone preview harness for src/features/inspiration.ts.
 *
 * NOT a repo file. It exists so Participant 2 can see the import flow work in a
 * real browser before Participant 5 wires the module into the shared app.
 * It is deliberately dependency-free and reuses the module's real exports.
 */

import {
  DEMO_IMPORT_DISCLAIMER,
  DEMO_SOURCE_PLACEHOLDER,
  DEFAULT_TRANSFER_MINUTES,
  candidateToPlanningStop,
  extractDemoCandidates,
  summariseImport,
  type InspirationCandidate,
} from '../../../src/features/inspiration';

const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

const input = $('source') as HTMLTextAreaElement;
const importBtn = $('import') as HTMLButtonElement;
const resetBtn = $('reset') as HTMLButtonElement;
const banner = $('banner');
const list = $('list');
const map = $('map');
const dayPanel = $('day');
const dayCount = $('day-count');

input.value = DEMO_SOURCE_PLACEHOLDER;

const added: Array<{ day: number; order: number; json: string }> = [];

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function chips(c: InspirationCandidate): string {
  const items = [
    `${c.costEUR === 0 ? 'Free' : `€${c.costEUR.toFixed(2)}`}`,
    `${c.durationMinutes} min`,
    c.indoor ? 'Indoor' : 'Outdoor',
    c.weatherRisk ? 'Weather risk' : null,
  ].filter(Boolean) as string[];
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join('');
}

function render(): void {
  const candidates = extractDemoCandidates(input.value);
  const summary = summariseImport(input.value);

  banner.innerHTML = `
    <span class="dot"></span>
    <strong>${esc(summary.label)}</strong>
    <span class="banner-note">${summary.matchedCount} of ${summary.totalCount} signals matched your paste · no social platform was accessed</span>`;

  list.innerHTML = candidates
    .map(
      (c) => `
    <article class="card">
      <div class="card-head">
        <h3>${esc(c.name)}</h3>
        <span class="badge ${c.confidence}">${c.confidence}</span>
      </div>
      <p class="meta">${esc(c.sourceLabel)} · ${esc(c.category)}</p>
      <p class="reason">${esc(c.extractionReason)}</p>
      <p class="note">${esc(c.note)}</p>
      <div class="chips">${chips(c)}</div>
      <button class="add" data-id="${esc(c.id)}">Add to day 1 · ${DEFAULT_TRANSFER_MINUTES} min transfer</button>
    </article>`,
    )
    .join('');

  map.innerHTML = candidates
    .map(
      (c) => `<span class="pin" style="left:${c.x}%;top:${c.y}%" title="${esc(c.name)}">${esc(c.name.split(' ')[0])}</span>`,
    )
    .join('');

  list.querySelectorAll<HTMLButtonElement>('button.add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const candidate = extractDemoCandidates(input.value).find((c) => c.id === btn.dataset.id);
      if (!candidate) return;
      const order = added.length + 1;
      const stop = candidateToPlanningStop(candidate, 1, order);
      added.push({ day: 1, order, json: JSON.stringify(stop, null, 2) });
      renderDay();
      btn.textContent = `Added as stop ${order} ✓`;
      btn.disabled = true;
    });
  });
}

function renderDay(): void {
  dayCount.textContent = String(added.length);
  dayPanel.innerHTML = added.length
    ? added
        .map(
          (item) => `
      <details class="stop">
        <summary>Stop ${item.order} · day ${item.day} <span class="ok">PlanningStop ✓</span></summary>
        <pre>${esc(item.json)}</pre>
      </details>`,
        )
        .join('')
    : '<p class="empty">Nothing added yet. Accept a candidate above and the module returns a full <code>PlanningStop</code>.</p>';
}

importBtn.addEventListener('click', render);
resetBtn.addEventListener('click', () => {
  input.value = DEMO_SOURCE_PLACEHOLDER;
  added.length = 0;
  renderDay();
  render();
});

render();
renderDay();
