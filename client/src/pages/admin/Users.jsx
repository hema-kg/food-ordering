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

export default function AdminUsers(){
  const [form, setForm] = useState({username:'', firstName:'', lastName:'', email:'', phone:'', password:'', roleName:'User'})
  const [msg, setMsg] = useState('')
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null) // {id, firstName, lastName, email, phone, roleName, status}
  const [deleting, setDeleting] = useState(null) // id

  function set(k, v){ setForm(f=> ({...f, [k]: v})) }

  async function add(){
    try{
      await authAxios().post('/api/admin/users', form)
      setMsg('User created'); setForm({username:'', firstName:'', lastName:'', email:'', phone:'', password:'', roleName:'User'})
      refresh()
    }catch(e){ setMsg(e.response?.data?.message || e.message) }
  }

  async function refresh(){
    try{
      const { data } = await authAxios().get('/api/admin/users')
      setUsers(data)
    }catch(e){ /* ignore list error */ }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <Layout>
      <div className={`${theme.row} ${theme.fadeIn}`} style={{margin:'12px 0'}}>
        <h2 className={theme.title}>Admin • Users</h2>
        <div className={theme.spacer}/>
        <div className={s.tabs}>
          <a className={s.tab} href="/admin/roles">Roles</a>
          <a className={`${s.tab} ${s.active}`}>Users</a>
          <a className={s.tab} href="/admin/items">Items</a>
        </div>
      </div>

      <Card title="Create User" className={theme.slideUp}>
        <div className={s.form}>
          <input className={s.input} value={form.username} onChange={e=>set('username', e.target.value)} placeholder="Username" />
          <div className={theme.row}>
            <input className={s.input} style={{flex:1}} value={form.firstName} onChange={e=>set('firstName', e.target.value)} placeholder="First name" />
            <input className={s.input} style={{flex:1}} value={form.lastName} onChange={e=>set('lastName', e.target.value)} placeholder="Last name" />
          </div>
          <input className={s.input} value={form.email} onChange={e=>set('email', e.target.value)} placeholder="Email" />
          <input className={s.input} value={form.phone} onChange={e=>set('phone', e.target.value)} placeholder="Phone" />
          <input className={s.input} type="password" value={form.password} onChange={e=>set('password', e.target.value)} placeholder="Password" />
          <select className={s.input} value={form.roleName} onChange={e=>set('roleName', e.target.value)}>
            <option>Admin</option>
            <option>User</option>
          </select>
          <Button variant="primary" onClick={add}>Create</Button>
          {msg && <div className={theme.muted}>{msg}</div>}
        </div>
      </Card>
      <Card title="Users" className={theme.slideUp}>
        <div style={{overflowX:'auto'}}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.th}>ID</th>
                <th className={s.th}>Username</th>
                <th className={s.th}>Name</th>
                <th className={s.th}>Email</th>
                <th className={s.th}>Phone</th>
                <th className={s.th}>Role</th>
                <th className={s.th}>Status</th>
                <th className={s.th} style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=> (
                <tr key={u.id}>
                  <td className={s.td}>{u.id}</td>
                  <td className={s.td}>{u.username}</td>
                  <td className={s.td}>{u.firstName} {u.lastName}</td>
                  <td className={s.td}>{u.email}</td>
                  <td className={s.td}>{u.phone}</td>
                  <td className={s.td}>{u.role}</td>
                  <td className={s.td}>{u.status}</td>
                  <td className={s.td} style={{textAlign:'right'}}>
                    <Button size="small" variant="secondary" onClick={()=> setEditing({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, roleName: u.role, status: u.status })}>Edit</Button>
                    <Button size="small" variant="ghost" onClick={()=> setDeleting(u.id)} style={{marginLeft:8, color:'#ef4444'}}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      {editing && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setEditing(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:420, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <div className={theme.title} style={{fontSize:18, marginBottom:10}}>Edit User</div>
            <div className={theme.row}>
              <input className={s.input} style={{flex:1}} value={editing.firstName||''} onChange={e=> setEditing(ed=> ({...ed, firstName: e.target.value}))} placeholder="First name" />
              <input className={s.input} style={{flex:1}} value={editing.lastName||''} onChange={e=> setEditing(ed=> ({...ed, lastName: e.target.value}))} placeholder="Last name" />
            </div>
            <input className={s.input} value={editing.email||''} onChange={e=> setEditing(ed=> ({...ed, email: e.target.value}))} placeholder="Email" />
            <input className={s.input} value={editing.phone||''} onChange={e=> setEditing(ed=> ({...ed, phone: e.target.value}))} placeholder="Phone" />
            <div className={theme.row}>
              <select className={s.input} style={{flex:1}} value={editing.roleName||''} onChange={e=> setEditing(ed=> ({...ed, roleName: e.target.value}))}>
                <option>Admin</option>
                <option>User</option>
              </select>
              <select className={s.input} style={{flex:1}} value={editing.status||'Active'} onChange={e=> setEditing(ed=> ({...ed, status: e.target.value}))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className={theme.row} style={{marginTop:10}}>
              <div className={theme.spacer}/>
              <Button variant="ghost" onClick={()=> setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={async()=>{
                try{
                  const payload = { firstName: editing.firstName, lastName: editing.lastName, email: editing.email, phone: editing.phone, roleName: editing.roleName, status: editing.status }
                  await authAxios().put(`/api/admin/users/${editing.id}`, payload)
                  setEditing(null)
                  refresh()
                }catch(e){ alert(e.response?.data?.message || e.message) }
              }} style={{marginLeft:8}}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm */}
      {deleting && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setDeleting(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:320, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <div style={{marginBottom:12}}>Deactivate this user?</div>
            <div className={theme.row}>
              <div className={theme.spacer}/>
              <Button variant="ghost" onClick={()=> setDeleting(null)}>Cancel</Button>
              <Button variant="primary" onClick={async()=>{
                try{
                  try{
                    await authAxios().delete(`/api/admin/users/${deleting}`)
                  } catch (err) {
                    const status = err?.response?.status
                    if (status === 404 || status === 405) {
                      await authAxios().post(`/api/admin/users/${deleting}/delete`)
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
