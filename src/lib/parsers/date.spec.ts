import { FindDate } from './date';
import { DateTime } from 'luxon';

describe('date', () => {
  it('finds a single date in a string', () => {
    const matchedDate = DateTime.fromISO('2023-03-30');
    const str = 'This string contains 2023-03-30 as a valid date';

    const dates = FindDate(str);

    expect(dates).toHaveLength(1);
    expect(dates[0]).toEqual(matchedDate);
  });

  it('matches multiple dates in a string', () => {
    const dates = ['2023-03-30', '2023-02-28'];
    const str = `This string contains ${dates[0]} and ${dates[1]}`;

    const foundDates = FindDate(str);

    expect(foundDates).toHaveLength(2);
    expect(foundDates[0]).toEqual(DateTime.fromISO(dates[0]));
    expect(foundDates[1]).toEqual(DateTime.fromISO(dates[1]));
  });

  it('does not error for malformed dates', () => {
    const str = 'This string contains 2023-033-30 as a valid date';

    const dates = FindDate(str);

    expect(dates).toHaveLength(0);
  });
});
