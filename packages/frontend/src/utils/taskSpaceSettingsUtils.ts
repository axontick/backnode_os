import { PriorityLevel, ListSettings } from '../types';

/**
 * Maps human-readable default view settings to route view slugs
 */
export const mapDefaultViewToSlug = (
  defaultView?: ListSettings['defaultView'] | string
): 'board' | 'table' | 'list' | 'timeline' | 'calendar' => {
  switch (defaultView) {
    case 'Spreadsheet':
      return 'table';
    case 'Standard List':
      return 'list';
    case 'Timeline':
      return 'timeline';
    case 'Calendar':
      return 'calendar';
    case 'Board':
    default:
      return 'board';
  }
};

/**
 * Maps task space default priority strings to PriorityLevel
 */
export const mapPriorityStringToLevel = (
  priority?: ListSettings['defaultPriority'] | string
): PriorityLevel => {
  if (!priority) return 'Medium';
  const lower = priority.toLowerCase();
  if (lower.includes('p0') || lower.includes('critical') || lower.includes('urgent')) {
    return 'Urgent';
  }
  if (lower.includes('p1') || lower.includes('high')) {
    return 'High';
  }
  if (lower.includes('p3') || lower.includes('low')) {
    return 'Low';
  }
  return 'Medium';
};

/**
 * Formats estimation metric values according to the active list setting unit
 */
export const formatEstimationValue = (
  estimation?: { hours?: number; points?: number } | number,
  unit?: ListSettings['estimationUnit'] | string
): string => {
  const isPoints = unit === 'Story Points';
  if (typeof estimation === 'number') {
    return isPoints ? `${estimation} pts` : `${estimation}h`;
  }
  if (!estimation) return isPoints ? '0 pts' : '0h';
  return isPoints
    ? `${estimation.points ?? 0} pts`
    : `${estimation.hours ?? 0}h`;
};

export const getEstimationMetric = (
  estimation?: { hours?: number; points?: number } | number,
  unit?: ListSettings['estimationUnit'] | string
): { value: number; unit: string; formatted: string } => {
  const isPoints = unit === 'Story Points';
  const val =
    typeof estimation === 'number'
      ? estimation
      : isPoints
      ? estimation?.points ?? 0
      : estimation?.hours ?? 0;
  const unitLabel = isPoints ? 'pts' : 'h';
  return { value: val, unit: unitLabel, formatted: `${val} ${unitLabel}` };
};
