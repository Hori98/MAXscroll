import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type Props = {
  client: string
  slot: string
}

export function AdSenseSlot({ client, slot }: Props) {
  useEffect(() => {
    const scriptId = 'adsense-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // No-op in local/dev where ads script may be blocked.
    }
  }, [client, slot])

  return (
    <ins
      className="adsbygoogle block min-h-[180px] w-full"
      data-ad-client={client}
      data-ad-format="auto"
      data-ad-slot={slot}
      data-full-width-responsive="true"
    />
  )
}
