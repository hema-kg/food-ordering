import styles from './Card.module.css'

export default function Card({ title, sub, children, style, className }){
  return (
    <div className={`${styles.card} ${className||''}`} style={style}>
      {(title||sub) && (
        <div className={styles.header}>
          {title}
          {sub && <div className={styles.sub}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
