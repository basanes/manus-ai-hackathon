import { DragEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlanningStop } from './lib/contracts';
import { formatDuration, resequenceDay } from './lib/planner';
import {
  DEMO_IMPORT_DISCLAIMER,
  DEMO_SOURCE_PLACEHOLDER,
  candidateToPlanningStop,
  extractDemoCandidates,
  summariseImport,
  type InspirationCandidate,
} from './features/inspiration';
import {
  PLAN_B_CATALOG,
  applyProposal,
  getGroupPulse,
  proposeRainPlan,
  revertProposal,
  type AdaptationProposal,
  type VoteChoice,
  type VoteRecord,
} from './features/groupTrip';
import { judgeMoneyAnswer, monetisationPrinciple, pricingPlans } from './content/monetisation';
import './styles.css';

/* UI view model: the shared PlanningStop plus presentation-only fields. */
type TripStop = PlanningStop & { day: number; category: string; status: string; x: number; y: number };
type AcceptedPlanB = { proposal: AdaptationProposal; original: TripStop };

const CREW = [
  { id: 'maya', initial: 'M', name: 'Maya' },
  { id: 'jamie', initial: 'J', name: 'Jamie' },
  { id: 'alex', initial: 'A', name: 'Alex' },
];
const YOU = 'maya';
const DAY_START: Record<number, string> = { 1: '09:30', 2: '17:30' };
const DAILY_BUDGET_EUR = 140;

const initialPlan: TripStop[] = [
  { id: 'pasteis', title: 'Pastéis de Belém', description: 'The warm-start ritual', category: 'Food', day: 1, durationMinutes: 45, transferFromPreviousMinutes: 0, costEUR: 5, isOutdoor: false, weatherRisk: false, status: 'Locked', latitude: 38.6975, longitude: -9.2033, x: 17, y: 74 },
  { id: 'maat', title: 'MAAT', description: 'Indoor art + river walk', category: 'Culture', day: 1, durationMinutes: 90, transferFromPreviousMinutes: 18, costEUR: 12, isOutdoor: false, weatherRisk: false, status: 'Group pick', latitude: 38.6957, longitude: -9.1925, x: 30, y: 57 },
  { id: 'timeout', title: 'Time Out Market', description: 'Table held for 3', category: 'Food', day: 1, durationMinutes: 70, transferFromPreviousMinutes: 16, costEUR: 21, isOutdoor: false, weatherRisk: false, status: 'Reserved', latitude: 38.7069, longitude: -9.1459, x: 52, y: 50 },
  { id: 'lxfactory', title: 'LX Factory', description: 'Covered shops + bookshop', category: 'Culture', day: 1, durationMinutes: 105, transferFromPreviousMinutes: 18, costEUR: 0, isOutdoor: false, weatherRisk: false, status: 'Group pick', latitude: 38.7037, longitude: -9.1786, x: 42, y: 30 },
  { id: 'miradouro', title: 'Senhora do Monte', description: 'Sunset viewpoint, weather-dependent', category: 'Viewpoint', day: 1, durationMinutes: 55, transferFromPreviousMinutes: 28, costEUR: 0, isOutdoor: true, weatherRisk: true, status: 'Group pick', latitude: 38.7193, longitude: -9.1328, x: 77, y: 19 },
  { id: 'alfama', title: 'Alfama evening walk', description: 'Slow wander, steep streets', category: 'Neighbourhood', day: 2, durationMinutes: 90, transferFromPreviousMinutes: 0, costEUR: 0, isOutdoor: true, weatherRisk: false, status: 'Group pick', latitude: 38.7114, longitude: -9.13, x: 70, y: 34 },
  { id: 'fado', title: 'Fado dinner', description: 'Vote before booking', category: 'Food', day: 2, durationMinutes: 120, transferFromPreviousMinutes: 16, costEUR: 32, isOutdoor: false, weatherRisk: false, status: 'Shortlist', latitude: 38.7105, longitude: -9.1297, x: 66, y: 53 },
];

/* Seeded crew votes: the first N crew members mark a stop as must-do, the rest nice-to-have. */
const seededMustDo: Record<string, number> = { pasteis: 3, maat: 3, timeout: 2, lxfactory: 2, miradouro: 3, alfama: 3, fado: 2, museufado: 3 };
const initialVotes: VoteRecord[] = Object.entries(seededMustDo).flatMap(([stopId, mustDo]) =>
  CREW.map((member, index) => ({ travelerId: member.id, stopId, choice: (index < mustDo ? 'must-do' : 'nice-to-have') as VoteChoice })),
);

