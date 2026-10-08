/**
 * Standalone preview harness for src/features/inspiration.ts (Participant 2).
 *
 * NOT part of the shipped app. It exists so the team can see the whole chain
 * working before Participant 5 wires it into the interface:
 *
 *   pasted post → candidates → accepted candidate → PlanningStop
 *               → Participant 1's resequenceDay → timed day + warnings
 *
 * It reuses the real module exports and Participant 1's real planner.
 * Rebuild with: bash docs/handoffs/inspiration-import/preview/build.sh
 */

import {
  DEMO_IMPORT_DISCLAIMER,
  DEMO_SOURCE_PLACEHOLDER,
  DEFAULT_TRANSFER_MINUTES,
  candidateToPlanningStop,
  extractDemoCandidates,
  summariseImport,
  type InspirationCandidate,
} from '../../../../src/features/inspiration';
import { resequenceDay } from '../../../../src/lib/planner';
import type { PlanningStop } from '../../../../src/lib/contracts';

const DAY_START = '09:30';
const DAILY_BUDGET_EUR = 40;

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

const added: PlanningStop[] = [];

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function chips(c: InspirationCandidate): string {
  const items = [
    c.costEUR === 0 ? 'Free' : `€${c.costEUR.toFixed(2)}`,
    `${c.durationMinutes} min`,
    c.indoor ? 'Indoor' : 'Outdoor',
    c.weatherRisk ? 'Weather risk' : null,
  ].filter(Boolean) as string[];
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join('');
}

function renderCandidates(): void {
  const candidates = extractDemoCandidates(input.value);
  const summary = summariseImport(input.value);
  const alreadyAdded = new Set(added.map((stop) => stop.id));

  banner.innerHTML = `
    <span class="dot"></span>
    <strong>${esc(summary.label)}</strong>
    <span class="banner-note">${summary.matchedCount} of ${summary.totalCount} signals matched your paste · no social platform was accessed</span>`;

  list.innerHTML = candidates
    .map((c) => {
      const isAdded = alreadyAdded.has(c.id);
      return `
    <article class="card">
      <div class="card-head">
        <h3>${esc(c.name)}</h3>
        <span class="badge ${c.confidence}">${c.confidence}</span>
      </div>
      <p class="meta">${esc(c.sourceLabel)} · ${esc(c.category)}</p>
      <p class="reason">${esc(c.extractionReason)}</p>
      <p class="note">${esc(c.note)}</p>
      <div class="chips">${chips(c)}</div>
      <button class="add" data-id="${esc(c.id)}" ${isAdded ? 'disabled' : ''}>${
        isAdded ? 'Added to day 1 ✓' : `Add to day 1 · ${DEFAULT_TRANSFER_MINUTES} min transfer`
      }</button>
    </article>`;
    })
    .join('');

  map.innerHTML = candidates
    .map(
      (c) => `<span class="pin" style="left:${c.x}%;top:${c.y}%" title="${esc(c.name)}">${esc(c.name.split(' ')[0])}</span>`,
    )
    .join('');

  list.querySelectorAll<HTMLButtonElement>('button.add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const candidate = candidates.find((c) => c.id === btn.dataset.id);
      if (!candidate || added.some((stop) => stop.id === candidate.id)) return;
      added.push(candidateToPlanningStop(candidate, 1, added.length + 1));
      renderDay();
      renderCandidates();
    });
  });
}

function renderDay(): void {
  dayCount.textContent = String(added.length);

  if (added.length === 0) {
    dayPanel.innerHTML =
      '<p class="empty">Nothing added yet. Accept a candidate above and the module returns a full <code>PlanningStop</code>.</p>';
    return;
  }

  // Participant 1's planner runs on the converted stops, exactly as Participant 5 will call it.
  const day = resequenceDay(added, added.map((stop) => stop.id), DAY_START, DAILY_BUDGET_EUR);

  const schedule = day.stops
    .map(
      (stop) => `
      <li>
        <span class="time">${esc(stop.startTime ?? '')}–${esc(stop.endTime ?? '')}</span>
        <span class="stop-name">${esc(stop.title)}</span>
        <span class="transfer">+${stop.transferFromPreviousMinutes} min transfer</span>
      </li>`,
    )
    .join('');

  const warnings = day.warnings.length
    ? day.warnings
        .map((w) => `<li class="warn"><span class="code">${esc(w.code)}</span> ${esc(w.message)}</li>`)
        .join('')
    : '<li class="none">No feasibility warnings — this day is clean.</li>';

  const json = added.map((stop, i) => `// stop ${i + 1}\n${JSON.stringify(stop, null, 2)}`).join('\n\n');

  dayPanel.innerHTML = `
    <div class="summary">
      <span><strong>${esc(DAY_START)}</strong> start</span>
      <span><strong>€${day.totalCostEUR.toFixed(2)}</strong> of €${DAILY_BUDGET_EUR.toFixed(2)}</span>
      <span><strong>${day.plannedMinutes}</strong> planned min</span>
      <span><strong>${day.warnings.length}</strong> warning${day.warnings.length === 1 ? '' : 's'}</span>
    </div>
    <ul class="schedule">${schedule}</ul>
    <ul class="warnings">${warnings}</ul>
    <details class="stop">
      <summary>PlanningStop[] handed to resequenceDay <span class="ok">${added.length} stop${added.length === 1 ? '' : 's'} ✓</span></summary>
      <pre>${esc(json)}</pre>
    </details>`;
}

importBtn.addEventListener('click', renderCandidates);
resetBtn.addEventListener('click', () => {
  input.value = DEMO_SOURCE_PLACEHOLDER;
  added.length = 0;
  renderDay();
  renderCandidates();
});

renderCandidates();
renderDay();
