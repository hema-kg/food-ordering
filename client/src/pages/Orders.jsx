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

export default function Orders(){
  const [orders, setOrders] = useState([])
  useEffect(()=>{
    authAxios().get('/api/user/orders').then(r=> setOrders(r.data))
  },[])

  return (
    <Layout>
      <div className={`${theme.row} ${theme.fadeIn}`} style={{margin:'12px 0'}}>
        <h2 className={theme.title}>My Orders</h2>
        <div className={theme.spacer}/>
        <Button variant="ghost" onClick={()=> location.href='/'}>Back</Button>
      </div>
      <Card className={theme.fadeIn}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{textAlign:'left'}}>
                <th style={{padding:10,borderBottom:'1px solid var(--border)'}}>Status</th>
                <th style={{padding:10,borderBottom:'1px solid var(--border)'}}>Total</th>
                <th style={{padding:10,borderBottom:'1px solid var(--border)'}}>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o=> (
                <tr key={o.id} style={{transition:'background var(--fast) var(--easing)'}} onMouseEnter={e=> e.currentTarget.style.background='rgba(2,6,23,0.02)'} onMouseLeave={e=> e.currentTarget.style.background='transparent'}>
                  <td style={{padding:10,borderBottom:'1px solid var(--border)'}}>
                    <span className={`${theme.badge} ${o.status==='Placed'? theme.badgeSuccess: ''}`}>{o.status}</span>
                  </td>
                  <td style={{padding:10,borderBottom:'1px solid var(--border)'}}>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                  <td style={{padding:10,borderBottom:'1px solid var(--border)'}}>{o.OrderItems?.map(oi=> `${oi.quantity}x ${oi.Item?.name || `#${oi.item_id}`}`).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
