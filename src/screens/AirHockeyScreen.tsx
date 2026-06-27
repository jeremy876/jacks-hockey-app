import { useEffect, useRef, useState, useCallback } from 'react'

const WIN = 7
const COL = {
  bottom: '#16d6c8', bottomDark: '#0a8f87',
  top: '#ff5566', topDark: '#d6253b',
}

interface Puck { x: number; y: number; vx: number; vy: number }
interface Mallet { x: number; y: number; px: number; py: number; vx: number; vy: number; tx: number; ty: number; hasTarget: boolean }
interface GState { puck: Puck; mB: Mallet; mT: Mallet; scoreT: number; scoreB: number; freeze: number; clock: number }

// ── Pure canvas drawing helpers (no React state) ────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x+r, y)
  ctx.arcTo(x+w, y, x+w, y+h, r)
  ctx.arcTo(x+w, y+h, x, y+h, r)
  ctx.arcTo(x, y+h, x, y, r)
  ctx.arcTo(x, y, x+w, y, r)
  ctx.closePath()
}

function drawCrease(ctx: CanvasRenderingContext2D, cx: number, glY: number, netW: number, side: 'top'|'bottom') {
  const r = netW * 0.58
  ctx.beginPath()
  if (side === 'top') ctx.arc(cx, glY, r, 0, Math.PI)
  else                ctx.arc(cx, glY, r, Math.PI, Math.PI*2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(70,140,235,0.28)'; ctx.fill()
  ctx.lineWidth = 2; ctx.strokeStyle = '#1f5fd0'; ctx.stroke()
}

function drawNet(ctx: CanvasRenderingContext2D, cx: number, glY: number, netW: number, side: 'top'|'bottom') {
  const hx = netW/2
  const depth = netW * 0.42 * (side === 'top' ? -1 : 1)
  const backY  = glY + depth
  const left = cx - hx, right = cx + hx
  const y0 = Math.min(glY, backY), y1 = Math.max(glY, backY)
  ctx.save()
  ctx.beginPath(); ctx.rect(left, y0, netW, y1-y0); ctx.clip()
  ctx.fillStyle = 'rgba(236,242,248,0.62)'; ctx.fillRect(left, y0, netW, y1-y0)
  ctx.strokeStyle = 'rgba(110,130,160,0.5)'; ctx.lineWidth = 1
  for (let x = left; x <= right; x += 9) { ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke() }
  for (let yy = y0; yy <= y1; yy += 9) { ctx.beginPath(); ctx.moveTo(left,yy); ctx.lineTo(right,yy); ctx.stroke() }
  ctx.restore()
  ctx.strokeStyle = '#d2122c'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(left,glY); ctx.lineTo(left,backY); ctx.lineTo(right,backY); ctx.lineTo(right,glY); ctx.stroke()
  ctx.fillStyle = '#d2122c'
  ctx.beginPath(); ctx.arc(left,  glY, 5, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(right, glY, 5, 0, Math.PI*2); ctx.fill()
}

function drawMallet(ctx: CanvasRenderingContext2D, m: Mallet, color: string, dark: string, R: number) {
  ctx.beginPath(); ctx.ellipse(m.x, m.y+R*0.32, R*0.95, R*0.55, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill()
  const g1 = ctx.createLinearGradient(m.x, m.y-R, m.x, m.y+R)
  g1.addColorStop(0, color); g1.addColorStop(1, dark)
  ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, Math.PI*2); ctx.fillStyle = g1; ctx.fill()
  ctx.beginPath(); ctx.arc(m.x, m.y, R*0.66, 0, Math.PI*2); ctx.fillStyle = dark; ctx.fill()
  const g2 = ctx.createRadialGradient(m.x-R*0.16, m.y-R*0.22, R*0.05, m.x, m.y, R*0.5)
  g2.addColorStop(0, '#fff'); g2.addColorStop(0.5, color); g2.addColorStop(1, dark)
  ctx.beginPath(); ctx.arc(m.x, m.y, R*0.42, 0, Math.PI*2); ctx.fillStyle = g2; ctx.fill()
  ctx.beginPath(); ctx.arc(m.x, m.y, R*0.96, Math.PI*1.05, Math.PI*1.75)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke()
}

function drawPuck(ctx: CanvasRenderingContext2D, pk: Puck, pr: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4
  const g = ctx.createRadialGradient(pk.x-pr*0.3, pk.y-pr*0.3, pr*0.1, pk.x, pk.y, pr)
  g.addColorStop(0, '#3a3f48'); g.addColorStop(0.6, '#16191f'); g.addColorStop(1, '#070809')
  ctx.beginPath(); ctx.arc(pk.x, pk.y, pr, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill()
  ctx.restore()
  ctx.beginPath(); ctx.arc(pk.x, pk.y, pr*0.97, Math.PI, Math.PI*1.6)
  ctx.strokeStyle = 'rgba(140,200,230,0.6)'; ctx.lineWidth = 2; ctx.stroke()
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { soundOn: boolean; onGoHome: () => void }

export function AirHockeyScreen({ soundOn, onGoHome }: Props) {

  // UI state — only for overlay rendering
  const [gameScreen, setGameScreen] = useState<'menu'|'play'|'win'>('menu')
  const [mode,       setMode]       = useState<1|2>(1)
  const [paused,     setPaused]     = useState(false)
  const [muted,      setMuted]      = useState(!soundOn)
  const [scoreT,     setScoreT]     = useState(0)
  const [scoreB,     setScoreB]     = useState(0)
  const [clock,      setClock]      = useState(0)
  const [goalInfo,   setGoalInfo]   = useState<{ team: string; color: string } | null>(null)
  const [winnerLabel, setWinnerLabel] = useState('')
  const [winnerColor, setWinnerColor] = useState('#16d6c8')
  const [finalScore,  setFinalScore]  = useState('')

  // Sync refs — let the game loop read these without stale closure issues
  const screenRef  = useRef<'menu'|'play'|'win'>('menu')
  const pausedRef  = useRef(false)
  const modeRef    = useRef<1|2>(1)
  const mutedRef   = useRef(!soundOn)

  // Canvas & geometry
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const W  = useRef(0), H  = useRef(0)
  const R  = useRef(30), pr = useRef(20)  // mallet & puck radius

  // Game objects
  const gRef    = useRef<GState | null>(null)
  const trail   = useRef<{x:number;y:number}[]>([])
  const flash   = useRef(0)
  const flashC  = useRef('#fff')
  const pointers = useRef(new Map<number,'T'|'B'>())

  // Loop & timers
  const rafRef  = useRef(0)
  const lastT   = useRef(performance.now())
  const lastSec = useRef(-1)
  const goalTO  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Audio
  const acRef = useRef<AudioContext | null>(null)

  // ── Geometry ──────────────────────────────────────────────────────────────
  function geom() {
    const w = W.current, h = H.current
    const pad = Math.max(10, w*0.02)
    const tx = pad, ty = pad, tw = w-pad*2, th = h-pad*2
    return {
      tx, ty, tw, th,
      rad: Math.min(tw*0.22, th*0.5),
      cx: w/2,
      glTop: ty + Math.max(28, th*0.08),
      glBot: ty + th - Math.max(28, th*0.08),
      netW: Math.min(tw*0.34, 240),
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function initAudio() {
    if (acRef.current) { acRef.current.resume?.(); return }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AC) acRef.current = new AC()
  }

  function tone(freq: number, dur: number, type: OscillatorType, gain: number) {
    if (mutedRef.current || !acRef.current) return
    const ac = acRef.current, t = ac.currentTime
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur)
    o.connect(g).connect(ac.destination)
    o.start(t); o.stop(t+dur)
  }

  function hitSound(str: number) { tone(150 + Math.min(360, str*26), 0.07, 'square', 0.10) }
  function wallSound()           { tone(120, 0.05, 'sine', 0.05) }
  function hornSound() {
    if (mutedRef.current || !acRef.current) return
    tone(196, 0.55, 'sawtooth', 0.16); tone(247, 0.55, 'sawtooth', 0.12)
    setTimeout(() => { tone(294, 0.5, 'sawtooth', 0.15); tone(370, 0.5, 'sawtooth', 0.10) }, 130)
  }

  // ── Physics helpers ───────────────────────────────────────────────────────
  function clampMallet(m: Mallet, side: 'T'|'B') {
    const r = R.current, w = W.current, h = H.current
    m.x = Math.max(r, Math.min(w-r, m.x))
    m.y = side === 'B' ? Math.max(h/2+r*0.1, Math.min(h-r, m.y))
                       : Math.max(r, Math.min(h/2-r*0.1, m.y))
  }

  function updateMallet(m: Mallet, side: 'T'|'B') {
    m.px = m.x; m.py = m.y
    if (m.hasTarget) { m.x = m.tx; m.y = m.ty }
    clampMallet(m, side)
    m.vx = m.x-m.px; m.vy = m.y-m.py
  }

  function updateAI() {
    const g = gRef.current; if (!g) return
    const w = W.current, h = H.current, r = R.current
    const m = g.mT, pk = g.puck
    let tx: number, ty: number
    if (pk.y < h*0.52) {
      tx = pk.x + (pk.x - w/2)*0.10
      ty = pk.y < h*0.32 ? pk.y - r*0.2 : pk.y - r*0.7
    } else {
      tx = w/2 + (pk.x - w/2)*0.35
      ty = h*0.17
    }
    tx = Math.max(r, Math.min(w-r, tx))
    m.px = m.x; m.py = m.y
    m.x += (tx - m.x)*0.16; m.y += (ty - m.y)*0.16
    clampMallet(m, 'T')
    m.vx = m.x-m.px; m.vy = m.y-m.py
  }

  function collide(m: Mallet) {
    const g = gRef.current; if (!g) return
    const pk = g.puck, minD = pr.current + R.current
    const dx = pk.x-m.x, dy = pk.y-m.y, d = Math.hypot(dx, dy)
    if (d >= minD || d === 0) return
    const nx = dx/d, ny = dy/d
    pk.x = m.x+nx*minD; pk.y = m.y+ny*minD
    const dot = pk.vx*nx + pk.vy*ny
    pk.vx -= 2*dot*nx; pk.vy -= 2*dot*ny
    pk.vx += m.vx*1.15; pk.vy += m.vy*1.15
    const sep = pk.vx*nx + pk.vy*ny
    if (sep < 3.2) { pk.vx += nx*(3.2-sep); pk.vy += ny*(3.2-sep) }
    hitSound(Math.hypot(m.vx, m.vy))
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  function scoreGoal(who: 'T'|'B') {
    const g = gRef.current; if (!g) return
    if (screenRef.current !== 'play') { serve(who === 'T' ? 1 : -1); return }
    if (who === 'T') g.scoreT++; else g.scoreB++
    flash.current = 0.55; flashC.current = who === 'T' ? COL.top : COL.bottom
    trail.current = []
    hornSound()
    setScoreT(g.scoreT); setScoreB(g.scoreB)
    setGoalInfo({ team: who === 'T' ? 'RANGERS' : 'SHARKS', color: who === 'T' ? COL.top : COL.bottom })
    if (goalTO.current) clearTimeout(goalTO.current)
    goalTO.current = setTimeout(() => setGoalInfo(null), 1500)
    if (g.scoreT >= WIN || g.scoreB >= WIN) {
      const bWon = g.scoreB > g.scoreT
      setWinnerLabel(bWon ? 'SHARKS WIN!' : (modeRef.current === 2 ? 'RANGERS WIN!' : 'COMPUTER WINS'))
      setWinnerColor(bWon ? COL.bottom : COL.top)
      setFinalScore(`${g.scoreB} — ${g.scoreT}`)
      setGameScreen('win'); screenRef.current = 'win'
      return
    }
    serve(who === 'T' ? 1 : -1)
  }

  // ── Game state setup ──────────────────────────────────────────────────────
  function buildGame() {
    const w = W.current, h = H.current
    gRef.current = {
      puck: { x: w/2, y: h/2, vx: 0, vy: 0 },
      mB: { x: w/2, y: h*0.82, px: w/2, py: h*0.82, vx:0, vy:0, tx:0, ty:0, hasTarget:false },
      mT: { x: w/2, y: h*0.18, px: w/2, py: h*0.18, vx:0, vy:0, tx:0, ty:0, hasTarget:false },
      scoreT: 0, scoreB: 0, freeze: 0, clock: 0,
    }
    lastSec.current = -1; trail.current = []; flash.current = 0
  }

  function serve(dir: number) {
    const g = gRef.current, w = W.current, h = H.current
    if (!g) return
    g.puck.x = w/2; g.puck.y = h/2
    g.puck.vx = (Math.random()-0.5)*2; g.puck.vy = dir*(2+Math.random()*1.5)
    g.freeze = 0.7
  }

  // ── Step ─────────────────────────────────────────────────────────────────
  function step(dt: number) {
    const g = gRef.current; if (!g) return
    const pk = g.puck
    const live = screenRef.current === 'play' && !pausedRef.current

    if (live) {
      updateMallet(g.mB, 'B')
      if (modeRef.current === 2) updateMallet(g.mT, 'T'); else updateAI()
    }

    if (g.freeze > 0) { g.freeze -= dt; pk.vx = 0; pk.vy = 0 }
    else {
      pk.x += pk.vx*dt*60; pk.y += pk.vy*dt*60
      pk.vx *= 0.9965; pk.vy *= 0.9965
      const sp = Math.hypot(pk.vx, pk.vy)
      if (sp > 24) { pk.vx = pk.vx/sp*24; pk.vy = pk.vy/sp*24 }
    }

    collide(g.mB); collide(g.mT)

    const r = pr.current, G = geom()
    const inNet = Math.abs(pk.x - G.cx) < G.netW/2

    if (pk.x-r < G.tx) { pk.x=G.tx+r; pk.vx=Math.abs(pk.vx)*0.94; if(Math.abs(pk.vx)>3) wallSound() }
    if (pk.x+r > G.tx+G.tw) { pk.x=G.tx+G.tw-r; pk.vx=-Math.abs(pk.vx)*0.94; if(Math.abs(pk.vx)>3) wallSound() }

    if      (inNet && pk.y < G.glTop) scoreGoal('B')
    else if (inNet && pk.y > G.glBot) scoreGoal('T')
    else if (!inNet) {
      if (pk.y-r < G.ty) { pk.y=G.ty+r; pk.vy=Math.abs(pk.vy)*0.94; if(Math.abs(pk.vy)>3) wallSound() }
      if (pk.y+r > G.ty+G.th) { pk.y=G.ty+G.th-r; pk.vy=-Math.abs(pk.vy)*0.94; if(Math.abs(pk.vy)>3) wallSound() }
    }

    if (live && g.freeze <= 0) {
      g.clock += dt
      const sec = Math.floor(g.clock)
      if (sec !== lastSec.current) { lastSec.current = sec; setClock(sec) }
    }

    trail.current.push({ x: pk.x, y: pk.y })
    if (trail.current.length > 14) trail.current.shift()
    if (flash.current > 0) flash.current -= dt
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const g = gRef.current; if (!g) return
    const w = W.current, h = H.current, G = geom(), mid = h/2

    // arena
    const bg = ctx.createLinearGradient(0,0,0,h)
    bg.addColorStop(0,'#0c121b'); bg.addColorStop(1,'#06090f')
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h)

    // boards
    roundRect(ctx, G.tx-8, G.ty-8, G.tw+16, G.th+16, G.rad+8)
    ctx.fillStyle = '#e7ecf2'; ctx.fill()
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.stroke()
    roundRect(ctx, G.tx-3, G.ty-3, G.tw+6, G.th+6, G.rad+3)
    ctx.lineWidth = 4; ctx.strokeStyle = '#f0c33b'; ctx.stroke()

    // ice
    roundRect(ctx, G.tx, G.ty, G.tw, G.th, G.rad)
    const ice = ctx.createLinearGradient(0, G.ty, 0, G.ty+G.th)
    ice.addColorStop(0,'#fbfdff'); ice.addColorStop(.5,'#edf4fb'); ice.addColorStop(1,'#fbfdff')
    ctx.fillStyle = ice; ctx.fill()
    ctx.save(); ctx.clip()

    // sheen
    const sh = ctx.createRadialGradient(w*.30, h*.28, 0, w*.30, h*.28, Math.max(w,h)*.65)
    sh.addColorStop(0,'rgba(255,255,255,.55)'); sh.addColorStop(1,'rgba(255,255,255,0)')
    ctx.fillStyle = sh; ctx.fillRect(G.tx, G.ty, G.tw, G.th)

    // lines
    const by1 = G.ty+G.th*.34, by2 = G.ty+G.th*.66
    ctx.fillStyle='#1f5fd0'; ctx.fillRect(G.tx,by1-6,G.tw,12); ctx.fillRect(G.tx,by2-6,G.tw,12)
    ctx.fillStyle='#d2122c'; ctx.fillRect(G.tx,mid-4,G.tw,8)
    ctx.fillStyle='rgba(210,18,44,.9)'
    ctx.fillRect(G.tx,G.glTop-1.5,G.tw,3); ctx.fillRect(G.tx,G.glBot-1.5,G.tw,3)

    // center circle
    const S = Math.min(G.tw, G.th)
    ctx.lineWidth=3; ctx.strokeStyle='#1f5fd0'
    ctx.beginPath(); ctx.arc(G.cx,mid,S*.17,0,Math.PI*2); ctx.stroke()
    ctx.fillStyle='#1f5fd0'; ctx.beginPath(); ctx.arc(G.cx,mid,7,0,Math.PI*2); ctx.fill()

    // faceoff circles
    const fx=G.tw*.24, fr=S*.15, fyT=G.ty+G.th*.205, fyB=G.ty+G.th*.795
    for (const [px,py] of [[G.cx-fx,fyT],[G.cx+fx,fyT],[G.cx-fx,fyB],[G.cx+fx,fyB]] as [number,number][]) {
      ctx.lineWidth=3; ctx.strokeStyle='#d2122c'; ctx.beginPath(); ctx.arc(px,py,fr,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle='#d2122c'; ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill()
    }
    ctx.fillStyle='#d2122c'
    for (const [px,py] of [[G.cx-fx,by1+G.th*.05],[G.cx+fx,by1+G.th*.05],[G.cx-fx,by2-G.th*.05],[G.cx+fx,by2-G.th*.05]] as [number,number][]) {
      ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill()
    }

    // big faint scores on ice
    ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.font=`800 ${Math.round(Math.min(w,h)*.2)}px 'Saira Condensed'`
    ctx.save(); ctx.translate(G.cx,mid-G.th*.17); ctx.rotate(Math.PI)
    ctx.fillStyle='rgba(255,85,102,.16)'; ctx.fillText(String(g.scoreT),0,0); ctx.restore()
    ctx.fillStyle='rgba(20,160,150,.16)'; ctx.fillText(String(g.scoreB),G.cx,mid+G.th*.17)

    drawCrease(ctx, G.cx, G.glTop, G.netW, 'top')
    drawCrease(ctx, G.cx, G.glBot, G.netW, 'bottom')

    // puck trail
    for (let i=0; i<trail.current.length; i++) {
      const tp=trail.current[i], a=i/trail.current.length
      ctx.beginPath(); ctx.arc(tp.x,tp.y,pr.current*(0.4+0.5*a),0,Math.PI*2)
      ctx.fillStyle=`rgba(40,90,150,${a*.18})`; ctx.fill()
    }
    ctx.restore() // unclip

    drawNet(ctx, G.cx, G.glTop, G.netW, 'top')
    drawNet(ctx, G.cx, G.glBot, G.netW, 'bottom')
    drawMallet(ctx, g.mT, COL.top,    COL.topDark,    R.current)
    drawMallet(ctx, g.mB, COL.bottom, COL.bottomDark, R.current)
    drawPuck(ctx, g.puck, pr.current)

    if (flash.current > 0) {
      ctx.fillStyle = flashC.current
      ctx.globalAlpha = Math.max(0, flash.current)*.18
      ctx.fillRect(0,0,w,h); ctx.globalAlpha=1
    }
  }

  // loopFns ref: updated each render so the rAF loop always calls the latest step/draw
  const loopFns = useRef({ step, draw })
  loopFns.current = { step, draw }

  // ── Game loop & event setup ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const w = canvas.clientWidth, h = canvas.clientHeight
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      W.current = w; H.current = h
      R.current  = Math.max(28, Math.min(w, h) * 0.062)
      pr.current = R.current * 0.66
    }

    resize()
    buildGame()
    lastT.current = performance.now()

    function loop() {
      const now = performance.now()
      let dt = (now - lastT.current) / 1000
      lastT.current = now
      if (dt > 0.05) dt = 0.05
      if (gRef.current) { loopFns.current.step(dt); loopFns.current.draw() }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    function onDown(e: PointerEvent) {
      e.preventDefault()
      if (screenRef.current !== 'play' || pausedRef.current) return
      const rect = canvas.getBoundingClientRect()
      const p = { x: e.clientX-rect.left, y: e.clientY-rect.top }
      const side: 'T'|'B' = modeRef.current === 2 ? (p.y < H.current/2 ? 'T' : 'B') : 'B'
      pointers.current.set(e.pointerId, side)
      const m = side==='T' ? gRef.current?.mT : gRef.current?.mB
      if (m) { m.tx=p.x; m.ty=p.y; m.hasTarget=true }
      try { canvas.setPointerCapture(e.pointerId) } catch {}
    }

    function onMove(e: PointerEvent) {
      if (!pointers.current.has(e.pointerId)) return
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const p = { x: e.clientX-rect.left, y: e.clientY-rect.top }
      const side = pointers.current.get(e.pointerId)!
      const m = side==='T' ? gRef.current?.mT : gRef.current?.mB
      if (m) { m.tx=p.x; m.ty=p.y; m.hasTarget=true }
    }

    function onUp(e: PointerEvent) { pointers.current.delete(e.pointerId) }

    canvas.addEventListener('pointerdown', onDown, { passive: false })
    canvas.addEventListener('pointermove', onMove, { passive: false })
    canvas.addEventListener('pointerup',     onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave',  onUp)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (goalTO.current) clearTimeout(goalTO.current)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onUp)
      window.removeEventListener('resize', onResize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Game actions (called from JSX buttons) ────────────────────────────────
  const begin = useCallback((m: 1|2) => {
    initAudio()
    buildGame()
    pointers.current.clear()
    modeRef.current = m; pausedRef.current = false; screenRef.current = 'play'
    setMode(m); setPaused(false); setScoreT(0); setScoreB(0); setClock(0); setGoalInfo(null)
    setGameScreen('play')
    serve(Math.random() < 0.5 ? 1 : -1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rematch = useCallback(() => begin(modeRef.current), [begin])

  const toMenu = useCallback(() => {
    pointers.current.clear(); setGoalInfo(null)
    screenRef.current = 'menu'; pausedRef.current = false
    setGameScreen('menu'); setPaused(false)
  }, [])

  const togglePause = useCallback(() => {
    const next = !pausedRef.current; pausedRef.current = next; setPaused(next)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current; mutedRef.current = next; setMuted(next)
    if (!next) initAudio()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function fmtClock(sec: number) {
    const m = Math.floor(sec/60), s = sec%60
    return `${m}:${s<10?'0':''}${s}`
  }

  const inGame = gameScreen === 'play'

  // ── Shared button styles ──────────────────────────────────────────────────
  const tealBtn: React.CSSProperties = { cursor:'pointer', border:'none', padding:'16px 34px', borderRadius:12, background:'linear-gradient(160deg,#16d6c8,#0a8f87)', fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:22, color:'#04201e', letterSpacing:'.04em' }
  const outlineBtn: React.CSSProperties = { cursor:'pointer', border:'1px solid rgba(255,255,255,.2)', padding:'16px 34px', borderRadius:12, background:'rgba(20,28,40,.7)', fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:22, color:'#cdd6e2', letterSpacing:'.04em' }
  const ghostBtn: React.CSSProperties = { cursor:'pointer', border:'1px solid rgba(255,255,255,.14)', padding:'11px 26px', borderRadius:10, background:'rgba(20,28,40,.5)', fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:600, fontSize:15, color:'#7c899a' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'#05070c', fontFamily:"'Barlow Semi Condensed',sans-serif", userSelect:'none', WebkitUserSelect:'none', overflow:'hidden' }}>

      {/* GAME CANVAS */}
      <canvas
        ref={canvasRef}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', touchAction:'none', display:'block' }}
      />

      {/* ── IN-GAME HUD ── */}
      {inGame && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5 }}>

          {/* Scoreboard pill */}
          <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'stretch', height:50, borderRadius:9, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)', background:'#0e131c', fontFamily:"'Saira Condensed',sans-serif" }}>
            <div style={{ width:7, background:'#16d6c8' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 13px', background:'linear-gradient(180deg,#1a2130,#0d121b)' }}>
              <div style={{ width:27, height:27, borderRadius:5, background:'#0a8f87', display:'flex', alignItems:'center', justifyContent:'center', color:'#eafffb', fontWeight:800, fontSize:12 }}>SJ</div>
              <span style={{ color:'#cdd6e2', fontWeight:700, fontSize:18, letterSpacing:'.04em' }}>SHARKS</span>
              <span style={{ color:'#fff', fontWeight:800, fontSize:28, lineHeight:1, marginLeft:3, minWidth:20, textAlign:'center' }}>{scoreB}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 14px', background:'#070a10', minWidth:78 }}>
              <span style={{ color:'#f2c84b', fontWeight:700, fontSize:19, lineHeight:1, letterSpacing:'.03em' }}>{fmtClock(clock)}</span>
              <span style={{ color:'#7f8a99', fontWeight:600, fontSize:10, letterSpacing:'.14em' }}>FIRST TO {WIN}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 13px', background:'linear-gradient(180deg,#1a2130,#0d121b)' }}>
              <span style={{ color:'#fff', fontWeight:800, fontSize:28, lineHeight:1, marginRight:3, minWidth:20, textAlign:'center' }}>{scoreT}</span>
              <span style={{ color:'#cdd6e2', fontWeight:700, fontSize:18, letterSpacing:'.04em' }}>RANGERS</span>
              <div style={{ width:27, height:27, borderRadius:5, background:'#1b4ea8', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>NY</div>
            </div>
            <div style={{ width:7, background:'#ff5566' }} />
          </div>

          {/* Sound toggle */}
          <button onClick={toggleMute} style={{ pointerEvents:'auto', position:'absolute', top:16, left:16, width:42, height:42, borderRadius:'50%', border:'1px solid rgba(255,255,255,.18)', background:'rgba(12,18,28,.7)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#cdd6e2', fontWeight:700, fontSize:11, fontFamily:"'Barlow Semi Condensed',sans-serif", letterSpacing:'.04em' }}>
            {muted ? 'MUTE' : 'SND'}
          </button>

          {/* Pause */}
          <button onClick={togglePause} style={{ pointerEvents:'auto', position:'absolute', top:16, right:16, width:42, height:42, borderRadius:'50%', border:'1px solid rgba(255,255,255,.18)', background:'rgba(12,18,28,.7)', display:'flex', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer' }}>
            <span style={{ display:'block', width:4, height:14, borderRadius:1, background:'#cdd6e2' }} />
            <span style={{ display:'block', width:4, height:14, borderRadius:1, background:'#cdd6e2' }} />
          </button>
        </div>
      )}

      {/* ── GOAL BANNER ── */}
      {goalInfo && (
        <div style={{ position:'absolute', top:'46%', left:'50%', transform:'translate(-50%,-50%)', zIndex:8, pointerEvents:'none', textAlign:'center', animation:'goalpop 1.5s ease-out forwards', fontFamily:"'Saira Condensed',sans-serif" }}>
          <div style={{ fontWeight:800, fontSize:108, lineHeight:.9, letterSpacing:'.02em', color:goalInfo.color, textShadow:`0 6px 40px rgba(0,0,0,.55), 0 0 30px ${goalInfo.color}` }}>GOAL!</div>
          <div style={{ fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:700, letterSpacing:'.34em', fontSize:18, color:'#fff', marginTop:4, paddingLeft:'.34em', animation:'hornpulse .4s ease-in-out infinite' }}>{goalInfo.team}</div>
        </div>
      )}

      {/* ── MENU ── */}
      {gameScreen === 'menu' && (
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0, background:'radial-gradient(120% 100% at 50% 0%, rgba(10,16,26,.55), rgba(5,7,12,.86))' }}>
          <div style={{ fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:700, letterSpacing:'.42em', textTransform:'uppercase', fontSize:14, color:'#6cf0e6', marginBottom:6, paddingLeft:'.42em' }}>Table Hockey</div>
          <div style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:84, lineHeight:.92, color:'#f3f7fb', letterSpacing:'.01em', textShadow:'0 4px 30px rgba(60,200,210,.25)' }}>AIR&nbsp;HOCKEY</div>
          <div style={{ display:'flex', gap:18, marginTop:40 }}>
            <button onClick={() => begin(1)} style={{ cursor:'pointer', border:'none', width:230, padding:'22px 0', borderRadius:16, background:'linear-gradient(160deg,#16d6c8,#0a8f87)', boxShadow:'0 12px 30px rgba(18,190,180,.32), inset 0 1px 0 rgba(255,255,255,.25)', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:30, color:'#04201e', letterSpacing:'.02em' }}>1 PLAYER</span>
              <span style={{ fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:600, fontSize:14, letterSpacing:'.16em', color:'rgba(4,32,30,.62)' }}>VS COMPUTER</span>
            </button>
            <button onClick={() => begin(2)} style={{ cursor:'pointer', border:'none', width:230, padding:'22px 0', borderRadius:16, background:'linear-gradient(160deg,#ff6b7e,#d6253b)', boxShadow:'0 12px 30px rgba(214,37,59,.32), inset 0 1px 0 rgba(255,255,255,.25)', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:30, color:'#fff', letterSpacing:'.02em' }}>2 PLAYERS</span>
              <span style={{ fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:600, fontSize:14, letterSpacing:'.16em', color:'rgba(255,255,255,.72)' }}>PASS &amp; PLAY</span>
            </button>
          </div>
          <div style={{ marginTop:30, fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:500, fontSize:15, letterSpacing:'.05em', color:'#7c899a', textAlign:'center' }}>
            Sit on opposite sides — each player drags their mallet.<br />First to <b style={{ color:'#cdd6e2' }}>{WIN} goals</b> wins.
          </div>
          <button onClick={onGoHome} style={{ ...ghostBtn, marginTop:36 }}>← Back to Home</button>
        </div>
      )}

      {/* ── PAUSE ── */}
      {paused && gameScreen === 'play' && (
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:22, background:'rgba(5,7,12,.74)', backdropFilter:'blur(3px)' }}>
          <div style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:54, color:'#f3f7fb', letterSpacing:'.04em' }}>PAUSED</div>
          <div style={{ display:'flex', gap:14 }}>
            <button onClick={togglePause} style={tealBtn}>RESUME</button>
            <button onClick={toMenu}      style={outlineBtn}>QUIT</button>
          </div>
          <button onClick={onGoHome} style={ghostBtn}>← Home</button>
        </div>
      )}

      {/* ── WIN ── */}
      {gameScreen === 'win' && (
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'radial-gradient(120% 100% at 50% 40%, rgba(10,16,26,.5), rgba(5,7,12,.9))' }}>
          <div style={{ fontFamily:"'Barlow Semi Condensed',sans-serif", fontWeight:700, letterSpacing:'.4em', textTransform:'uppercase', fontSize:14, color:'#7c899a', paddingLeft:'.4em' }}>Game Over</div>
          <div style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:76, lineHeight:1, letterSpacing:'.02em', color:winnerColor, textShadow:'0 4px 30px rgba(0,0,0,.4)' }}>{winnerLabel}</div>
          <div style={{ fontFamily:"'Saira Condensed',sans-serif", fontWeight:800, fontSize:40, color:'#cdd6e2', letterSpacing:'.06em', marginTop:4 }}>{finalScore}</div>
          <div style={{ display:'flex', gap:14, marginTop:30 }}>
            <button onClick={rematch} style={{ ...tealBtn, padding:'18px 38px', borderRadius:13, fontSize:24 }}>REMATCH</button>
            <button onClick={toMenu}  style={{ ...outlineBtn, padding:'18px 38px', borderRadius:13, fontSize:24 }}>MENU</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes goalpop {
          0%   { transform: translate(-50%,-50%) scale(.4); opacity: 0; }
          18%  { transform: translate(-50%,-50%) scale(1.12); opacity: 1; }
          80%  { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
        @keyframes hornpulse { 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
      `}</style>
    </div>
  )
}
