import type { FeasibilityWarning, PlanningStop } from './contracts';

export type ReplanResult = {
  stops: PlanningStop[];
  totalCostEUR: number;
  plannedMinutes: number;
  warnings: FeasibilityWarning[];
};

const MINUTES_PER_DAY = 24 * 60;
const LATE_DAY_CUTOFF_MINUTES = 22 * 60 + 30;
const TIGHT_TRANSFER_MINUTES = 12;

/**
 * Reorders the supplied day's stops and assigns a schedule from the given start time.
 *
 * Known IDs in orderedIds are honoured once, in their supplied order. Any input stops
 * omitted from orderedIds are retained after them in their existing order, so a malformed
 * drag payload cannot silently remove a stop from the day.
 */
export function resequenceDay(
  stops: PlanningStop[],
  orderedIds: string[],
  dayStart: string,
  dailyBudgetEUR: number,
): ReplanResult {
  const orderedStops = orderStops(stops, orderedIds);
  const dayStartMinutes = parseClockTime(dayStart);
  let previousEndMinutes = dayStartMinutes;

  const replannedStops = orderedStops.map((stop, index) => {
    const transferMinutes = index === 0 ? 0 : stop.transferFromPreviousMinutes;
    const startMinutes = previousEndMinutes + transferMinutes;
    const endMinutes = startMinutes + stop.durationMinutes;
    previousEndMinutes = endMinutes;

    return {
      ...stop,
      startTime: formatClockTime(startMinutes),
      endTime: formatClockTime(endMinutes),
    };
  });

  return {
    stops: replannedStops,
    totalCostEUR: totalCost(replannedStops),
    plannedMinutes: previousEndMinutes - dayStartMinutes,
    warnings: getDayWarnings(replannedStops, dailyBudgetEUR),
  };
}

/**
 * Returns feasibility caveats for a single ordered day. For a late-day warning, each stop
 * must already have a startTime; resequenceDay assigns that before calling this function.
 */
export function getDayWarnings(
  stops: PlanningStop[],
  dailyBudgetEUR: number,
): FeasibilityWarning[] {
  const warnings: FeasibilityWarning[] = [];
  const cost = totalCost(stops);

  if (cost > dailyBudgetEUR) {
    warnings.push({
      code: 'budget',
      message: `Day total €${formatCurrency(cost)} exceeds the €${formatCurrency(dailyBudgetEUR)} budget.`,
    });
  }

  stops.forEach((stop, index) => {
    if (index > 0 && stop.transferFromPreviousMinutes < TIGHT_TRANSFER_MINUTES) {
      warnings.push({
        code: 'tight-transfer',
        stopId: stop.id,
        message: `${stop.title} allows only ${formatDuration(stop.transferFromPreviousMinutes)} for the transfer.`,
      });
    }

    if (stop.isOutdoor && stop.weatherRisk) {
      warnings.push({
        code: 'weather',
        stopId: stop.id,
        message: `${stop.title} is outdoors and may be affected by weather.`,
      });
    }

    if (endsAfterLateDayCutoff(stop)) {
      warnings.push({
        code: 'late-day',
        stopId: stop.id,
        message: `${stop.title} ends at ${stop.endTime ?? 'an unknown time'}, after the 22:30 cutoff.`,
      });
    }
  });

  return warnings;
}

/** Formats elapsed time without referring to browser locale or clock state. */
export function formatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function orderStops(stops: PlanningStop[], orderedIds: string[]): PlanningStop[] {
  const stopsById = new Map(stops.map((stop) => [stop.id, stop]));
  const selectedIds = new Set<string>();
  const selectedStops: PlanningStop[] = [];

  orderedIds.forEach((id) => {
    const stop = stopsById.get(id);
    if (stop && !selectedIds.has(id)) {
      selectedIds.add(id);
      selectedStops.push(stop);
    }
  });

  return selectedStops.concat(stops.filter((stop) => !selectedIds.has(stop.id)));
}

function totalCost(stops: PlanningStop[]): number {
  return roundCurrency(stops.reduce((sum, stop) => sum + stop.costEUR, 0));
}

function endsAfterLateDayCutoff(stop: PlanningStop): boolean {
  if (!stop.startTime) {
    return false;
  }

  return parseClockTime(stop.startTime) + stop.durationMinutes > LATE_DAY_CUTOFF_MINUTES;
}

function parseClockTime(value: string): number {
  const match = /^(?<hours>[01]\d|2[0-3]):(?<minutes>[0-5]\d)$/.exec(value);

  if (!match?.groups) {
    throw new RangeError(`Expected a 24-hour HH:MM time, received "${value}".`);
  }

  return Number(match.groups.hours) * 60 + Number(match.groups.minutes);
}

function formatClockTime(totalMinutes: number): string {
  const minutesInDay = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(minutesInDay / 60);
  const minutes = minutesInDay % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value: number): string {
  return roundCurrency(value).toFixed(2);
}
