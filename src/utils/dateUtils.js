import { isEqual, format } from 'date-fns';

export function isApril1st() {
    const today = new Date();
    return format(today, 'MM-dd') === '04-01';
}