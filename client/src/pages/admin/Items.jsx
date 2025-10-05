import { useEffect, useRef, useState } from 'react'
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

export default function AdminItems(){
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState(null) // { uid, name, price }
  const [deleting, setDeleting] = useState(null) // uid
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [msg, setMsg] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [imgError, setImgError] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const [avatarHover, setAvatarHover] = useState(false)

  async function refresh(){
    const { data } = await authAxios().get(`/api/admin/items?page=${page}&pageSize=${pageSize}`)
    if (Array.isArray(data)) {
      // Back-compat: server returned full list
      setItems(data)
      setTotal(data.length)
    } else {
      setItems(data.data || [])
      setTotal(data.total || 0)
    }
  }

  useEffect(()=>{ refresh() }, [page, pageSize])

  // Ensure current page stays within bounds when total/pageSize changes
  useEffect(()=>{
    const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1)
    if (page > maxPage) setPage(maxPage)
  }, [total, pageSize])

  function getPageList(cur, max){
    const pages = []
    if (max <= 7){
      for(let i=1;i<=max;i++) pages.push(i)
      return pages
    }
    const add = n => { if (!pages.includes(n)) pages.push(n) }
    add(1)
    const start = Math.max(2, cur - 1)
    const end = Math.min(max - 1, cur + 1)
    if (start > 2) pages.push('…')
    for(let i=start;i<=end;i++) add(i)
    if (end < max - 1) pages.push('…')
    add(max)
    return pages
  }

  // Revoke blob URL when preview changes/unmounts to avoid memory leaks
  useEffect(()=>{
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  async function add(){
    try{
      setSubmitting(true); setUploadPct(0); setMsg('')
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      if(image) formData.append('image', image);
      await authAxios().post('/api/admin/items', formData, {
        onUploadProgress: (e)=>{
          if (!e.total) return; // defensive
          setUploadPct(Math.round((e.loaded / e.total) * 100))
        }
      });
      setName(''); setPrice(''); setImage(null); setPreviewUrl(null); setImgError(''); setMsg('Item added');
      refresh();
    }catch(e){ setMsg(e.response?.data?.message || e.message) }
    finally { setSubmitting(false); setTimeout(()=> setUploadPct(0), 400) }
  }

  const ACCEPTED_TYPES = ['image/jpeg','image/png','image/webp','image/gif']
  const MAX_SIZE = 3 * 1024 * 1024 // 3MB

  function validateFile(f){
    if (!f) return 'No file selected'
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Only JPG, PNG, WEBP or GIF allowed'
    if (f.size > MAX_SIZE) return 'Max size is 3MB'
    return null
  }

  function handleFile(f){
    const err = validateFile(f)
    if (err){ setImgError(err); return }
    setImgError('')
    setImage(f)
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f) })
  }

  function onDrop(e){
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }
  function onDragOver(e){ e.preventDefault(); e.stopPropagation(); setDragActive(true) }
  function onDragLeave(e){ e.preventDefault(); e.stopPropagation(); setDragActive(false) }
  function onPickClick(){ fileInputRef.current?.click() }
  function onKey(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPickClick() } }
  function clearImage(){ setImage(null); setImgError(''); setPreviewUrl(prev=>{ if(prev) URL.revokeObjectURL(prev); return null }) }

  return (
    <Layout>
      <div className={`${theme.row} ${theme.fadeIn}`} style={{margin:'12px 0'}}>
        <h2 className={theme.title}>Admin • Items</h2>
        <div className={theme.spacer}/>
        <div className={s.tabs}>
          <a className={s.tab} href="/admin/roles">Roles</a>
          <a className={s.tab} href="/admin/users">Users</a>
          <a className={`${s.tab} ${s.active}`}>Items</a>
        </div>
      </div>

      <div className={theme.grid}>
        <Card title="Add Item" className={theme.slideUp}>
          <div className={s.form}>
            {/* Circular avatar-style uploader */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              style={{display:'none'}}
              onChange={e=>{ const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={onKey}
                onClick={onPickClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onMouseEnter={()=> setAvatarHover(true)}
                onMouseLeave={()=> setAvatarHover(false)}
                onFocus={()=> setAvatarHover(true)}
                onBlur={()=> setAvatarHover(false)}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: previewUrl ? '2px solid #e5e7eb' : '2px dashed #e5e7eb',
                  background: dragActive ? 'rgba(0,0,0,0.03)' : '#fafafa',
                  display: 'grid',
                  placeItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:13, fontWeight:600}}>Browse</div>
                    <div className={theme.muted} style={{fontSize:11}}>Click to upload</div>
                  </div>
                )}
                {previewUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: avatarHover ? 'rgba(0,0,0,0.25)' : 'transparent',
                      opacity: avatarHover ? 1 : 0,
                      transition: 'opacity .15s ease, background .15s ease',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={(e)=>{ e.stopPropagation(); clearImage() }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        pointerEvents: 'auto'
                      }}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
              <div className={theme.muted} style={{fontSize:12}}>
                JPG, PNG, WEBP, GIF • up to 3MB
              </div>
            </div>
            {imgError && <div style={{color:'#b91c1c', marginTop:6}}>{imgError}</div>}

            {uploadPct > 0 && submitting && (
              <div style={{marginTop:10}}>
                <div style={{height:6, background:'#eee', borderRadius:999}}>
                  <div style={{width:`${uploadPct}%`, height:'100%', background:'#3b82f6', borderRadius:999, transition:'width .2s ease'}} />
                </div>
                <div className={theme.muted} style={{fontSize:12, marginTop:4}}>Uploading… {uploadPct}%</div>
              </div>
            )}
            <input className={s.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
            <input className={s.input} value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" />
            <Button variant="primary" onClick={add} disabled={submitting}> {submitting ? 'Adding…' : 'Add'} </Button>
            {msg && <div className={theme.muted}>{msg}</div>}
          </div>
        </Card>
        <Card title="Items" className={theme.slideUp}>
          <div style={{overflowX:'auto'}}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>Image</th>
                  <th className={s.th}>Name</th>
                  <th className={s.th}>Price</th>
                  <th className={s.th} style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it,i)=> (
                  <tr key={it.uid || i} style={{'--i': i}}>
                    <td className={s.td}>
                      {it.image ? (
                        <img
                          src={it.image.startsWith('http') ? it.image : (it.image.startsWith('/') ? it.image : `/uploads/${it.image}`)}
                          alt={it.name}
                          style={{width:48,height:48,objectFit:'cover',borderRadius:6}}
                        />
                      ) : (
                        <span className={theme.muted}>—</span>
                      )}
                    </td>
                    <td className={s.td}>{it.name}</td>
                    <td className={s.td}>₹{it.price}</td>
                    <td className={s.td} style={{textAlign:'right'}}>
                      <Button size="small" variant="secondary" onClick={()=> setEditing({ uid: it.uid, name: it.name, price: it.price })}>Edit</Button>
                      <Button size="small" variant="ghost" onClick={()=> setDeleting(it.uid)} style={{marginLeft:8, color:'#ef4444'}}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Edit dialog */}
          {editing && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setEditing(null)}>
              <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:360, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                <div className={theme.title} style={{fontSize:18, marginBottom:10}}>Edit Item</div>
                <input className={s.input} value={editing.name} onChange={e=> setEditing(ed=> ({...ed, name: e.target.value}))} placeholder="Name" />
                <input className={s.input} value={editing.price} onChange={e=> setEditing(ed=> ({...ed, price: e.target.value}))} placeholder="Price" />
                <div className={theme.row} style={{marginTop:10}}>
                  <div className={theme.spacer}/>
                  <Button variant="ghost" onClick={()=> setEditing(null)}>Cancel</Button>
                  <Button variant="primary" onClick={async()=>{
                    try{
                      const fd = new FormData()
                      fd.append('name', editing.name)
                      fd.append('price', editing.price)
                      await authAxios().put(`/api/admin/items/${editing.uid}`, fd)
                      setEditing(null)
                      refresh()
                    }catch(e){ alert(e.response?.data?.message || e.message) }
                  }} style={{marginLeft:8}}>Save</Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {deleting && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:50}} onClick={()=> setDeleting(null)}>
              <div onClick={e=>e.stopPropagation()} style={{background:'#fff', borderRadius:10, padding:16, width:320, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                <div style={{marginBottom:12}}>Are you sure you want to delete this item?</div>
                <div className={theme.row}>
                  <div className={theme.spacer}/>
                  <Button variant="ghost" onClick={()=> setDeleting(null)}>Cancel</Button>
                  <Button variant="primary" onClick={async()=>{
                    try{
                      try{
                        await authAxios().delete(`/api/admin/items/${deleting}`)
                      } catch (err) {
                        const status = err?.response?.status
                        // Fallback for proxies/environments that block DELETE
                        if (status === 404 || status === 405) {
                          await authAxios().post(`/api/admin/items/${deleting}/delete`)
                        } else {
                          throw err
                        }
                      }
                      setDeleting(null)
                      refresh()
                    }catch(e){ alert(e.response?.data?.message || e.message) }
                  }} style={{marginLeft:8, background:'#ef4444'}}>Delete</Button>
                </div>
              </div>
            </div>
          )}
          <div className={theme.row} style={{marginTop:12, alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap'}}>
      {(() => {
              const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1)
              const canPrev = page > 1
              const canNext = page < maxPage
              const controlColor = '#689f38' // green
              const controlMuted = '#0f172a' // light green
              return (
                <>
        {/* Total on the left */}
        <div className={theme.muted} style={{fontSize:12}}>Total: {total}</div>
        <div className={theme.spacer}/>

        {/* Center controls */}
        <div className={theme.row} style={{alignItems:'center', gap:10}}>
                    <button
                      type="button"
                      onClick={()=> setPage(1)}
                      disabled={!canPrev}
                      style={{
                        background:'transparent', border:'none', color: controlColor, cursor: canPrev?'pointer':'default',
                        opacity: canPrev?1:0.4, fontSize:18
                      }}
                      aria-label="First page"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={()=> setPage(p=> Math.max(1, p-1))}
                      disabled={!canPrev}
                      style={{
                        background:'transparent', border:'none', color: controlColor, cursor: canPrev?'pointer':'default',
                        opacity: canPrev?1:0.4, fontSize:18
                      }}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                    <div style={{background: controlMuted, padding:'6px 10px', borderRadius:8}}>
                      <div style={{background:'#0f172a', borderRadius:6, fontWeight:400}}>
                        {Math.min(page, maxPage)}&nbsp;of&nbsp;{maxPage}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={()=> setPage(p=> Math.min(maxPage, p+1))}
                      disabled={!canNext}
                      style={{
                        background:'transparent', border:'none', color: controlColor, cursor: canNext?'pointer':'default',
                        opacity: canNext?1:0.4, fontSize:18
                      }}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      onClick={()=> setPage(maxPage)}
                      disabled={!canNext}
                      style={{
                        background:'transparent', border:'none', color: controlColor, cursor: canNext?'pointer':'default',
                        opacity: canNext?1:0.4, fontSize:18
                      }}
                      aria-label="Last page"
                    >
                      »
                    </button>
                  </div>
        <div className={theme.spacer}/>

        {/* Page size on the right */}
        <div className={theme.row} style={{gap:8, alignItems:'center'}}>
                    <select className={s.input} value={pageSize} onChange={e=>{ setPage(1); setPageSize(parseInt(e.target.value)||10) }} style={{width:110}}>
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </>
              )
            })()}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
