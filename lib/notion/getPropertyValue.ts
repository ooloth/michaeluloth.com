// TODO: use notion sdk types?

export default function getPropertyValue(
  properties: any[],
  property_name: any,
): string | string[] | number | boolean | null {
  const property = properties[property_name]

  switch (property.type) {
    case 'title':
      return property.title.map((item: any) => item.plain_text).join('')
    case 'rich_text':
      return property.rich_text.map((item: any) => item.plain_text).join('')
    case 'number':
      return property.number
    case 'select':
      return property.select ? property.select.name : null
    case 'multi_select':
      return property.multi_select.map((item: any) => item.name)
    case 'date':
      return property.date ? property.date.start : null
    case 'people':
      return property.people.map((item: any) => item.name)
    case 'files':
      return property.files.map((item: any) => {
        if (item.type === 'external') {
          return item.external.url
        } else if (item.type === 'file') {
          return item.file.url
        }
      })
    case 'checkbox':
      return property.checkbox
    case 'url':
      return property.url
    case 'email':
      return property.email
    case 'phone_number':
      return property.phone_number
    default:
      return null
  }
}