/* Presentation fields for the Plan B replacement supplied by the group-adaptation module. */
const PLAN_B_UI = { day: 1, category: 'Culture', status: 'Plan B live', x: 67, y: 33 };
const CATEGORY_LABEL: Record<InspirationCandidate['category'], string> = {
  food: 'Food', culture: 'Culture', viewpoint: 'Viewpoint', nature: 'Nature', nightlife: 'Nightlife', shopping: 'Shopping',
};
const VOTE_OPTIONS: { choice: VoteChoice; label: string; icon: string }[] = [
  { choice: 'must-do', label: 'Must do', icon: '♥' },
  { choice: 'nice-to-have', label: 'Nice to have', icon: '✦' },
  { choice: 'skip', label: 'Skip', icon: '−' },
];
const PLAN_LABEL: Record<string, string> = { free: 'ACQUIRE', pass: 'MONETISE THE MOMENT', affiliate: 'EARN ON COMPLETION' };

const formatMoney = (value: number) => (value === 0 ? 'Free' : `€${Number.isInteger(value) ? value : value.toFixed(2)}`);
const scheduleDay = (plan: TripStop[], day: number) => {
  const stops = plan.filter((stop) => stop.day === day);
  const result = resequenceDay(stops, stops.map((stop) => stop.id), DAY_START[day], DAILY_BUDGET_EUR);
  return { ...result, stops: result.stops as TripStop[] };
};
/* Prefer a weather-risk stop that has a vetted replacement, so an added outdoor find cannot hide Plan B. */
const findRainProposal = (plan: TripStop[]) =>
  proposeRainPlan(plan.filter((stop) => stop.day === 1 && (PLAN_B_CATALOG[stop.id] || !(stop.isOutdoor && stop.weatherRisk))));
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function App() {
  const [plan, setPlan] = useState<TripStop[]>(initialPlan);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedId, setSelectedId] = useState('miradouro');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState(DEMO_SOURCE_PLACEHOLDER);
  const [importedText, setImportedText] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [showPlanB, setShowPlanB] = useState(false);
  const [acceptedPlanB, setAcceptedPlanB] = useState<AcceptedPlanB | null>(null);
  const [votes, setVotes] = useState<VoteRecord[]>(initialVotes);
  const [toast, setToast] = useState('Your Lisbon trip is ready to test.');

  const schedule = useMemo(() => scheduleDay(plan, activeDay), [plan, activeDay]);
  const dayOne = useMemo(() => scheduleDay(plan, 1), [plan]);
  const dayItems = schedule.stops;
  const candidates = useMemo(() => (importedText === null ? [] : extractDemoCandidates(importedText)), [importedText]);
  const importSummary = importedText === null ? null : summariseImport(importedText);
  const previewProposal = acceptedPlanB?.proposal ?? findRainProposal(plan);
  const previewOriginal = acceptedPlanB?.original ?? plan.find((stop) => stop.id === previewProposal?.originalStopId);

  const selectedItem = dayItems.find((stop) => stop.id === selectedId) ?? dayItems[0];
  const pulse = selectedItem ? getGroupPulse(votes, selectedItem.id) : null;
  const pulseText = pulse && selectedItem ? pulse.summary.split(selectedItem.id).join(selectedItem.title) : '';
  const myVote = votes.find((vote) => vote.travelerId === YOU && vote.stopId === selectedItem?.id)?.choice;
  const mustDoCount = (stopId: string) => votes.filter((vote) => vote.stopId === stopId && vote.choice === 'must-do').length;
  const dayOneWeatherRisks = dayOne.warnings.filter((warning) => warning.code === 'weather').length;
  const dayOneIssues = dayOne.warnings.length;

  const reorderDay = (nextIds: string[], movedTitle: string) => {
    const others = plan.filter((stop) => stop.day !== activeDay);
    const byId = new Map(plan.map((stop) => [stop.id, stop]));
    const nextPlan = [...others, ...nextIds.map((id) => byId.get(id)!).filter(Boolean)];
    setPlan(nextPlan);
    const replanned = scheduleDay(nextPlan, activeDay);
    setToast(`${movedTitle} moved — planner re-timed the day to ${formatDuration(replanned.plannedMinutes)} with ${replanned.warnings.length} warning${replanned.warnings.length === 1 ? '' : 's'}.`);
  };

  const moveTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = dayItems.map((stop) => stop.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, fromId);
    reorderDay(ids, dayItems[fromIndex].title);
  };

  const moveBy = (id: string, delta: number) => {
    const ids = dayItems.map((stop) => stop.id);
    const index = ids.indexOf(id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setSelectedId(id);
    reorderDay(ids, dayItems[index].title);
  };

  const onDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    if (draggedId) moveTo(draggedId, targetId);
    setDraggedId(null);
  };

  const extract = () => {
    setImportedText(sourceText);
    const summary = summariseImport(sourceText);
    setToast(`${summary.label} ${summary.matchedCount}/${summary.totalCount} places matched your paste.`);
  };

  const addCandidate = (candidate: InspirationCandidate) => {
    if (addedIds.includes(candidate.id)) return;
    const order = plan.filter((stop) => stop.day === activeDay).length;
    const stop: TripStop = {
      ...candidateToPlanningStop(candidate, activeDay, order),
      day: activeDay,
      category: CATEGORY_LABEL[candidate.category],
      status: 'Fresh find',
      x: candidate.x,
      y: candidate.y,
    };
    setPlan((previous) => [...previous, stop]);
    setAddedIds((previous) => [...previous, candidate.id]);
    setSelectedId(candidate.id);
    setToast(`${candidate.name} added to Day ${activeDay} with a 12 min transfer allowance — times recalculated.`);
  };

  const castVote = (choice: VoteChoice) => {
    if (!selectedItem) return;
    setVotes((previous) => [
      ...previous.filter((vote) => !(vote.travelerId === YOU && vote.stopId === selectedItem.id)),
      { travelerId: YOU, stopId: selectedItem.id, choice },
    ]);
    const label = VOTE_OPTIONS.find((option) => option.choice === choice)?.label;
    setToast(`Maya (you) marked ${selectedItem.title} as “${label}”. Group pulse updated.`);
  };

  const acceptPlanB = () => {
    const proposal = findRainProposal(plan);
    if (!proposal) return;
    const original = plan.find((stop) => stop.id === proposal.originalStopId);
    if (!original) return;
    const uiProposal: AdaptationProposal = { ...proposal, replacement: { ...proposal.replacement, ...PLAN_B_UI } as TripStop };
    setPlan(applyProposal(plan, uiProposal) as TripStop[]);
    setAcceptedPlanB({ proposal: uiProposal, original });
    setActiveDay(1);
    setSelectedId(uiProposal.replacement.id);
    setToast(`Plan B applied: ${uiProposal.replacement.title} replaces ${original.title}. Revert any time.`);
  };

  const revertPlanB = () => {
    if (!acceptedPlanB) return;
    setPlan(revertProposal(plan, acceptedPlanB.proposal, acceptedPlanB.original) as TripStop[]);
    setSelectedId(acceptedPlanB.original.id);
    setAcceptedPlanB(null);
    setToast(`Original plan restored — ${acceptedPlanB.original.title} is back, with its weather warning.`);
  };

  const resetDemo = () => {
    setPlan(initialPlan);
    setActiveDay(1);
    setSelectedId('miradouro');
    setSourceText(DEMO_SOURCE_PLACEHOLDER);
    setImportedText(null);
    setAddedIds([]);
    setShowPlanB(false);
    setAcceptedPlanB(null);
    setVotes(initialVotes);
    setToast('Demo reset — Lisbon is back to the original group plan.');
  };

  const crewAvatars = <div className="avatars" aria-label="Maya, Jamie and Alex">{CREW.map((member) => <span key={member.id} title={member.name}>{member.initial}</span>)}</div>;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RouteMuse home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>Route<span>Muse</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#explainer">What it is</a>
          <a href="#demo">Try the trip</a>
          <a href="#model">Business model</a>
        </nav>
        <button className="ghost-button small" onClick={() => scrollToId('demo')}>Open demo <span>↗</span></button>
      </header>

      <main id="top">
        <section className="hero section-frame">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />Social saves, real-world routes</div>
            <h1>Saved it.<br /><em>Now make it fit.</em></h1>
            <p>RouteMuse turns the places a group saves online into a timed, budget-checked day plan — and offers a weather-safe swap when rain threatens an outdoor stop.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollToId('demo')}>Run the Lisbon demo <span>→</span></button>
              <a className="text-link" href="#explainer">Read the explainer <span>↓</span></a>
            </div>
            <div className="proof-row">
              {crewAvatars}
              <p><strong>No sign-in.</strong> A seeded 3-friend Lisbon trip is ready to try.</p>
            </div>
          </div>
          <div className="hero-art" aria-label="Illustrated trip planning collage">
            <div className="postcard postcard-main">
              <div className="stamp">LISBON / 48 HRS</div>
              <div className="sun-disc" />
              <div className="hill hill-one" /><div className="hill hill-two" /><div className="river" />
              <div className="route-squiggle">⌁</div>
              <div className="mini-note"><b>Saved posts</b><br />become a timed day</div>
            </div>
            <div className="ticket ticket-one">DAY 01 <b>FEELS FEASIBLE</b></div>
            <div className="paper-pin pin-one">Food<br />first</div>
            <div className="paper-pin pin-two">Rain?<br />Handled.</div>
            <div className="route-arrow">↗</div>
          </div>
        </section>

        <section id="explainer" className="explainer section-frame" aria-labelledby="explainer-title">
          <div className="section-intro">
            <p className="eyebrow">Hackathon explainer</p>
            <h2 id="explainer-title">What it does, honestly.</h2>
          </div>
          <div className="explainer-grid">
            <article>
              <span className="step-number">What</span>
              <p><b>RouteMuse turns a group’s saved travel posts into a feasible day plan</b>: stops are timed with transfer allowances, totalled against a €140 daily budget, flagged for weather/late/tight-transfer risks, and an outdoor stop can be swapped for an indoor Plan B when rain hits.</p>
            </article>
            <article>
              <span className="step-number">Who</span>
              <p><b>Friend groups planning a short city break</b> whose ideas are scattered across saved reels and group chats. It removes the annoying step of turning “we should go here” saves into a schedule everyone agrees fits — and re-planning when the weather turns.</p>
            </article>
            <article>
              <span className="step-number">How to try it</span>
              <ol>
                <li>Open <b>Try the trip</b> below.</li>
                <li>Click <b>Extract 3 places</b>, then <b>+</b> to add one — times recalculate.</li>
                <li>Drag a card (or use ↑ ↓) to reorder the day.</li>
                <li>Select a stop and cast a vote; the group pulse updates.</li>
                <li><b>Preview Plan B</b> → <b>Accept</b> → <b>Revert</b>. Then <b>Reset demo</b>.</li>
              </ol>
            </article>
            <article className="explainer-status">
              <span className="step-number">Works today</span>
              <p>Seeded Lisbon trip, deterministic planner (times, budget, warnings), demo import, local voting with group pulse, rain Plan B with accept and revert, reset. No sign-in.</p>
              <span className="step-number not-done">Not finished</span>
              <p>No real social-media import (your paste only changes which seeded places count as matched), no live weather, maps or opening hours, no accounts or saving, other crew votes are simulated, one demo city, and no payments or bookings — pricing below is a proposed model.</p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="process section-frame">
          <div className="section-intro">
            <p className="eyebrow">A planner that starts where travel starts</p>
            <h2>From the scroll to a schedule.</h2>
          </div>
          <div className="process-rail">
            <article><span className="step-number">01</span><h3>Collect the pull</h3><p>Paste a saved post; RouteMuse proposes the places it mentions as route-ready stops.</p></article>
            <article><span className="step-number">02</span><h3>Make it feasible</h3><p>Every reorder re-times the day with transfer allowances, totals the budget, and flags risks.</p></article>
            <article><span className="step-number">03</span><h3>Stay flexible</h3><p>When rain threatens, RouteMuse proposes a swap that keeps the day’s mood — and explains the trade-off.</p></article>
          </div>
        </section>

        <section id="demo" className="demo-section section-frame">
          <div className="demo-heading">
            <div>
              <p className="eyebrow">GUIDED DEMO / LISBON</p>
              <h2>Three friends. Two days.<br />A plan that can bend.</h2>
            </div>
            <div className="demo-controls">
              <button className="outline-button" onClick={resetDemo}>↺ Reset demo</button>
              <span className="demo-status" role="status" aria-live="polite"><i /> {toast}</span>
            </div>
          </div>

          <div className="trip-strip">
            <div className="trip-title"><span className="trip-pin">⌖</span><div><small>WEEKEND PLAN</small><strong>Lisbon · Maya, Jamie, Alex</strong></div></div>
            <div className="trip-stat"><small>DAY 01 SPEND</small><strong>{formatMoney(dayOne.totalCostEUR)} <em>/ €{DAILY_BUDGET_EUR}</em></strong></div>
            <div className="trip-stat"><small>DAY 01 LENGTH</small><strong>{formatDuration(dayOne.plannedMinutes)}</strong></div>
            <div className={`trip-stat risk ${dayOneIssues === 0 ? 'clear' : ''}`}><small>FEASIBILITY</small><strong>{dayOneIssues === 0 ? 'Clear' : dayOneWeatherRisks > 0 ? `${dayOneWeatherRisks} weather risk${dayOneWeatherRisks === 1 ? '' : 's'}` : `${dayOneIssues} warning${dayOneIssues === 1 ? '' : 's'}`}</strong></div>
            <div className="trip-group">{crewAvatars}<small>demo crew</small></div>
          </div>

          <div className="workbench">
            <aside className="inspiration-panel paper-panel">
              <div className="panel-kicker"><span className="icon-box">✦</span>INSPIRATION TRAY</div>
              <h3>Bring the scroll.</h3>
              <p className="quiet">Paste a saved post caption. RouteMuse proposes route-ready places.</p>
              <label className="import-field import-area">
                <span>🔗</span>
                <textarea aria-label="Saved social travel post" rows={3} value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
              </label>
              <button className="primary-button full" onClick={extract}>Extract 3 places <span>→</span></button>
              {importSummary && <p className="demo-disclaimer">{DEMO_IMPORT_DISCLAIMER} {importSummary.matchedCount}/{importSummary.totalCount} matched your paste.</p>}
              <div className={`candidate-list ${candidates.length ? 'visible' : ''}`}>
                {candidates.map((candidate) => (
                  <article className="candidate-card" key={candidate.id}>
                    <div className={`candidate-thumb thumb-${candidate.category}`}><span>{candidate.category === 'food' ? '✳' : candidate.category === 'culture' ? '▦' : '⌁'}</span></div>
                    <div>
                      <small>{candidate.sourceLabel} · {candidate.confidence} confidence</small>
                      <h4>{candidate.name}</h4>
                      <p>{candidate.extractionReason} · {formatMoney(candidate.costEUR)} · {candidate.durationMinutes}m{candidate.weatherRisk ? ' · outdoor' : ''}</p>
                    </div>
                    <button className="add-button" aria-label={`Add ${candidate.name} to Day ${activeDay}`} onClick={() => addCandidate(candidate)} disabled={addedIds.includes(candidate.id)}>{addedIds.includes(candidate.id) ? 'Added' : '+'}</button>
                  </article>
                ))}
              </div>
              {!candidates.length && <div className="empty-import"><span>⌁</span><p>Try the pre-filled saved reel to reveal three route-ready ideas.</p></div>}
              <div className="collab-note">
                {crewAvatars}
                <p><b>Group pulse · {selectedItem?.title ?? 'no stop selected'}</b><br />{pulseText}</p>
              </div>
            </aside>

            <section className="itinerary-panel paper-panel">
              <div className="itinerary-topline">
                <div className="panel-kicker"><span className="icon-box">☷</span>THE PLAN</div>
                <button className="mini-button" onClick={() => { setShowPlanB(true); scrollToId('plan-b'); }}>⚡ Test rain plan</button>
              </div>
              <div className="day-tabs" role="tablist" aria-label="Trip days">
                {[1, 2].map((day) => <button key={day} role="tab" aria-selected={activeDay === day} className={activeDay === day ? 'active' : ''} onClick={() => { setActiveDay(day); setSelectedId(plan.find((stop) => stop.day === day)?.id ?? ''); }}>Day {day}<small>{day === 1 ? `Starts ${DAY_START[1]}` : `Starts ${DAY_START[2]}`}</small></button>)}
              </div>
              <div className="timeline-intro"><span>Drag a card or use ↑ ↓ to reorder</span><span>{dayItems.length} stops · {formatDuration(schedule.plannedMinutes)} · {formatMoney(schedule.totalCostEUR)}</span></div>
              <div className="timeline">
                {dayItems.map((item, index) => {
                  const atRisk = item.isOutdoor && item.weatherRisk;
                  const next = dayItems[index + 1];
                  return (
                    <div className="timeline-block" key={item.id}>
                      <div className="time-column"><b>{item.startTime}</b><span>{item.durationMinutes}m</span></div>
                      <div className="timeline-line"><i className={atRisk ? 'weather-dot' : ''} /></div>
                      <article
                        className={`plan-card ${selectedItem?.id === item.id ? 'selected' : ''} ${atRisk ? 'at-risk' : ''} ${draggedId === item.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => setDraggedId(item.id)}
                        onDragEnd={() => setDraggedId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => onDrop(event, item.id)}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div className="drag-handle" aria-hidden="true">⠿</div>
                        <div className="plan-card-copy"><div className="card-meta"><span>{item.category}</span><span>{item.isOutdoor ? 'OUTDOOR' : 'INDOOR'}</span><span>{item.status}</span></div><h3>{item.title}</h3><p>{item.description}</p></div>
                        <div className="plan-card-side">
                          <b>{formatMoney(item.costEUR)}</b>
                          <small>♥ {mustDoCount(item.id)}/3</small>
                          <span className="move-buttons">
                            <button aria-label={`Move ${item.title} earlier`} disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveBy(item.id, -1); }}>↑</button>
                            <button aria-label={`Move ${item.title} later`} disabled={index === dayItems.length - 1} onClick={(event) => { event.stopPropagation(); moveBy(item.id, 1); }}>↓</button>
                          </span>
                        </div>
                        {atRisk && <div className="risk-flag">weather watch</div>}
                      </article>
                      {next && <div className={`travel-cue ${next.transferFromPreviousMinutes < 12 ? 'tight' : ''}`}>↘ {next.transferFromPreviousMinutes} min transfer <span>· ends {item.endTime}</span></div>}
                    </div>
                  );
                })}
              </div>
              <div className="warning-list" aria-label="Planner warnings">
                <small>PLANNER CHECKS · DAY {activeDay}</small>
                {schedule.warnings.length === 0
                  ? <p className="ok">✓ Fits the €{DAILY_BUDGET_EUR} budget, no tight transfers, no weather or late-night risks.</p>
                  : schedule.warnings.map((warning, index) => <p key={`${warning.code}-${warning.stopId ?? index}`} className={warning.code}>⚠ {warning.message}</p>)}
              </div>
              <div className="vote-bar">
                <div><span className="eyebrow-dot" /> YOUR TAKE (MAYA)</div>
                <p>{selectedItem ? selectedItem.title : 'Select a stop'}</p>
                {VOTE_OPTIONS.map((option) => <button key={option.choice} className={myVote === option.choice ? 'chosen' : ''} onClick={() => castVote(option.choice)} disabled={!selectedItem}>{option.icon} {option.label}</button>)}
              </div>
            </section>

            <aside className="map-panel paper-panel">
              <div className="map-topline"><div><div className="panel-kicker"><span className="icon-box">⌖</span>ROUTE VIEW</div><h3>Day {activeDay}, Lisbon</h3></div><span className="map-scale">illustrated</span></div>
              <div className="map-canvas" aria-label="Illustrated itinerary map">
                <div className="map-water" /><div className="map-neighbourhood n-one">BELÉM</div><div className="map-neighbourhood n-two">BAIXA</div><div className="map-neighbourhood n-three">ALFAMA</div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="route-lines" aria-hidden="true">
                  {dayItems.slice(1).map((item, index) => { const previous = dayItems[index]; return <line key={item.id} x1={previous.x} y1={previous.y} x2={item.x} y2={item.y} />; })}
                </svg>
                {dayItems.map((item, index) => <button key={item.id} aria-label={`Select ${item.title}`} onClick={() => setSelectedId(item.id)} className={`map-pin ${selectedItem?.id === item.id ? 'selected' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }}><span>{index + 1}</span><b>{item.title}</b></button>)}
                <div className="map-compass">N</div>
              </div>
              {selectedItem && <div className="map-selection"><div className="selection-number">{dayItems.findIndex((stop) => stop.id === selectedItem.id) + 1}</div><div><small>SELECTED STOP · {selectedItem.startTime}–{selectedItem.endTime}</small><strong>{selectedItem.title}</strong><p>{selectedItem.description}</p></div></div>}
              <div className="map-legend"><span><i className="legend-route" /> stop order</span><span><i className="legend-pin" /> selected stop</span></div>
            </aside>
          </div>

          <section id="plan-b" className={`replan-card ${showPlanB ? 'expanded' : ''} ${acceptedPlanB ? 'accepted' : ''}`}>
            <div className="replan-lead">
              <span className="alert-badge">⚡</span>
              <div><p className="eyebrow">ADAPTIVE MOMENT · SIMULATED RAIN</p><h3>{acceptedPlanB ? 'Rain plan is live — the evening is still yours.' : previewProposal ? `Rain forecast for ${previewOriginal?.title}? Keep the mood, change the move.` : 'No weather-risk stop on Day 1 right now.'}</h3></div>
              {previewProposal && <button className="outline-button" onClick={() => setShowPlanB((visible) => !visible)}>{showPlanB ? 'Hide comparison' : acceptedPlanB ? 'See why' : 'Preview Plan B'} <span>→</span></button>}
            </div>
            {showPlanB && previewProposal && previewOriginal && <div className="comparison-wrap">
              <article className="comparison before"><small>BEFORE</small><h4>{previewOriginal.title}</h4><p>{previewOriginal.durationMinutes}m outdoor stop</p><span>{previewOriginal.transferFromPreviousMinutes} min transfer · {formatMoney(previewOriginal.costEUR)}</span></article>
              <div className="comparison-arrow"><b>→</b><span>weather-safe<br />swap</span></div>
              <article className="comparison after"><small>AFTER</small><h4>{previewProposal.replacement.title}</h4><p>{previewProposal.replacement.durationMinutes}m indoor stop</p><span>−{previewProposal.walkingMinutesSaved} min walking · +€{previewProposal.budgetDeltaEUR}</span></article>
              <div className="reason-note"><b>Why it fits · keeps {previewProposal.preserves.join(' + ')}</b><p>{previewProposal.reason} {getGroupPulse(votes, previewProposal.replacement.id).summary}</p></div>
              <div className="comparison-actions">
                {acceptedPlanB
                  ? <button className="primary-button" onClick={revertPlanB}>Revert to original <span>↺</span></button>
                  : <button className="primary-button" onClick={acceptPlanB}>Accept Plan B <span>✓</span></button>}
                <button className="text-link" onClick={() => { setShowPlanB(false); setToast(acceptedPlanB ? 'The accepted rain plan remains active.' : 'Original plan kept. The weather risk remains visible.'); }}>{acceptedPlanB ? 'Keep Plan B' : 'Keep original'}</button>
              </div>
            </div>}
          </section>
        </section>

        <section id="model" className="model-section section-frame">
          <div className="model-lead">
            <p className="eyebrow">PROPOSED MONETISATION · NOT LIVE IN THIS DEMO</p>
            <h2>People pay for <em>confidence</em>.<br />Partners pay for intent.</h2>
            <p>{monetisationPrinciple} Travel planning is episodic, so the core planner stays free and nobody is pushed into a subscription before value appears.</p>
            <div className="principle">No ads. No pay-to-rank. No hidden price uplift.</div>
          </div>
          <div className="revenue-stack">
            {pricingPlans.map((plan) => (
              <article key={plan.id} className={`revenue-card ${plan.id}`}>
                <div className="card-label">{PLAN_LABEL[plan.id]}</div>
                <div><h3>{plan.label}</h3><p className="plan-headline">{plan.headline}</p></div>
                <strong>{plan.price}</strong>
                <div>
                  <p>{plan.description}</p>
                  <ul>{plan.proofPoints.map((point) => <li key={point}>{point}</li>)}</ul>
                  {plan.note && <p className="plan-note">{plan.note}</p>}
                </div>
                {plan.id === 'pass' && <span className="recommended">Best early revenue</span>}
              </article>
            ))}
          </div>
          <div className="model-footer"><div><b>The 30-second answer:</b> {judgeMoneyAnswer}</div><span>No payment, checkout or booking flow exists in this prototype.</span></div>
        </section>
      </main>

      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>Route<span>Muse</span></span></a><p>Hackathon prototype · Seeded local demo data · No sign-in required.</p><button className="text-link" onClick={resetDemo}>Reset the trip ↺</button></footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
