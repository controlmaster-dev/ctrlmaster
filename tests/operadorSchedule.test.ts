import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveShiftProgress,
  getHoursUntilNextShift,
  getNextOperatorId,
  getNextShiftSlot,
  getShiftCardWeekStatus,
  getTodayShiftCellStatus,
  sortOperatorsByShiftQueue,
} from '../src/lib/operadorSchedule';
import type { Shift } from '../src/lib/types';

const tuesday = 2;
const shifts: Shift[] = [{ days: [tuesday], start: 8, end: 16 }];

describe('getTodayShiftCellStatus', () => {
  it('marks active during shift hours', () => {
    assert.equal(
      getTodayShiftCellStatus(shifts, tuesday, tuesday, 10),
      'active'
    );
  });

  it('marks ended after shift ends', () => {
    assert.equal(
      getTodayShiftCellStatus(shifts, tuesday, tuesday, 17),
      'ended'
    );
  });

  it('marks upcoming before shift starts', () => {
    assert.equal(
      getTodayShiftCellStatus(shifts, tuesday, tuesday, 6),
      'upcoming'
    );
  });
});

describe('getHoursUntilNextShift', () => {
  it('returns 0 when shift is active', () => {
    assert.equal(getHoursUntilNextShift(shifts, tuesday, 10), 0);
  });

  it('returns hours until start later today', () => {
    assert.equal(getHoursUntilNextShift(shifts, tuesday, 6), 2);
  });
});

describe('sortOperatorsByShiftQueue', () => {
  it('puts active operator first and orders by next shift', () => {
    const active: Shift[] = [{ days: [tuesday], start: 6, end: 14 }];
    const later: Shift[] = [{ days: [tuesday], start: 18, end: 24 }];
    const sorted = sortOperatorsByShiftQueue(
      [
        { id: 'b', name: 'B', defaultShifts: later },
        { id: 'a', name: 'A', defaultShifts: active },
      ],
      tuesday,
      10
    );
    assert.equal(sorted[0].id, 'a');
    assert.equal(sorted[1].id, 'b');
  });
});

describe('getNextOperatorId', () => {
  it('picks operator with soonest upcoming shift', () => {
    const id = getNextOperatorId(
      [
        { id: 'far', defaultShifts: [{ days: [3], start: 8, end: 16 }] },
        {
          id: 'soon',
          defaultShifts: [{ days: [tuesday], start: 8, end: 16 }],
        },
      ],
      tuesday,
      6
    );
    assert.equal(id, 'soon');
  });
});

describe('getNextShiftSlot', () => {
  it('picks the closest upcoming shift', () => {
    const ops = [
      {
        id: 'andres',
        shifts: [{ days: [3], start: 0, end: 6 }],
      },
      {
        id: 'other',
        shifts: [{ days: [3], start: 8, end: 16 }],
      },
    ];
    const slot = getNextShiftSlot(ops, tuesday, 20);
    assert.equal(slot?.operatorId, 'andres');
    assert.equal(slot?.dayIdx, 3);
    assert.equal(slot?.shiftStart, 0);
  });
});

describe('getShiftCardWeekStatus', () => {
  const shift = shifts[0];
  const opId = 'op-1';

  it('marks only the next slot as upcoming', () => {
    const next = {
      operatorId: opId,
      dayIdx: 3,
      shiftStart: 8,
      shiftEnd: 16,
    };
    assert.equal(
      getShiftCardWeekStatus(shift, 3, opId, tuesday, 10, true, next),
      'upcoming'
    );
    assert.equal(
      getShiftCardWeekStatus(
        { days: [4], start: 9, end: 18 },
        4,
        'other',
        tuesday,
        10,
        true,
        next
      ),
      'none'
    );
  });

  it('marks active shift today as active', () => {
    assert.equal(
      getShiftCardWeekStatus(shift, tuesday, opId, tuesday, 10, true, null),
      'active'
    );
  });

  it('marks later today shift as upcoming only when it is next', () => {
    const evening: Shift = { days: [tuesday], start: 18, end: 24 };
    const next = {
      operatorId: opId,
      dayIdx: tuesday,
      shiftStart: 18,
      shiftEnd: 24,
    };
    assert.equal(
      getShiftCardWeekStatus(evening, tuesday, opId, tuesday, 10, true, next),
      'upcoming'
    );
    assert.equal(
      getShiftCardWeekStatus(evening, tuesday, opId, tuesday, 10, true, null),
      'none'
    );
  });
});

describe('getActiveShiftProgress', () => {
  it('returns progress while shift is active', () => {
    const stats = getActiveShiftProgress(
      shifts,
      (h) => `${h}`,
      tuesday,
      10
    );
    assert.ok(stats);
    assert.equal(stats.progress, 25);
    assert.equal(stats.remaining, '6h 0m');
  });

  it('returns null when shift ended', () => {
    assert.equal(
      getActiveShiftProgress(shifts, (h) => `${h}`, tuesday, 17),
      null
    );
  });
});
