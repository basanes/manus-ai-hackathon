/**
 * Shared, UI-agnostic data contracts for deterministic day planning.
 * Monetary values are represented in EUR as numbers (for example, 12.5 for €12.50).
 */

export type FeasibilityWarningCode =
  | 'budget'
  | 'tight-transfer'
  | 'weather'
  | 'late-day';

export type FeasibilityWarning = {
  code: FeasibilityWarningCode;
  message: string;
  /** Present when the warning applies to one specific stop. */
  stopId?: string;
};

export type PlanningStop = {
  /** Stable identifier used to match a drag-and-drop order to a stop. */
  id: string;
  /** Human-readable venue or activity name. */
  title: string;
  /** User-facing context retained unchanged by the planner. */
  description: string;
  /** Coordinates retained unchanged by the planner. */
  latitude: number;
  longitude: number;
  /** Time spent at this stop, excluding travel from the preceding stop. */
  durationMinutes: number;
  /** Travel time from the preceding stop in the selected order. */
  transferFromPreviousMinutes: number;
  /** Cost for this individual stop, denominated in EUR. */
  costEUR: number;
  /** Whether the activity takes place outdoors. */
  isOutdoor: boolean;
  /** Whether an outdoor stop should surface a weather-related caveat. */
  weatherRisk: boolean;
  /** Assigned by resequenceDay in 24-hour HH:MM format. */
  startTime?: string;
  /** Assigned by resequenceDay in 24-hour HH:MM format. */
  endTime?: string;
};
