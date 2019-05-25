import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://web-standards.ru/',
});

export function get(path, params) {
    const queryParams = {
        ...params,
    };

    return axiosInstance.get(path, { params: queryParams });
}
