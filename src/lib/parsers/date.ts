import { DateTime } from 'luxon';

const DATE_FORMATS = [
  /[0-9]{4}-[0-9]{2}-[0-9]{2}/gi
];

export function FindDate(str: string): DateTime[] {
  let matchedDates: DateTime[] = [];
  for(let i = 0, l = DATE_FORMATS.length; i < l; ++i) {
    const matches = str.match(DATE_FORMATS[i]);
    if(matches && matches.length) {

      try {
        matches.forEach(match => {
          matchedDates.push(DateTime.fromISO(match.trim()));
        });
        break;
      }
      catch(e) {
        // 
      }
    }
  }

  return matchedDates;
}
