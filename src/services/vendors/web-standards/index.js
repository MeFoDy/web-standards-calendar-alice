import * as api from './api';

export function getRemoteCal() {
    return api.get('calendar.ics');
}
