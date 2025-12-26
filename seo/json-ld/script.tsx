type JsonLdScriptProps = Readonly<{
  data: Record<string, unknown>
}>

/**
 * Renders a JSON-LD script tag with proper XSS escaping.
 * Escapes < characters to prevent XSS if content contains </script>
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#embedding_data_in_html
 */
export default function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
