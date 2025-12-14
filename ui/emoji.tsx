import { invariant } from '@/utils/invariant'

const emojiLabel = {
  '📖': 'An emoji of an open book.',
  '✍': 'An emoji of a hand writing with a pen.',
  '📺': 'An emoji of a televison.',
  '🎧': 'An emoji of a pair of large headphones.',
  '🧑‍🏫': 'An emoji of a teacher in front of a green chalkboard.',
  '👩‍💻': 'An emoji of a person using a laptop.',
  '📤': 'An emoji of an outbox tray.',
  '🧰': 'An emoji of a red toolbox.',
  '🎉': 'An emoji of confetti flying out of a striped party decoration.',
  '☀️': 'An emoji of a sun.',
  '🌙️': 'An emoji of a crescent moon.',
  '🔖': 'An emoji of a bookmark.',
  '👈': 'A finger pointing left.',
  '👉': 'A finger pointing right.',
} as const

export type EmojiSymbol = keyof typeof emojiLabel

export type EmojiProps = {
  symbol: EmojiSymbol
  className?: string
}

export default function Emoji({ symbol, className }: EmojiProps) {
  const ariaLabel = emojiLabel[symbol]

  invariant(ariaLabel, `Emoji must have aria-label`, { symbol })

  return (
    <span role="img" aria-label={ariaLabel} className={`flex-none ${className ?? ''}`}>
      {symbol}
    </span>
  )
}
