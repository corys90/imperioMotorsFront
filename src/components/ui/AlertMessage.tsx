import type { ReactNode } from 'react'

interface AlertMessageProps {
  variant?: string
  children: ReactNode
}

function AlertMessage({ variant = 'primary', children }: AlertMessageProps) {
  return (
    <div className={`alert alert-${variant}`} role="alert">
      {children}
    </div>
  )
}

export default AlertMessage
