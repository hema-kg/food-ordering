import styles from './Button.module.css'

function cx(...parts){
  return parts.filter(Boolean).join(' ')
}

export default function Button({ children, variant='ghost', size, full, ...props }){
  return (
    <button className={cx(styles.btn, styles[variant], size&&styles[size], full&&styles.full)} {...props}>
      {children}
    </button>
  )
}
