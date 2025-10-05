import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import theme from '../styles/theme.module.css'

function authAxios(){
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

export default function Menu(){
  const [items, setItems] = useState([])
  const [qty, setQty] = useState({})
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    authAxios().get('/api/user/items').then(r=> setItems(r.data))
  },[])

  const total = items.reduce((s,i)=> s + (qty[i.uid]||0)*parseFloat(i.price), 0)

  async function place(){
    setPlacing(true); setMsg('')
    try{
  const itemsSel = Object.entries(qty).filter(([,q])=>q>0).map(([uid,q])=>({ itemUid: uid, quantity: q }))
      const { data } = await authAxios().post('/api/user/orders', { items: itemsSel })
      setQty({}); setMsg(`Order placed: #${data.orderId} Total: ₹${data.total}`)
    }catch(e){ setMsg(e.response?.data?.message || e.message) }
    setPlacing(false)
  }

  return (
    <Layout>
      <div className={`${theme.row} ${theme.fadeIn}`} style={{margin:'12px 0'}}>
        <h2 className={theme.title}>Today’s Menu</h2>
        <div className={theme.spacer}/>
        <Button variant="ghost" onClick={()=> location.href='/orders'}>My Orders</Button>
      </div>

      <div className={`${theme.grid} cols-3 ${theme.stagger}`}>
        {items.map((it, idx)=> (
          <Card key={it.uid} title={it.name} sub={`₹${it.price}`} className={theme.slideUp} style={{'--i': idx}}>
            <div className={theme.row}>
              <Button size="small" onClick={()=> setQty(q=> ({...q, [it.uid]: Math.max((q[it.uid]||0)-1,0)}))}>-</Button>
              <div style={{minWidth:40,textAlign:'center'}}>{qty[it.uid]||0}</div>
              <Button size="small" onClick={()=> setQty(q=> ({...q, [it.uid]: (q[it.uid]||0)+1}))}>+</Button>
              <div className={theme.spacer}/>
              <div className={theme.muted}>₹{(((qty[it.uid]||0)*parseFloat(it.price))||0).toFixed(2)}</div>
            </div>
          </Card>
        ))}
      </div>

  <div className={`${theme.row} ${theme.fadeIn}`} style={{marginTop:18}}>
        <div className={theme.muted}>Total</div>
        <div className={theme.spacer}/>
        <div className={theme.title}>₹{total.toFixed(2)}</div>
      </div>
      <Button variant="primary" full disabled={placing || total<=0} onClick={place}>
        {placing? 'Placing…' : 'Place Order'}
      </Button>
      {msg && <div className={theme.muted} style={{marginTop:8}}>{msg}</div>}
    </Layout>
  )
}
