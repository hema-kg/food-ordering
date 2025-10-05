import axios from 'axios'

export function api(){
  const token = localStorage.getItem('token')
  const instance = axios.create({ baseURL: '/api' })
  instance.interceptors.request.use(cfg=>{
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })
  return instance
}
