import { useState, useRef, useCallback, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Studio.module.css'

const PRESET_COLORS = [
  '#C4A882','#8B6F5E','#D4C5B0','#4A4035','#F5F0E8',
  '#6B7C6E','#A8B5A0','#2C3830','#E8DDD0','#9E8B7A',
  '#D4856A','#7A9E9F','#B8C5A8','#5C6B5E','#F0E6D3',
  '#2A2522','#C9B8A8','#8C7B6B','#E2D5C3','#4D3B2F'
]

const SAMPLE_IMAGES = [
  { label: 'Neutral sofa', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600' },
  { label: 'Wood shelf', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600' },
  { label: 'Marble surface', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { label: 'Minimal room', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600' },
  { label: 'Linen texture', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600' },
  { label: 'Clay vessels', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600' },
]

let nextId = 1

export default function Studio() {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const [genInput, setGenInput] = useState('')
  const [genResult, setGenResult] = useState(null)
  const [genLoading, setGenLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const boardRef = useRef(null)
  const fileInputRef = useRef(null)
  const dragState = useRef(null)

  const addItem = useCallback((config) => {
    const board = boardRef.current
    if (!board) return
    const { width, height } = board.getBoundingClientRect()
    const id = nextId++
    const x = 24 + Math.random() * Math.max(10, width - config.w - 48)
    const y = 32 + Math.random() * Math.max(10, height - config.h - 48)
    setItems(prev => [...prev, { id, x, y, ...config }])
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => addItem({ type: 'image', src: e.target.result, w: 160, h: 130 })
      reader.readAsDataURL(file)
    })
  }, [addItem])

  const addSampleImage = (url) => addItem({ type: 'image', src: url, w: 160, h: 130 })
  const addColorSwatch = (hex) => addItem({ type: 'color', color: hex, w: 88, h: 88 })

  const addFromUrl = () => {
    if (!urlInput.trim()) return
    addItem({ type: 'image', src: urlInput.trim(), w: 160, h: 130 })
    setUrlInput('')
  }

  const startDrag = (e, id) => {
    e.preventDefault()
    const item = items.find(i => i.id === id)
    if (!item) return
    dragState.current = {
      id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y
    }
    const onMove = (ev) => {
      if (!dragState.current) return
      const { id, startX, startY, origX, origY } = dragState.current
      setItems(prev => prev.map(i => i.id === id
        ? { ...i, x: Math.max(0, origX + ev.clientX - startX), y: Math.max(0, origY + ev.clientY - startY) }
        : i
      ))
    }
    const onUp = () => {
      dragState.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const toBase64 = (src) => new Promise(resolve => {
    if (src.startsWith('data:')) { resolve(src); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 768
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(null)
    img.src = src
  })

  const analyzeBoard = async () => {
    if (analyzing || items.length === 0) return
    setAnalyzing(true)
    setAnalysis(null)
    setAnalyzeError(null)

    const imageItems = items.filter(i => i.type === 'image')
    const colorItems = items.filter(i => i.type === 'color')

    const b64images = []
    for (const item of imageItems) {
      const b64 = await toBase64(item.src)
      if (b64) b64images.push(b64)
    }

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          payload: { images: b64images, colors: colorItems.map(c => c.color) }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.result)
    } catch (err) {
      setAnalyzeError(err.message)
    }
    setAnalyzing(false)
  }

  const generateDescription = async () => {
    if (!genInput.trim() || genLoading) return
    setGenLoading(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'generate', payload: { description: genInput } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenResult(data.result)
      const hexMatch = data.result.match(/#[0-9A-Fa-f]{6}/)
      if (hexMatch) addColorSwatch(hexMatch[0])
    } catch (err) {
      setGenResult('Error: ' + err.message)
    }
    setGenLoading(false)
  }

  const parseAnalysis = (text) => {
    const sections = []
    const patterns = [
      { key: 'VISUAL IMPRESSION', label: 'Visual impression' },
      { key: 'PALETTE ANALYSIS', label: 'Palette analysis' },
      { key: 'TEXTURE & MATERIAL STORY', label: 'Texture & materials' },
      { key: 'WHAT COHERES', label: 'What coheres' },
      { key: 'FRICTION POINTS', label: 'Friction points' },
      { key: 'DESIGN SYNTHESIS', label: 'Design synthesis' },
    ]
    let remaining = text
    patterns.forEach((p, idx) => {
      const re = new RegExp(`\\*\\*${p.key}\\*\\*\\s*\\n?`, 'i')
      const match = remaining.search(re)
      if (match === -1) return
      const start = match + remaining.match(re)[0].length
      const nextMatch = patterns.slice(idx + 1).reduce((acc, np) => {
        const nre = new RegExp(`\\*\\*${np.key}\\*\\*`, 'i')
        const ni = remaining.indexOf('**' + np.key)
        return ni > -1 && (acc === -1 || ni < acc) ? ni : acc
      }, -1)
      const content = nextMatch > -1 ? remaining.slice(start, nextMatch) : remaining.slice(start)
      sections.push({ label: p.label, content: content.trim() })
    })
    if (sections.length === 0) sections.push({ label: 'Analysis', content: text })
    return sections
  }

  const extractHexColors = (text) => {
    const matches = [...text.matchAll(/#[0-9A-Fa-f]{6}/g)].map(m => m[0])
    const boardColors = items.filter(i => i.type === 'color').map(i => i.color)
    return [...new Set([...matches, ...boardColors])].slice(0, 10)
  }

  return (
    <>
      <Head>
        <title>Moodboard Studio</title>
        <meta name="description" content="AI-powered mood board for interior design and brand identity" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className={styles.app}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.logo}>Moodboard Studio</h1>
            <span className={styles.logoSub}>Interior design &amp; brand identity</span>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            {items.length > 0 && (
              <button className={styles.btnGhost} onClick={() => { setItems([]); setAnalysis(null) }}>
                Clear board
              </button>
            )}
            <button
              className={styles.btnPrimary}
              onClick={analyzeBoard}
              disabled={items.length === 0 || analyzing}
            >
              {analyzing ? 'Analyzing…' : 'Synthesize board →'}
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.tabs}>
              {['upload', 'url', 'color', 'generate'].map(t => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === 'generate' ? 'AI' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'upload' && (
                <div className={styles.tabPanel}>
                  <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                    <span className={styles.uploadIcon}>↑</span>
                    Choose images
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => handleFiles(e.target.files)}
                  />
                  <p className={styles.sectionLabel}>Sample images</p>
                  <div className={styles.sampleList}>
                    {SAMPLE_IMAGES.map(s => (
                      <button key={s.url} className={styles.sampleBtn} onClick={() => addSampleImage(s.url)}>
                        + {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'url' && (
                <div className={styles.tabPanel}>
                  <p className={styles.sectionLabel}>Paste an image URL</p>
                  <input
                    className={styles.textInput}
                    type="text"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFromUrl()}
                  />
                  <button className={styles.btnBlock} onClick={addFromUrl}>Add to board</button>
                </div>
              )}

              {activeTab === 'color' && (
                <div className={styles.tabPanel}>
                  <p className={styles.sectionLabel}>Preset swatches</p>
                  <div className={styles.colorGrid}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        className={styles.colorDot}
                        style={{ background: c }}
                        title={c}
                        onClick={() => addColorSwatch(c)}
                      />
                    ))}
                  </div>
                  <p className={styles.sectionLabel} style={{ marginTop: 14 }}>Custom color</p>
                  <div className={styles.customColorRow}>
                    <input type="color" className={styles.colorPicker} defaultValue="#C4A882"
                      onChange={e => e.target._val = e.target.value}
                      id="colorPickerInput"
                    />
                    <button className={styles.btnBlock} style={{ flex: 1 }}
                      onClick={() => addColorSwatch(document.getElementById('colorPickerInput').value)}>
                      Add swatch
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'generate' && (
                <div className={styles.tabPanel}>
                  <p className={styles.sectionLabel}>Describe an element</p>
                  <textarea
                    className={styles.textArea}
                    rows={3}
                    placeholder="e.g. aged brass hardware, raw linen, terracotta tile…"
                    value={genInput}
                    onChange={e => setGenInput(e.target.value)}
                  />
                  <button className={styles.btnBlock} onClick={generateDescription} disabled={genLoading}>
                    {genLoading ? 'Thinking…' : 'Describe & add color →'}
                  </button>
                  {genResult && (
                    <div className={styles.genResult}>
                      {genResult.split('\n').filter(l => l.trim()).map((line, i) => (
                        <p key={i} className={line.startsWith('COLOR:') ? styles.genColor : styles.genText}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Board */}
          <div className={styles.boardWrap}>
            <div
              ref={boardRef}
              className={`${styles.board} ${dragOver ? styles.boardDragOver : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            >
              {items.length === 0 && (
                <div className={styles.boardEmpty}>
                  <span className={styles.boardEmptyIcon}>◈</span>
                  <p>Drop images here or use the panel to add items</p>
                </div>
              )}
              {items.map(item => (
                <div
                  key={item.id}
                  className={styles.boardItem}
                  style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                  onMouseDown={e => startDrag(e, item.id)}
                >
                  {item.type === 'image' ? (
                    <img src={item.src} alt="" draggable={false}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: item.color }} />
                  )}
                  <button className={styles.deleteBtn} onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis panel */}
          <div className={styles.analysisPanel}>
            <div className={styles.analysisPanelHeader}>
              <span className={styles.analysisPanelTitle}>AI synthesis</span>
              <span className={styles.visionBadge}>Vision</span>
            </div>

            <div className={styles.analysisContent}>
              {!analysis && !analyzing && !analyzeError && (
                <div className={styles.analysisEmpty}>
                  <p>Build your board, then click <strong>Synthesize board</strong> — Claude will visually read each image and tell you how your elements work together.</p>
                </div>
              )}

              {analyzing && (
                <div className={styles.analysisLoading}>
                  <div className={styles.loadingDots}>
                    <span /><span /><span />
                  </div>
                  <p>Reading your board visually…</p>
                </div>
              )}

              {analyzeError && (
                <div className={styles.analysisError}>
                  <p><strong>Error:</strong> {analyzeError}</p>
                  <p className={styles.analysisErrorHint}>Check that your ANTHROPIC_API_KEY is set in .env.local</p>
                </div>
              )}

              {analysis && (() => {
                const sections = parseAnalysis(analysis)
                const hexColors = extractHexColors(analysis)
                return (
                  <div className={styles.analysisResult}>
                    <div className={styles.visionNote}>
                      <span className={styles.visionDot} />
                      Claude analyzed {items.filter(i => i.type === 'image').length} image{items.filter(i => i.type === 'image').length !== 1 ? 's' : ''} + {items.filter(i => i.type === 'color').length} swatch{items.filter(i => i.type === 'color').length !== 1 ? 'es' : ''}
                    </div>
                    {hexColors.length > 0 && (
                      <div className={styles.paletteRow}>
                        {hexColors.map((h, i) => (
                          <div key={i} className={styles.paletteChip} style={{ background: h }} title={h} />
                        ))}
                      </div>
                    )}
                    {sections.map((s, i) => (
                      <div key={i} className={styles.analysisSection}>
                        <h3 className={styles.sectionTitle}>{s.label}</h3>
                        <p className={styles.sectionBody}>{s.content}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
