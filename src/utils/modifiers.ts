import type { DateTime } from 'luxon';

import { VERTICAL_SCROLLABLE } from '../constants.js';
import getPreviousMonthMemoLast from './getPreviousMonthMemoLast.js';
import isDateTime from './isDateTime.js';
import isDayVisible from './isDayVisible.js';
import toISODateString from './toISODateString.js';
import toISOMonthString from './toISOMonthString.js';

export type DayModifiers = Set<string>;
export type ModifierDays = Record<string, DayModifiers>;
export type VisibleModifiers = Record<string, ModifierDays>;

export interface ModifierProps {
  numberOfMonths: number;
  enableOutsideDays: boolean;
  orientation: string;
}

export interface ModifierState {
  currentMonth: DateTime;
  visibleDays: VisibleModifiers;
}

function modifierWindow(props: ModifierProps, state: ModifierState) {
  let currentMonth: DateTime | null = state.currentMonth;
  let numberOfMonths = props.numberOfMonths;
  if (props.orientation === VERTICAL_SCROLLABLE) {
    numberOfMonths = Object.keys(state.visibleDays).length;
  } else {
    currentMonth = getPreviousMonthMemoLast(currentMonth);
    numberOfMonths += 2;
  }
  return { currentMonth, numberOfMonths };
}

export function addModifier(
  updatedDays: VisibleModifiers,
  day: DateTime | null | undefined,
  modifier: string,
  props: ModifierProps,
  state: ModifierState,
) {
  const { currentMonth, numberOfMonths } = modifierWindow(props, state);
  if (!isDateTime(day)
    || !isDayVisible(day, currentMonth, numberOfMonths, props.enableOutsideDays)) {
    return updatedDays;
  }

  const iso = toISODateString(day);
  if (!iso) return updatedDays;

  let updatedDaysAfterAddition = { ...updatedDays };
  if (props.enableOutsideDays) {
    const monthsToUpdate = Object.keys(state.visibleDays).filter((monthKey) => (
      Object.keys(state.visibleDays[monthKey]).includes(iso)
    ));

    updatedDaysAfterAddition = monthsToUpdate.reduce<VisibleModifiers>((accumulator, monthIso) => {
      const month = updatedDays[monthIso] || state.visibleDays[monthIso];
      const currentModifiers = month[iso];

      if (!currentModifiers || !currentModifiers.has(modifier)) {
        const modifiers = new Set(currentModifiers);
        modifiers.add(modifier);
        accumulator[monthIso] = {
          ...month,
          [iso]: modifiers,
        };
      }

      return accumulator;
    }, updatedDaysAfterAddition);
  } else {
    const monthIso = toISOMonthString(day);
    if (!monthIso) return updatedDays;
    const month = updatedDays[monthIso] || state.visibleDays[monthIso] || {};
    const currentModifiers = month[iso];

    if (!currentModifiers || !currentModifiers.has(modifier)) {
      const modifiers = new Set(currentModifiers);
      modifiers.add(modifier);
      updatedDaysAfterAddition[monthIso] = {
        ...month,
        [iso]: modifiers,
      };
    }
  }

  return updatedDaysAfterAddition;
}

export function deleteModifier(
  updatedDays: VisibleModifiers,
  day: DateTime | null | undefined,
  modifier: string,
  props: ModifierProps,
  state: ModifierState,
) {
  const { currentMonth, numberOfMonths } = modifierWindow(props, state);
  if (!isDateTime(day)
    || !isDayVisible(day, currentMonth, numberOfMonths, props.enableOutsideDays)) {
    return updatedDays;
  }

  const iso = toISODateString(day);
  if (!iso) return updatedDays;

  let updatedDaysAfterDeletion = { ...updatedDays };
  if (props.enableOutsideDays) {
    const monthsToUpdate = Object.keys(state.visibleDays).filter((monthKey) => (
      Object.keys(state.visibleDays[monthKey]).includes(iso)
    ));

    updatedDaysAfterDeletion = monthsToUpdate.reduce<VisibleModifiers>((accumulator, monthIso) => {
      const month = updatedDays[monthIso] || state.visibleDays[monthIso];
      const currentModifiers = month[iso];

      if (currentModifiers?.has(modifier)) {
        const modifiers = new Set(currentModifiers);
        modifiers.delete(modifier);
        accumulator[monthIso] = {
          ...month,
          [iso]: modifiers,
        };
      }

      return accumulator;
    }, updatedDaysAfterDeletion);
  } else {
    const monthIso = toISOMonthString(day);
    if (!monthIso) return updatedDays;
    const month = updatedDays[monthIso] || state.visibleDays[monthIso] || {};
    const currentModifiers = month[iso];

    if (currentModifiers?.has(modifier)) {
      const modifiers = new Set(currentModifiers);
      modifiers.delete(modifier);
      updatedDaysAfterDeletion[monthIso] = {
        ...month,
        [iso]: modifiers,
      };
    }
  }

  return updatedDaysAfterDeletion;
}
