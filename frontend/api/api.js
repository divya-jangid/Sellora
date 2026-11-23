
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://sellora-3-3e6c.onrender.com',
    withCredentials: true,
});

export default api;
