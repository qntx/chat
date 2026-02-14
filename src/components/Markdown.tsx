import { useState, useCallback, type FC } from 'react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import type { SyntaxHighlighterProps, CodeHeaderProps } from '@assistant-ui/react-markdown'
import ShikiHighlighter from 'react-shiki'
import remarkGfm from 'remark-gfm'
import { CheckIcon, CopyIcon } from 'lucide-react'

const SyntaxHighlighter: FC<SyntaxHighlighterProps> = ({
  code,
  language,
  components: _components,
  node: _node,
}) => (
  <ShikiHighlighter
    language={language}
    theme="github-dark"
    addDefaultStyles={false}
    showLanguage={false}
    className="[&_pre]:overflow-x-auto [&_pre]:rounded-b-xl [&_pre]:bg-muted/75! [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed"
  >
    {code.trim()}
  </ShikiHighlighter>
)

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className="flex items-center justify-between rounded-t-xl bg-muted px-4 py-2">
      <span className="text-xs font-medium text-muted-foreground">{language || 'code'}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? (
          <>
            <CheckIcon className="size-3.5" />
            Copied
          </>
        ) : (
          <>
            <CopyIcon className="size-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  )
}

export const MarkdownText: FC<{ text: string; status: unknown }> = () => (
  <MarkdownTextPrimitive
    className="aui-md-root"
    smooth
    remarkPlugins={[remarkGfm]}
    components={{ SyntaxHighlighter, CodeHeader }}
  />
)
