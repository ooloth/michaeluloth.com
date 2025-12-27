type Props = Readonly<{
  color?: 'accent' | 'bright' | 'foreground' | 'muted'
}>

export default function Dot({ color = 'accent' }: Props) {
  const dotClassFromColor = {
    accent: 'text-accent',
    bright: 'text-bright',
    foreground: '',
    muted: 'text-zinc-500',
  } as const

  return <span className={`font-extrabold ${dotClassFromColor[color]}`}>•</span>
}
