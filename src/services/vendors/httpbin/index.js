import * as api from './api';

export function getRemoteIp() {
    return api.get('ip');
}
