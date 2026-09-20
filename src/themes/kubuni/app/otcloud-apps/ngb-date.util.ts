import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * Convert an ngb-datepicker value to a plain `yyyy-MM-dd` string.
 *
 * A control wired to `ngbDatepicker` always holds an {@link NgbDateStruct} (or null) once the
 * picker's value accessor is attached, regardless of whether the date was typed or picked from the
 * calendar - this is the one place that needs to know that.
 */
export function ngbDateToIso(value: NgbDateStruct | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    const month = String(value.month).padStart(2, '0');
    const day = String(value.day).padStart(2, '0');
    return `${value.year}-${month}-${day}`;
  }
  return value;
}

/**
 * Convert a plain `yyyy-MM-dd` string to the {@link NgbDateStruct} an ngb-datepicker-bound control
 * expects, so a default or previously-saved ISO date displays correctly in the picker.
 */
export function isoToNgbDate(iso: string | null | undefined): NgbDateStruct | null {
  if (!iso) {
    return null;
  }
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
}
