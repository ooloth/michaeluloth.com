import { invariant } from '@/utils/errors/invariant'

const emojiLabel = {
  '📖': 'An open book emoji.',
  '✍': 'An emoji of a hand writing with a pen.',
  '📺': 'A televison emoji.',
  '🎧': 'An emoji of a pair of large headphones.',
  '🧑‍🏫': 'An emoji of a teacher in front of a green chalkboard.',
  '👩‍💻': 'An emoji of a person using a laptop.',
  '📤': 'An outbox tray emoji.',
  '🧰': 'A red toolbox emoji.',
  '🎉': 'An emoji of confetti flying out of a striped party decoration.',
  '☀️': 'A sun emoji.',
  '🌙️': 'A crescent moon emoji.',
  '🔖': 'A bookmark emoji.',
  '👈': 'A finger pointing left.',
  '👉': 'A finger pointing right.',
  '👋': 'A waving hand emoji.',
} as const

export type EmojiSymbol = keyof typeof emojiLabel

export type EmojiProps = {
  symbol: EmojiSymbol
  className?: string
  decorative?: boolean
}

export default function Emoji({ symbol, className, decorative = false }: EmojiProps) {
  const ariaLabel = emojiLabel[symbol]

  invariant(ariaLabel, `Emoji must have aria-label`, { symbol })

  if (decorative) {
    return (
      <span aria-hidden="true" className={`flex-none ${className ?? ''}`}>
        {symbol}
      </span>
    )
  }

  return (
    <span role="img" aria-label={ariaLabel} className={`flex-none ${className ?? ''}`}>
      {symbol}
    </span>
  )
}
