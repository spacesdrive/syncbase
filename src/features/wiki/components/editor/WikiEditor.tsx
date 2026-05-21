import { useEffect, useRef, useCallback } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { uploadToCloudinary } from '../../../../lib/cloudinary'
import { useTheme as useAppTheme } from '../../../../hooks/useTheme'

interface WikiEditorProps {
  pageId: string
  initialContent: any[] | null
  onChange: (blocks: any[], plainText: string) => void
  editable?: boolean
}

function extractPlainText(blocks: any[]): string {
  return blocks
    .map((block) => {
      const text = (block.content || []).map((c: any) => c.text || '').join('')
      const childText = block.children?.length ? extractPlainText(block.children) : ''
      return [text, childText].filter(Boolean).join('\n')
    })
    .join('\n')
}

export function WikiEditor({ pageId, initialContent, onChange, editable = true }: WikiEditorProps) {
  const { dark } = useAppTheme()
  const lastPageId = useRef(pageId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
    uploadFile: async (file: File) => {
      const result = await uploadToCloudinary(file, 'syncbase/wiki')
      return result.url
    },
  })

  // Re-initialize content when page changes
  useEffect(() => {
    if (lastPageId.current !== pageId) {
      lastPageId.current = pageId
      const content = initialContent && initialContent.length > 0 ? initialContent : []
      editor.replaceBlocks(editor.document, content.length > 0 ? content : [{ type: 'paragraph', content: [] }])
    }
  }, [pageId, initialContent, editor])

  const handleChange = useCallback(() => {
    if (!editable) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const blocks = editor.document
      const plainText = extractPlainText(Array.from(blocks))
      onChange(Array.from(blocks), plainText)
    }, 500)
  }, [editor, onChange, editable])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="wiki-editor-root">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={dark ? 'dark' : 'light'}
        onChange={handleChange}
      />
    </div>
  )
}
