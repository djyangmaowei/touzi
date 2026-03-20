const FACE_VALUES = {
  px: 1,
  nx: 6,
  py: 2,
  ny: 5,
  pz: 3,
  nz: 4
}

const FACE_DEFINITIONS = [
  {
    key: 'px',
    normal: { x: 1, y: 0, z: 0 },
    corners: [
      { x: 0.5, y: 0.5, z: -0.5 },
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: 0.5, y: -0.5, z: 0.5 },
      { x: 0.5, y: -0.5, z: -0.5 }
    ]
  },
  {
    key: 'nx',
    normal: { x: -1, y: 0, z: 0 },
    corners: [
      { x: -0.5, y: 0.5, z: 0.5 },
      { x: -0.5, y: 0.5, z: -0.5 },
      { x: -0.5, y: -0.5, z: -0.5 },
      { x: -0.5, y: -0.5, z: 0.5 }
    ]
  },
  {
    key: 'py',
    normal: { x: 0, y: 1, z: 0 },
    corners: [
      { x: -0.5, y: 0.5, z: -0.5 },
      { x: 0.5, y: 0.5, z: -0.5 },
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: -0.5, y: 0.5, z: 0.5 }
    ]
  },
  {
    key: 'ny',
    normal: { x: 0, y: -1, z: 0 },
    corners: [
      { x: -0.5, y: -0.5, z: 0.5 },
      { x: 0.5, y: -0.5, z: 0.5 },
      { x: 0.5, y: -0.5, z: -0.5 },
      { x: -0.5, y: -0.5, z: -0.5 }
    ]
  },
  {
    key: 'pz',
    normal: { x: 0, y: 0, z: 1 },
    corners: [
      { x: -0.5, y: 0.5, z: 0.5 },
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: 0.5, y: -0.5, z: 0.5 },
      { x: -0.5, y: -0.5, z: 0.5 }
    ]
  },
  {
    key: 'nz',
    normal: { x: 0, y: 0, z: -1 },
    corners: [
      { x: 0.5, y: 0.5, z: -0.5 },
      { x: -0.5, y: 0.5, z: -0.5 },
      { x: -0.5, y: -0.5, z: -0.5 },
      { x: 0.5, y: -0.5, z: -0.5 }
    ]
  }
]

const LIGHTS = [
  { x: 0.6, y: 0.9, z: 1, intensity: 0.78 },
  { x: -0.9, y: 0.35, z: 0.6, intensity: 0.18 },
  { x: 0.15, y: 0.8, z: -1, intensity: 0.14 }
]

