type Props = {
  hasTouch: boolean
}

export function ArmedPanel({ hasTouch }: Props) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Ready</p>
      <div className="mt-6 font-mono text-6xl font-bold text-accent sm:text-8xl">SCROLL</div>
      <p className="mt-4 text-cyan-100/75">{hasTouch ? 'Swipe now to launch' : 'Scroll now to launch'}</p>
    </section>
  )
}
