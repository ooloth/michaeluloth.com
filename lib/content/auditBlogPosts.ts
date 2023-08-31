import { isPost, type Post } from '../../src/utils/posts'
import sendEmail from '../sendGrid/sendEmail'

async function auditBlogPosts(posts: Post[]): Promise<void> {
  // Only proceed if this is an audit build
  if (!import.meta.env.AUDIT_CONTENT) return

  const noTitle: Post[] = []
  const scheduled: Post[] = []

  type DraftsByStatus = {
    announcing: { emoji: string; items: Post[] }
    publishing: { emoji: string; items: Post[] }
    editing: { emoji: string; items: Post[] }
    drafting: { emoji: string; items: Post[] }
    outlining: { emoji: string; items: Post[] }
    researching: { emoji: string; items: Post[] }
    unknown: { emoji: string; items: Post[] }
  }

  const draftsByStatus: DraftsByStatus = {
    announcing: { emoji: '🎙️', items: [] },
    publishing: { emoji: '🚀', items: [] },
    editing: { emoji: '💅', items: [] },
    drafting: { emoji: '🤮', items: [] },
    outlining: { emoji: '🌳', items: [] },
    researching: { emoji: '🔍', items: [] },
    unknown: { emoji: '🤷‍♂️', items: [] },
  }

  posts.forEach(item => {
    if (!item.data.title) noTitle.push(item)
    if (!isPost(item)) return

    // If item is both scheduled and publishing, put it in the scheduled list
    if (item.data.date > Date.now()) {
      scheduled.push(item)
      return
    }

    // Sort drafts by status
    Object.keys(draftsByStatus).forEach(key => {
      if (item.data.status === key) {
        draftsByStatus[key as keyof DraftsByStatus].items.push(item)
        return
      }
    })

    // If item is not published, put it in the unknown status list
    if (!item.data.status && !item.data.published) draftsByStatus.unknown.items.push(item)
  })

  const getItemsHtml = (items: Post[]): string => items.map(item => `<li>${item.slug}</li>`).join('')

  const noTitleHtml = noTitle.length ? `<h3>🤷‍♂️ Missing a title️</h3><ul>${getItemsHtml(noTitle)}</ul>` : ''

  const getScheduledItemsHtml = (items: Post[]): string =>
    items
      // Sort by date, ascending using localeCompare
      .sort((a, b) => a.data.date.localeCompare(b.data.date))
      .map(item => `<li><strong>${item.data.date}:</strong> ${item.data.title}</li>`)
      .join('')

  const scheduledHtml =
    '<h3>Scheduled 📆</h3>' +
    (scheduled.length ? `<ul>${getScheduledItemsHtml(scheduled)}</ul>` : '<em>Time to schedule a post!</em>')

  const draftsHtml = Object.keys(draftsByStatus)
    .map(key =>
      draftsByStatus[key as keyof DraftsByStatus].items.length
        ? `<h3>${key[0].toLocaleUpperCase() + key.slice(1)} ${
            draftsByStatus[key as keyof DraftsByStatus].emoji
          }</h3><ul>${getItemsHtml(draftsByStatus[key as keyof DraftsByStatus].items)}</ul>`
        : '',
    )
    .join('')

  await sendEmail('Blog post status ✍️', noTitleHtml + scheduledHtml + draftsHtml)
}

export default auditBlogPosts
