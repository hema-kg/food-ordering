import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import theme from '../../styles/theme.module.css'
import s from './AdminCommon.module.css'

function authAxios(){
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

export default function AdminRoles(){
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [roles, setRoles] = useState([])
  const [editing, setEditing] = useState(null) // {id, name}
  const [deleting, setDeleting] = useState(null) // id

  function authAxios(){
    const token = localStorage.getItem('token')
    return axios.create({ headers: { Authorization: `Bearer ${token}` } })
  }

  async function refresh(){
    try{
      const { data } = await authAxios().get('/api/admin/roles')
      setRoles(data)
    }catch(e){ /* ignore list error in UI for now */ }
  }

  useEffect(()=>{ refresh() }, [])

  async function add(){
    try{
  await authAxios().post('/api/admin/roles', { name })
      setName(''); setMsg('Role added')
  refresh()
    }catch(e){ setMsg(e.response?.data?.message || e.message) }
  }

  return (
    <Layout>
      <div className={`${theme.row} ${theme.fadeIn}`} style={{margin:'12px 0'}}>
        <h2 className={theme.title}>Admin • Roles</h2>
        <div className={theme.spacer}/>
        <div className={s.tabs}>
          <a className={`${s.tab} ${s.active}`}>Roles</a>
          <a className={s.tab} href="/admin/users">Users</a>
          <a className={s.tab} href="/admin/items">Items</a>
        </div>
      </div>

      <Card title="Add Role" className={theme.slideUp}>
        <div className={s.form}>
          <input className={s.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Role name" />
          <Button variant="primary" onClick={add}>Add</Button>
          {msg && <div className={theme.muted}>{msg}</div>}
        </div>
      </Card>
      <Card title="Roles" className={theme.slideUp}>
        <div style={{overflowX:'auto'}}>
          <table className={s.table}>
            <thead>
              <tr><th className={s.th}>ID</th><th className={s.th}>Name</th><th className={s.th} style={{textAlign:'right'}}>Actions</th></tr>
            </thead>
            <tbody>
              {roles.map(r=> (
                <tr key={r.id}>
                  <td className={s.td}>{r.id}</td>
                  <td className={s.td}>{r.name}</td>
                  <td className={s.td} style={{textAlign:'right'}}>
                    <Button size="small" variant="secondary" onClick={()=> setEditing({ id: r.id, name: r.name })}>Edit</Button>
                    <Button size="small" variant="ghost" onClick={()=> setDeleting(r.id)} style={{marginLeft:8, color:'#ef4444'}}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Modal */}
      {editing && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setEditing(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:360, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <div className={theme.title} style={{fontSize:18, marginBottom:10}}>Edit Role</div>
            <input className={s.input} value={editing.name} onChange={e=> setEditing(ed=> ({...ed, name: e.target.value}))} placeholder="Role name" />
            <div className={theme.row} style={{marginTop:10}}>
              <div className={theme.spacer}/>
              <Button variant="ghost" onClick={()=> setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={async()=>{
                try{
                  await authAxios().put(`/api/admin/roles/${editing.id}`, { name: editing.name })
                  setEditing(null)
                  refresh()
                }catch(e){ alert(e.response?.data?.message || e.message) }
              }} style={{marginLeft:8}}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirm */}
      {deleting && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setDeleting(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:320, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <div style={{marginBottom:12}}>Delete this role?</div>
            <div className={theme.row}>
              <div className={theme.spacer}/>
              <Button variant="ghost" onClick={()=> setDeleting(null)}>Cancel</Button>
              <Button variant="primary" onClick={async()=>{
                try{
                  try{
                    await authAxios().delete(`/api/admin/roles/${deleting}`)
                  } catch (err) {
                    const status = err?.response?.status
                    if (status === 404 || status === 405) {
                      await authAxios().post(`/api/admin/roles/${deleting}/delete`)
                    } else { throw err }
                  }
                  setDeleting(null)
                  refresh()
                }catch(e){ alert(e.response?.data?.message || e.message) }
              }} style={{marginLeft:8, background:'#ef4444'}}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
