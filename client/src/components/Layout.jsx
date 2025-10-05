import theme from '../styles/theme.module.css'
import styles from './Layout.module.css'

export default function Layout({ children }){
  const user = JSON.parse(localStorage.getItem('user')||'null')
  return (
    <div>
      <header className={`${styles.header}`}>
        <div className={`${theme.container} ${styles.bar}`}>
          <a className={styles.brand} href="/">Foodly</a>
          <div className={theme.spacer}/>
          {user ? (
            <div className={theme.row} style={{gap:8, alignItems:'center'}}>
              <a className={theme.btn} href="/">Menu</a>
              <a className={theme.btn} href="/orders">Orders</a>
              {user.role?.toLowerCase?.() === 'admin' && <a className={theme.btn} href="/admin">Admin</a>}
              <div className={theme.muted} style={{marginLeft:8}}>{user.username} ({user.role})</div>
              <a className={theme.btn} onClick={()=>{localStorage.clear(); location.href='/login'}}>Logout</a>
            </div>
          ): (
            <div className={theme.row} style={{gap:8, alignItems:'center'}}>
              <a className={theme.btn} href="/login">Login</a>
            </div>
          )}
        </div>
      </header>
      <main className={`${theme.container} ${styles.main}`}>
        {children}
      </main>
    </div>
  )
}
