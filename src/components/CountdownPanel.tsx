type Props = {
  count: number
}

export function CountdownPanel({ count }: Props) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Get Ready</p>
      <div className="mt-6 font-mono text-8xl font-bold text-cyan-100 sm:text-9xl">{count}</div>
    </section>
  )
}
