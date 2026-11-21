import axios from "axios";

const API = axios.create({
    baseURL:'https://sellora-3-3e6c.onrender.com',
    withCredentials:true
})

export default API