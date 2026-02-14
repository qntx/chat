import { useState, useCallback, type FC } from 'react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import type { SyntaxHighlighterProps, CodeHeaderProps } from '@assistant-ui/react-markdown'
import ShikiHighlighter from 'react-shiki'
import remarkGfm from 'remark-gfm'
import { CheckIcon, CopyIcon } from 'lucide-react'

const REMARK_PLUGINS = [remarkGfm]

/** Renders the full code block: header bar + syntax-highlighted body in one container. */
const SyntaxHighlighter: FC<SyntaxHighlighterProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className="my-3 overflow-hidden rounded-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-code-header px-4 py-2">
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
      {/* Code body */}
      <ShikiHighlighter
        language={language}
        theme="github-dark"
        addDefaultStyles={false}
        showLanguage={false}
        className="!m-0 !rounded-none overflow-x-auto bg-code p-4 text-[13px] leading-relaxed"
      >
        {code.trim()}
      </ShikiHighlighter>
    </div>
  )
}

/** Empty — header is rendered inside SyntaxHighlighter to keep the block unified. */
const CodeHeader: FC<CodeHeaderProps> = () => null

const MD_COMPONENTS = { SyntaxHighlighter, CodeHeader }

export const MarkdownText: FC<{ text: string; status: unknown }> = () => (
  <MarkdownTextPrimitive
    className="aui-md"
    smooth
    remarkPlugins={REMARK_PLUGINS}
    components={MD_COMPONENTS}
  />
)
