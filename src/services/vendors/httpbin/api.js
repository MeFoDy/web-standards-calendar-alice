import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://httpbin.org/',
});

export function get(path, params) {
    const queryParams = {
        ...params,
    };

    return axiosInstance.get(path, { params: queryParams });
}
