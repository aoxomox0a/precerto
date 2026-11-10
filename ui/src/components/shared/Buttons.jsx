import React from 'react'
import './Buttons.css'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      className={[
        'button',
        `button-${variant}`,
        `button-${size}`,
        fullWidth ? 'button-full' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
