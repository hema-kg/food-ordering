import { useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import theme from '../styles/theme.module.css'

export default function Login(){
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin@123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className={`${theme.grid} ${theme.fadeIn}`} style={{placeItems:'center'}}>
        <Card title="Welcome back" sub="Sign in to continue" style={{maxWidth:420, width:'100%', marginTop:48}}>
          <form onSubmit={onSubmit}>
            <div style={{display:'grid', gap:10}}>
              <input className={theme.panel} style={{padding:12,borderRadius:10,border:'1px solid var(--border)',color:'var(--text)'}} value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" />
              <input className={theme.panel} style={{padding:12,borderRadius:10,border:'1px solid var(--border)',color:'var(--text)'}} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
              <Button variant="primary" full disabled={loading}>{loading? 'Signing in...' : 'Sign in'}</Button>
              {error && <div style={{color:'var(--danger)'}}>{error}</div>}
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
