import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MarkdownRendererProps {
  content: string
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#60A5FA',
    primaryTextColor: '#fff',
    primaryBorderColor: '#3B82F6',
    lineColor: '#60A5FA',
    secondaryColor: '#8B5CF6',
    tertiaryColor: '#14B8A6',
    background: '#1a1a2e',
    mainBkg: '#1a1a2e',
    secondBkg: '#16213e',
    textColor: '#e5e7eb',
    fontSize: '14px',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    padding: 20
  }
})

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderMermaidDiagrams = async () => {
      if (!containerRef.current) return

      const container = containerRef.current
      
      // Find all mermaid code blocks
      const mermaidBlocks = container.querySelectorAll('.mermaid-code')
      
      for (let i = 0; i < mermaidBlocks.length; i++) {
        const block = mermaidBlocks[i] as HTMLElement
        const code = block.textContent || ''
        
        try {
          const id = `mermaid-${Date.now()}-${i}`
          const { svg } = await mermaid.render(id, code)
          
          // Replace code block with rendered diagram
          const wrapper = document.createElement('div')
          wrapper.className = 'mermaid-diagram bg-white/5 p-6 rounded-lg border border-white/10 overflow-x-auto overflow-y-auto my-4 min-h-[200px] max-h-[600px] w-full'
          wrapper.innerHTML = svg
          
          // Make sure SVG uses full width available
          const svgElement = wrapper.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
            svgElement.removeAttribute('width')
          }
          
          block.replaceWith(wrapper)
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error)
          // Keep the original code block on error
        }
      }
    }

    renderMermaidDiagrams()
  }, [content])

  const processContent = (text: string) => {
    // Split content into parts: text and mermaid blocks
    const parts: Array<{ type: 'text' | 'mermaid', content: string }> = []
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = mermaidRegex.exec(text)) !== null) {
      // Add text before mermaid block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        })
      }
      
      // Add mermaid block
      parts.push({
        type: 'mermaid',
        content: match[1].trim()
      })
      
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      })
    }

    return parts
  }

  const parts = processContent(content)

  return (
    <div ref={containerRef} className="markdown-content">
      {parts.map((part, index) => {
        if (part.type === 'mermaid') {
          return (
            <pre key={index} className="mermaid-code hidden">
              {part.content}
            </pre>
          )
        } else {
          // Render text content with basic formatting
          const lines = part.content.split('\n')
          return (
            <div key={index} className="prose prose-invert max-w-none">
              {lines.map((line, lineIndex) => {
                // Handle headers
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={lineIndex} className="text-lg font-semibold text-white mt-4 mb-2">
                      {line.substring(4)}
                    </h3>
                  )
                } else if (line.startsWith('## ')) {
                  return (
                    <h2 key={lineIndex} className="text-xl font-bold text-white mt-6 mb-3">
                      {line.substring(3)}
                    </h2>
                  )
                } else if (line.startsWith('# ')) {
                  return (
                    <h1 key={lineIndex} className="text-2xl font-bold text-white mt-8 mb-4">
                      {line.substring(2)}
                    </h1>
                  )
                }
                // Handle italic text between underscores
                else if (line.match(/^_.*_$/)) {
                  return (
                    <p key={lineIndex} className="text-gray-400 italic text-sm my-2">
                      {line.substring(1, line.length - 1)}
                    </p>
                  )
                }
                // Handle lists
                else if (line.match(/^\s*-\s+/)) {
                  return (
                    <li key={lineIndex} className="text-gray-300 ml-4">
                      {line.replace(/^\s*-\s+/, '')}
                    </li>
                  )
                }
                // Handle bold text
                else if (line.match(/\*\*.*\*\*/)) {
                  const parts = line.split(/(\*\*.*?\*\*)/)
                  return (
                    <p key={lineIndex} className="text-gray-300 my-1">
                      {parts.map((p, i) => 
                        p.startsWith('**') && p.endsWith('**') ? (
                          <strong key={i} className="text-white font-semibold">
                            {p.substring(2, p.length - 2)}
                          </strong>
                        ) : (
                          <span key={i}>{p}</span>
                        )
                      )}
                    </p>
                  )
                }
                // Regular text or empty lines
                else if (line.trim() === '') {
                  return <div key={lineIndex} className="h-2" />
                } else if (line.trim() === '---') {
                  return <hr key={lineIndex} className="border-white/10 my-4" />
                } else {
                  return (
                    <p key={lineIndex} className="text-gray-300 my-1">
                      {line}
                    </p>
                  )
                }
              })}
            </div>
          )
        }
      })}
    </div>
  )
}
