import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
