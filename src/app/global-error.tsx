'use client'
import { useEffect } from 'react'

// Last-resort boundary: replaces the ROOT layout when an error happens above the
// locale tree, so it renders its own <html>/<body> and cannot use next-intl
// (no provider here). Copy is in Ukrainian — the default brand language.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="uk">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b08',
          color: '#e9e5dc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Щось пішло не так
          </h1>
          <p style={{ color: '#b3aa92', margin: '0 0 24px' }}>
            Сталася неочікувана помилка. Спробуйте ще раз.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#c9a227',
              color: '#0e0e0a',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Спробувати ще раз
          </button>
        </div>
      </body>
    </html>
  )
}
