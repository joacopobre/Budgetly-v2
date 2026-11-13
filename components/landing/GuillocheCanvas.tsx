'use client'

import { useEffect, useRef } from 'react'
import type { RGB } from '@/lib/landing/color'

/**
 * Guilloché: the fine interwoven line-work engraved on banknotes, drawn by one
 * small fragment shader (no 3D library).
 *
 * `calm` goes from 0 (lines alive and flowing) to 1 (two line families settle
 * onto each other as flat ledger rules). The page drives it from scroll.
 *
 * It only renders while on screen and the tab is visible, stops once the lines
 * are flat, lowers its resolution on small screens, and draws a single still
 * frame when the visitor prefers reduced motion.
 */

export type GuillocheColors = {
  /** Background and line colour while alive. */
  bgFrom: RGB
  lineFrom: RGB
  /** Background and line colour once calm. */
  bgTo: RGB
  lineTo: RGB
  glow: RGB
}

type Props = {
  /** Line motion, read every frame: 0 = flowing, 1 = flat rules. */
  calm: React.RefObject<number>
  /** Colour, read every frame: 0 = the "from" colours, 1 = the "to" colours. Defaults to `calm`. */
  tone?: React.RefObject<number>
  colors: GuillocheColors
  className?: string
  /** Where the quiet area for text sits. */
  quiet?: 'top-left' | 'center'
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uCalm;
uniform float uTone;
uniform float uDensity;
uniform float uQuiet;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform vec3 uLineA;
uniform vec3 uLineB;
uniform vec3 uGlow;

// One family of evenly spaced hairlines along v, antialiased.
float hairlines(float v) {
  float f = v * uDensity;
  float d = abs(fract(f) - 0.5);
  float w = fwidth(f);
  float line = 1.0 - smoothstep(w * 0.35, w * 1.25, d);
  // Where the engraving bunches tighter than a pixel, settle to an even tone.
  float dense = smoothstep(0.3, 0.75, w);
  return mix(line, 0.42, dense);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  float alive = 1.0 - smoothstep(0.0, 1.0, uCalm);
  float c = clamp(uTone, 0.0, 1.0);
  float t = uTime;

  // A slow travelling envelope bends both families against each other.
  float env = sin(p.x * 1.6 + t * 0.13) * cos(p.y * 2.2 - t * 0.07);

  float w1 = 0.115 * sin(p.x * 2.3 + t * 0.20 + 2.0 * env)
           + 0.034 * sin(p.x * 6.1 - t * 0.31 + p.y * 3.0);
  float w2 = 0.095 * sin(p.x * 2.9 - t * 0.16 + 1.9 - 1.6 * env)
           + 0.030 * sin(p.x * 5.2 + t * 0.24 - p.y * 2.0);

  // Amplitude varies with height, so the spacing breathes and bunches.
  float g1 = 0.55 + 0.45 * sin(p.y * 5.0 + t * 0.11 + p.x * 0.7);
  float g2 = 0.55 + 0.45 * cos(p.y * 4.2 - t * 0.09 - p.x * 0.5);

  float l1 = hairlines(p.y + alive * w1 * g1);
  float l2 = hairlines(p.y + alive * w2 * g2);
  float ink = max(l1, l2 * 0.72);

  // Keep the area behind the headline quiet.
  float quietTL = smoothstep(-0.55, 0.55, p.x / aspect * 1.5 - p.y * 0.9);
  float quietC = smoothstep(0.05, 0.6, length(p * vec2(0.8 / aspect * 1.6, 1.5)));
  float mask = mix(quietTL, quietC, uQuiet);
  mask = mix(0.22, 1.0, mask);

  vec3 bg = mix(uBgA, uBgB, c);
  float glow = exp(-length((p - vec2(0.36 * aspect, -0.62)) * vec2(0.75, 1.25)) * 2.1);
  bg += uGlow * glow * 0.2 * alive;

  vec3 lineColor = mix(uLineA, uLineB, c);
  float alpha = mix(0.34 * mask, 0.7, c);

  gl_FragColor = vec4(mix(bg, lineColor, ink * alpha), 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const unit = (c: RGB): [number, number, number] => [c[0] / 255, c[1] / 255, c[2] / 255]

export default function GuillocheCanvas({ calm, tone, colors, className, quiet = 'top-left' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorsRef = useRef(colors)
  colorsRef.current = colors

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return // CSS background stays as the fallback

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()
    if (!vs || !fs || !program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const uRes = u('uRes')
    const uTime = u('uTime')
    const uCalm = u('uCalm')
    const uTone = u('uTone')
    const uDensity = u('uDensity')
    const uQuiet = u('uQuiet')
    const uBgA = u('uBgA')
    const uBgB = u('uBgB')
    const uLineA = u('uLineA')
    const uLineB = u('uLineB')
    const uGlow = u('uGlow')

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 767px)')

    let cssHeight = 1
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, small.matches ? 1.25 : 2)
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      cssHeight = Math.max(1, rect.height)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      dirty = true
    }

    let onScreen = false
    let dirty = true
    let raf = 0
    let last = 0
    let time = 11.5 // start on a composed frame rather than at zero
    let lastCalm = -1
    let lastTone = -1
    let lastColors: GuillocheColors | null = null

    const draw = (now: number) => {
      raf = 0
      const value = Math.min(1, Math.max(0, calm.current ?? 0))
      const toneValue = tone ? Math.min(1, Math.max(0, tone.current ?? 0)) : value
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const moving = !reduced && value < 0.999
      if (moving) time += dt

      const c = colorsRef.current
      if (moving || dirty || value !== lastCalm || toneValue !== lastTone || c !== lastColors) {
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform1f(uTime, time)
        gl.uniform1f(uCalm, value)
        gl.uniform1f(uTone, toneValue)
        gl.uniform1f(uDensity, Math.min(46, Math.max(24, cssHeight / 21)))
        gl.uniform1f(uQuiet, quiet === 'center' ? 1 : 0)
        gl.uniform3fv(uBgA, unit(c.bgFrom))
        gl.uniform3fv(uBgB, unit(c.bgTo))
        gl.uniform3fv(uLineA, unit(c.lineFrom))
        gl.uniform3fv(uLineB, unit(c.lineTo))
        gl.uniform3fv(uGlow, unit(c.glow))
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        dirty = false
        lastCalm = value
        lastTone = toneValue
        lastColors = c
      }
      schedule()
    }

    const schedule = () => {
      if (raf || !onScreen || document.hidden) return
      raf = requestAnimationFrame(draw)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }

    const io = new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting
      if (onScreen) schedule()
      else stop()
    })
    io.observe(canvas)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : schedule())
    document.addEventListener('visibilitychange', onVisibility)

    resize()
    canvas.dataset.ready = 'true'

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [calm, tone, quiet])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