Page({
  data: {
    diceCount: 5,
    isRolling: false,
    showSettings: false,
    soundEnabled: true,
    keepAwake: false
  },

  canvas: null,
  ctx: null,
  canvasWidth: 0,
  canvasHeight: 0,
  dices: [],
  diceTextures: {},
  backgroundTexture: null,
  backgroundPatternSeed: [],

  audioContext: null,
  animationTimer: null,
  rollStartTime: 0,
  rollDuration: 1500,
  animationId: null,

  onLoad() {
    this.initAudio()
  },

  onReady() {
    this.initCanvas()
  },

  onUnload() {
    this.stopRolling()
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  onHide() {
    this.stopRolling()
    if (this.audioContext) {
      this.audioContext.stop()
    }
  },

  initAudio() {
    if (this.audioContext) {
      this.audioContext.destroy()
    }
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = '/assets/dice-roll.mp3'
    this.audioContext.loop = true
    this.audioContext.volume = 0.6
  },

  initCanvas() {
    const query = wx.createSelectorQuery().in(this)
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        this.canvas = res[0].node
        this.ctx = this.canvas.getContext('2d')
        this.canvasWidth = res[0].width
        this.canvasHeight = res[0].height

        const dpr = wx.getSystemInfoSync().pixelRatio
        this.canvas.width = this.canvasWidth * dpr
        this.canvas.height = this.canvasHeight * dpr
        this.ctx.scale(dpr, dpr)

        this.generateDiceTextures()
        this.generateBackgroundTexture()
        this.initDices()
        this.draw()
      })
  },

  generateBackgroundTexture() {
    if (this.canvas && typeof this.canvas.createImage === 'function') {
      const image = this.canvas.createImage()
      image.onload = () => {
        this.backgroundTexture = image
        this.draw()
      }
      image.onerror = () => {
        this.generateProceduralBackgroundTexture()
        this.draw()
      }
      image.src = '/assets/felt-texture.png'
      return
    }

    this.generateProceduralBackgroundTexture()
  },

  generateProceduralBackgroundTexture() {
    const size = 320

    try {
      const c = wx.createOffscreenCanvas({ type: '2d', width: size, height: size })
      const ctx = c.getContext('2d')

      const base = ctx.createLinearGradient(0, 0, size, size)
      base.addColorStop(0, '#1d4c31')
      base.addColorStop(0.5, '#12331f')
      base.addColorStop(1, '#081408')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, size, size)

      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * size
        const y = Math.random() * size
        const alpha = 0.012 + Math.random() * 0.024
        const radius = 0.6 + Math.random() * 1.8
        ctx.beginPath()
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < 220; i++) {
        const x = Math.random() * size
        const y = Math.random() * size
        const length = 4 + Math.random() * 8
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.random() * Math.PI)
        ctx.fillStyle = `rgba(0,0,0,${0.018 + Math.random() * 0.02})`
        ctx.fillRect(-length / 2, -0.5, length, 1)
        ctx.restore()
      }

      const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.7)
      vignette.addColorStop(0, 'rgba(255,255,255,0.05)')
      vignette.addColorStop(0.6, 'rgba(255,255,255,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, size, size)

      this.backgroundTexture = c
    } catch (e) {
      this.backgroundPatternSeed = Array.from({ length: 180 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.8 + Math.random() * 1.6,
        a: 0.012 + Math.random() * 0.02
      }))
    }
  },

  generateDiceTextures() {
    const size = 256

    try {
      for (let value = 1; value <= 6; value++) {
        const c = wx.createOffscreenCanvas({ type: '2d', width: size, height: size })
        const ctx = c.getContext('2d')

        const base = ctx.createLinearGradient(0, 0, size, size)
        base.addColorStop(0, '#fdf9ee')
        base.addColorStop(0.55, '#f1ecd8')
        base.addColorStop(1, '#d5cfb5')
        ctx.fillStyle = base
        ctx.fillRect(0, 0, size, size)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
        ctx.fillRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84)

        for (let i = 0; i < 700; i++) {
          const x = Math.random() * size
          const y = Math.random() * size
          const alpha = 0.01 + Math.random() * 0.04
          ctx.fillStyle = Math.random() > 0.55 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
          ctx.fillRect(x, y, 2, 2)
        }

        const innerGlow = ctx.createRadialGradient(size * 0.32, size * 0.26, size * 0.06, size * 0.5, size * 0.5, size * 0.82)
        innerGlow.addColorStop(0, 'rgba(255,255,255,0.32)')
        innerGlow.addColorStop(0.45, 'rgba(255,255,255,0.08)')
        innerGlow.addColorStop(1, 'rgba(0,0,0,0.12)')
        ctx.fillStyle = innerGlow
        ctx.fillRect(0, 0, size, size)

        this.drawBevelFrame(ctx, size)
        this.drawPips(ctx, value, size)

        this.diceTextures[value] = c
      }
    } catch (e) {
      console.log('OffscreenCanvas 失败，使用简化骰子纹理')
    }
  },

  drawBevelFrame(ctx, size) {
    ctx.save()

    const border = size * 0.045
    const highlight = ctx.createLinearGradient(0, 0, size, size)
    highlight.addColorStop(0, 'rgba(255,255,255,0.38)')
    highlight.addColorStop(0.35, 'rgba(255,255,255,0.08)')
    highlight.addColorStop(1, 'rgba(0,0,0,0.12)')
    ctx.strokeStyle = highlight
    ctx.lineWidth = border
    ctx.strokeRect(border, border, size - border * 2, size - border * 2)

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.lineWidth = size * 0.012
    ctx.strokeRect(border * 1.3, border * 1.3, size - border * 2.6, size - border * 2.6)

    ctx.restore()
  },

  drawPips(ctx, value, size) {
    const positions = this.getDotPositions(value, size)
    const dotRadius = value === 1 ? size * 0.108 : size * 0.074
    const dotColor = value === 1 ? '#c42038' : '#141414'

    positions.forEach((pos) => {
      const shadow = ctx.createRadialGradient(
        pos.x + dotRadius * 0.15,
        pos.y + dotRadius * 0.2,
        dotRadius * 0.15,
        pos.x + dotRadius * 0.25,
        pos.y + dotRadius * 0.35,
        dotRadius * 1.25
      )
      shadow.addColorStop(0, 'rgba(0,0,0,0.18)')
      shadow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.arc(pos.x + dotRadius * 0.18, pos.y + dotRadius * 0.26, dotRadius * 1.15, 0, Math.PI * 2)
      ctx.fill()

      const pip = ctx.createRadialGradient(
        pos.x - dotRadius * 0.3,
        pos.y - dotRadius * 0.35,
        dotRadius * 0.15,
        pos.x,
        pos.y,
        dotRadius
      )
      if (value === 1) {
        pip.addColorStop(0, '#f06b7e')
        pip.addColorStop(0.38, '#d53a50')
        pip.addColorStop(1, '#8e1023')
      } else {
        pip.addColorStop(0, '#666666')
        pip.addColorStop(0.3, '#1e1e1e')
        pip.addColorStop(1, '#050505')
      }

      ctx.fillStyle = pip
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.arc(pos.x - dotRadius * 0.3, pos.y - dotRadius * 0.35, dotRadius * 0.28, 0, Math.PI * 2)
      ctx.fill()
    })
  },

  getDotPositions(value, size) {
    const mid = size * 0.5
    const offset = size * 0.25

    const positions = {
      1: [{ x: mid, y: mid }],
      2: [{ x: mid - offset, y: mid - offset }, { x: mid + offset, y: mid + offset }],
      3: [{ x: mid - offset, y: mid - offset }, { x: mid, y: mid }, { x: mid + offset, y: mid + offset }],
      4: [{ x: mid - offset, y: mid - offset }, { x: mid + offset, y: mid - offset }, { x: mid - offset, y: mid + offset }, { x: mid + offset, y: mid + offset }],
      5: [{ x: mid - offset, y: mid - offset }, { x: mid + offset, y: mid - offset }, { x: mid, y: mid }, { x: mid - offset, y: mid + offset }, { x: mid + offset, y: mid + offset }],
      6: [{ x: mid - offset, y: mid - offset * 1.2 }, { x: mid + offset, y: mid - offset * 1.2 }, { x: mid - offset, y: mid }, { x: mid + offset, y: mid }, { x: mid - offset, y: mid + offset * 1.2 }, { x: mid + offset, y: mid + offset * 1.2 }]
    }

    return positions[value]
  },

  initDices() {
    this.dices = []
    const positions = this.generateNonOverlappingPositions(this.data.diceCount)

    positions.forEach((pos, index) => {
      const value = Math.floor(Math.random() * 6) + 1
      const rotation = this.getRotationForValue(value)
      const jitterX = (Math.random() - 0.5) * 10
      const jitterY = (Math.random() - 0.5) * 10
      const jitterZ = (Math.random() - 0.5) * 18

      this.dices.push({
        id: index,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        size: 60,
        value,
        rotX: rotation.x + jitterX,
        rotY: rotation.y + jitterY,
        rotZ: rotation.z + jitterZ,
        targetX: pos.x,
        targetY: pos.y,
        targetZ: pos.z,
        targetValue: value,
        startX: pos.x,
        startY: pos.y,
        startZ: pos.z,
        startRotX: rotation.x,
        startRotY: rotation.y,
        startRotZ: rotation.z,
        bounce: 0
      })
    })
  },

  getRotationForValue(value) {
    const rotations = {
      1: { x: 0, y: 0, z: 0 },
      6: { x: 180, y: 0, z: 0 },
      2: { x: -90, y: 0, z: 0 },
      5: { x: 90, y: 0, z: 0 },
      3: { x: 0, y: -90, z: 0 },
      4: { x: 0, y: 90, z: 0 }
    }

    return rotations[value] || rotations[1]
  },

  generateNonOverlappingPositions(count) {
    const width = this.canvasWidth || 375
    const height = this.canvasHeight || 667
    const centerX = width / 2
    const centerY = height / 2 - 56
    const spreadX = Math.min(width * 0.68, 300)
    const spreadY = Math.min(height * 0.42, 220)
    const minDistance = count > 7 ? 68 : 76
    const positions = []

    for (let i = 0; i < count; i++) {
      let x = centerX
      let y = centerY
      let z = 0
      let attempts = 0

      do {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.sqrt(Math.random()) * 0.96
        x = centerX + Math.cos(angle) * spreadX * 0.5 * radius
        y = centerY + Math.sin(angle) * spreadY * 0.5 * radius
        z = (Math.random() - 0.5) * 2.2

        let tooClose = false
        for (const pos of positions) {
          const dx = x - pos.x
          const dy = y - pos.y
          const dz = (z - pos.z) * 18
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < minDistance) {
            tooClose = true
            break
          }
        }

        if (!tooClose || attempts >= 160) break
        attempts++
      } while (true)

      positions.push({ x, y, z })
    }

    return positions
  },

  draw() {
    if (!this.ctx) return

    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight

    ctx.clearRect(0, 0, w, h)
    this.drawBackground(ctx, w, h)

    const sortedDices = [...this.dices].sort((a, b) => (a.y + a.z * 16) - (b.y + b.z * 16))
    sortedDices.forEach((dice) => this.drawDice3D(ctx, dice))
  },

  drawBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#143521')
    gradient.addColorStop(0.2, '#184229')
    gradient.addColorStop(0.6, '#0f311e')
    gradient.addColorStop(1, '#082012')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    if (this.backgroundTexture) {
      ctx.save()
      ctx.globalAlpha = 0.42
      this.drawCoverImage(ctx, this.backgroundTexture, w, h)
      ctx.restore()
    } else if (this.backgroundPatternSeed.length) {
      this.backgroundPatternSeed.forEach((point) => {
        ctx.fillStyle = `rgba(255,255,255,${point.a})`
        ctx.beginPath()
        ctx.arc(point.x * w, point.y * h, point.r, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const feltTint = ctx.createLinearGradient(0, 0, 0, h)
    feltTint.addColorStop(0, 'rgba(18, 52, 30, 0.32)')
    feltTint.addColorStop(0.45, 'rgba(10, 42, 22, 0.2)')
    feltTint.addColorStop(1, 'rgba(4, 22, 12, 0.3)')
    ctx.fillStyle = feltTint
    ctx.fillRect(0, 0, w, h)

    const topLight = ctx.createLinearGradient(0, 0, 0, h * 0.26)
    topLight.addColorStop(0, 'rgba(255, 220, 160, 0.16)')
    topLight.addColorStop(0.45, 'rgba(255, 220, 160, 0.05)')
    topLight.addColorStop(1, 'rgba(255, 220, 160, 0)')
    ctx.fillStyle = topLight
    ctx.fillRect(0, 0, w, h)

    const leftLamp = ctx.createRadialGradient(w * 0.22, h * 0.02, 0, w * 0.22, h * 0.02, Math.min(w, h) * 0.12)
    leftLamp.addColorStop(0, 'rgba(255, 230, 170, 0.22)')
    leftLamp.addColorStop(0.32, 'rgba(255, 220, 150, 0.11)')
    leftLamp.addColorStop(1, 'rgba(255, 220, 150, 0)')
    ctx.fillStyle = leftLamp
    ctx.fillRect(0, 0, w, h)

    const centerLamp = ctx.createRadialGradient(w * 0.5, h * 0.01, 0, w * 0.5, h * 0.01, Math.min(w, h) * 0.13)
    centerLamp.addColorStop(0, 'rgba(255, 228, 165, 0.18)')
    centerLamp.addColorStop(0.36, 'rgba(255, 218, 145, 0.09)')
    centerLamp.addColorStop(1, 'rgba(255, 218, 145, 0)')
    ctx.fillStyle = centerLamp
    ctx.fillRect(0, 0, w, h)

    const rightLamp = ctx.createRadialGradient(w * 0.78, h * 0.02, 0, w * 0.78, h * 0.02, Math.min(w, h) * 0.12)
    rightLamp.addColorStop(0, 'rgba(255, 230, 170, 0.22)')
    rightLamp.addColorStop(0.32, 'rgba(255, 220, 150, 0.11)')
    rightLamp.addColorStop(1, 'rgba(255, 220, 150, 0)')
    ctx.fillStyle = rightLamp
    ctx.fillRect(0, 0, w, h)

    const edgeShade = ctx.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.28, w * 0.5, h * 0.5, Math.max(w, h) * 0.82)
    edgeShade.addColorStop(0, 'rgba(0,0,0,0)')
    edgeShade.addColorStop(0.72, 'rgba(0,0,0,0.06)')
    edgeShade.addColorStop(1, 'rgba(0,0,0,0.22)')
    ctx.fillStyle = edgeShade
    ctx.fillRect(0, 0, w, h)
  },

  drawCoverImage(ctx, image, w, h) {
    const sourceWidth = image.width || image.naturalWidth || 1
    const sourceHeight = image.height || image.naturalHeight || 1
    const sourceRatio = sourceWidth / sourceHeight
    const targetRatio = w / h

    let sx = 0
    let sy = 0
    let sw = sourceWidth
    let sh = sourceHeight

    if (sourceRatio > targetRatio) {
      sw = sourceHeight * targetRatio
      sx = (sourceWidth - sw) / 2
    } else {
      sh = sourceWidth / targetRatio
      sy = (sourceHeight - sh) / 2
    }

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h)
  },

  drawDice3D(ctx, dice) {
    const half = dice.size / 2
    const bounceOffset = dice.bounce
    const center = {
      x: dice.x,
      y: dice.y - bounceOffset,
      z: dice.z
    }

    const shadowScale = 1 + dice.z * 0.08
    const shadowAlpha = Math.max(0.14, 0.3 - bounceOffset / 180)
    ctx.save()
    ctx.translate(center.x + 6 + dice.z * 4, center.y + half + 12 + bounceOffset * 0.22)
    ctx.scale(Math.max(0.7, shadowScale), Math.max(0.45, shadowScale * 0.48))
    ctx.beginPath()
    ctx.ellipse(0, 0, half * 0.92, half * 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`
    ctx.fill()
    ctx.restore()

    const faces = this.getVisibleFaces(dice, center)
    faces.forEach((face) => this.renderFace(ctx, face))
  },

  getVisibleFaces(dice, center) {
    const rotX = dice.rotX * Math.PI / 180
    const rotY = dice.rotY * Math.PI / 180
    const rotZ = dice.rotZ * Math.PI / 180
    const size = dice.size * (1 + dice.z * 0.045)

    const visibleFaces = []

    FACE_DEFINITIONS.forEach((face) => {
      const normal = this.rotateVector(face.normal, rotX, rotY, rotZ)
      if (normal.z <= 0.08) return

      const corners = face.corners.map((corner) => {
        const rotated = this.rotateVector(corner, rotX, rotY, rotZ)
        return {
          x: center.x + rotated.x * size,
          y: center.y - rotated.y * size,
          z: center.z + rotated.z
        }
      })

      visibleFaces.push({
        key: face.key,
        value: FACE_VALUES[face.key],
        corners,
        normal,
        depth: corners.reduce((sum, point) => sum + point.z, 0) / corners.length
      })
    })

    return visibleFaces.sort((a, b) => a.depth - b.depth)
  },

  renderFace(ctx, face) {
    const texture = this.diceTextures[face.value]
    const [p0, p1, p2, p3] = face.corners
    const brightness = this.getFaceBrightness(face.normal)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.closePath()

    const baseGradient = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y)
    baseGradient.addColorStop(0, this.tintColor('#fffaf0', brightness + 0.08))
    baseGradient.addColorStop(1, this.tintColor('#d1cab2', brightness - 0.12))
    ctx.fillStyle = baseGradient
    ctx.fill()

    if (texture) {
      ctx.save()
      ctx.clip()
      const textureSize = 256
      ctx.transform(
        (p1.x - p0.x) / textureSize,
        (p1.y - p0.y) / textureSize,
        (p3.x - p0.x) / textureSize,
        (p3.y - p0.y) / textureSize,
        p0.x,
        p0.y
      )
      ctx.globalAlpha = 0.92
      ctx.drawImage(texture, 0, 0, textureSize, textureSize)
      ctx.restore()
    }

    const lightOverlay = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y)
    lightOverlay.addColorStop(0, `rgba(255,255,255,${0.18 + brightness * 0.08})`)
    lightOverlay.addColorStop(0.5, 'rgba(255,255,255,0.02)')
    lightOverlay.addColorStop(1, `rgba(0,0,0,${0.18 - brightness * 0.06})`)
    ctx.fillStyle = lightOverlay
    ctx.fill()

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 + brightness * 0.06})`
    ctx.lineWidth = 1.2
    ctx.stroke()

    ctx.restore()
  },

  getFaceBrightness(normal) {
    let brightness = 0.36
    LIGHTS.forEach((light) => {
      const l = this.normalizeVector(light)
      brightness += Math.max(0, normal.x * l.x + normal.y * l.y + normal.z * l.z) * light.intensity
    })

    return Math.max(0.28, Math.min(brightness, 1.05))
  },

  rotateVector(point, rotX, rotY, rotZ) {
    let { x, y, z } = point

    const cosX = Math.cos(rotX)
    const sinX = Math.sin(rotX)
    let y1 = y * cosX - z * sinX
    let z1 = y * sinX + z * cosX
    y = y1
    z = z1

    const cosY = Math.cos(rotY)
    const sinY = Math.sin(rotY)
    let x1 = x * cosY + z * sinY
    z1 = -x * sinY + z * cosY
    x = x1
    z = z1

    const cosZ = Math.cos(rotZ)
    const sinZ = Math.sin(rotZ)
    x1 = x * cosZ - y * sinZ
    y1 = x * sinZ + y * cosZ

    return { x: x1, y: y1, z }
  },

  normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z) || 1
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length
    }
  },

  tintColor(hex, factor) {
    const normalized = hex.replace('#', '')
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)

    const scale = Math.max(0.55, Math.min(1.28, factor))
    const rr = Math.max(0, Math.min(255, Math.round(r * scale)))
    const gg = Math.max(0, Math.min(255, Math.round(g * scale)))
    const bb = Math.max(0, Math.min(255, Math.round(b * scale)))

    return `rgb(${rr}, ${gg}, ${bb})`
  },

  onRollTap() {
    if (this.data.isRolling) return

    this.setData({ isRolling: true })

    if (this.data.soundEnabled && this.audioContext) {
      this.audioContext.stop()
      this.audioContext.play()
    }

    wx.vibrateShort({
      type: 'heavy',
      fail() {}
    })
    this.prepareRoll()
    this.rollStartTime = Date.now()
    this.animate()

    this.animationTimer = setTimeout(() => {
      this.stopRolling()
    }, this.rollDuration)
  },

  prepareRoll() {
    const positions = this.generateNonOverlappingPositions(this.dices.length)

    this.dices.forEach((dice, index) => {
      const targetValue = Math.floor(Math.random() * 6) + 1
      const landingRotation = this.getRotationForValue(targetValue)
      const extraRotations = 2 + Math.floor(Math.random() * 2)
      const extraDegrees = extraRotations * 360

      dice.startX = dice.x
      dice.startY = dice.y
      dice.startZ = dice.z
      dice.startRotX = dice.rotX
      dice.startRotY = dice.rotY
      dice.startRotZ = dice.rotZ

      dice.targetX = positions[index].x
      dice.targetY = positions[index].y
      dice.targetZ = positions[index].z
      dice.targetValue = targetValue
      dice.targetRotX = landingRotation.x + extraDegrees * (Math.random() > 0.5 ? 1 : -1)
      dice.targetRotY = landingRotation.y + extraDegrees * (Math.random() > 0.5 ? 1 : -1)
      dice.targetRotZ = landingRotation.z + (Math.random() - 0.5) * 24
    })
  },

  animate() {
    if (!this.data.isRolling) return

    const now = Date.now()
    const elapsed = now - this.rollStartTime
    const progress = Math.min(elapsed / this.rollDuration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)

    this.dices.forEach((dice) => {
      dice.x = dice.startX + (dice.targetX - dice.startX) * easeProgress
      dice.y = dice.startY + (dice.targetY - dice.startY) * easeProgress
      dice.z = dice.startZ + (dice.targetZ - dice.startZ) * easeProgress

      dice.rotX = dice.startRotX + (dice.targetRotX - dice.startRotX) * easeProgress
      dice.rotY = dice.startRotY + (dice.targetRotY - dice.startRotY) * easeProgress
      dice.rotZ = dice.startRotZ + (dice.targetRotZ - dice.startRotZ) * easeProgress

      if (progress < 0.78) {
        const upProgress = progress / 0.78
        dice.bounce = Math.sin(upProgress * Math.PI) * 46
      } else if (progress < 0.92) {
        const settleProgress = (progress - 0.78) / 0.14
        dice.bounce = Math.sin((1 - settleProgress) * Math.PI) * 8
      } else {
        dice.bounce = 0
      }

      if (progress > 0.72) {
        dice.value = dice.targetValue
      }
    })

    this.draw()

    if (progress < 1) {
      this.animationId = setTimeout(() => this.animate(), 16)
    }
  },

  stopRolling() {
    if (this.animationId) {
      clearTimeout(this.animationId)
      this.animationId = null
    }

    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
      this.animationTimer = null
    }

    if (this.audioContext) {
      this.audioContext.stop()
    }

    this.dices.forEach((dice) => {
      dice.x = dice.targetX
      dice.y = dice.targetY
      dice.z = dice.targetZ
      dice.rotX = dice.targetRotX
      dice.rotY = dice.targetRotY
      dice.rotZ = dice.targetRotZ
      dice.value = dice.targetValue
      dice.bounce = 0
    })

    this.resolveOverlaps()
    this.draw()
    this.setData({ isRolling: false })
    console.log('摇骰子结果:', this.dices.map((d) => d.value))
  },

  resolveOverlaps() {
    const minDistance = this.dices.length > 7 ? 66 : 74

    for (let iteration = 0; iteration < 12; iteration++) {
      let hasOverlap = false

      for (let i = 0; i < this.dices.length; i++) {
        for (let j = i + 1; j < this.dices.length; j++) {
          const d1 = this.dices[i]
          const d2 = this.dices[j]

          const dx = d1.x - d2.x
          const dy = d1.y - d2.y
          const dz = (d1.z - d2.z) * 18
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (distance > 0 && distance < minDistance) {
            hasOverlap = true
            const overlap = (minDistance - distance) / 2
            const inv = 1 / distance
            d1.x += dx * inv * overlap
            d1.y += dy * inv * overlap
            d2.x -= dx * inv * overlap
            d2.y -= dy * inv * overlap
          }
        }
      }

      if (!hasOverlap) break
    }
  },

  onSettingsTap() {
    this.setData({ showSettings: true })
  },

  onCloseSettings() {
    this.setData({ showSettings: false })
  },

  onModalBgTap() {
    this.setData({ showSettings: false })
  },

  onModalContentTap() {},

  onDecreaseCount() {
    if (this.data.diceCount > 1) {
      const diceCount = this.data.diceCount - 1
      this.setData({ diceCount })
      if (!this.data.isRolling) {
        this.initDices()
        this.draw()
      }
    }
  },

  onIncreaseCount() {
    if (this.data.diceCount < 10) {
      const diceCount = this.data.diceCount + 1
      this.setData({ diceCount })
      if (!this.data.isRolling) {
        this.initDices()
        this.draw()
      }
    }
  },

  onSoundChange(e) {
    this.setData({ soundEnabled: e.detail.value })
  },

  onKeepAwakeChange(e) {
    const enabled = e.detail.value
    this.setData({ keepAwake: enabled })
    wx.setKeepScreenOn({
      keepScreenOn: enabled,
      fail() {}
    })
  }
})
