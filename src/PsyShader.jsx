import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Original datamatrix-style glitch, written as WebGL1 GLSL ES 1.00.
const VERT_100 = `precision mediump float;
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG_100 = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float gridSize = mix(20.0, 80.0, hash(vec2(u_time, 0.0)));
  vec2 grid = floor(uv * gridSize);
  float cell = hash(grid + floor(u_time * 2.0));
  float glitch = step(0.85, cell);

  float flash = step(0.98, hash(vec2(floor(u_time * 3.0), 99.0)));
  float flash2 = step(0.995, hash(vec2(floor(u_time * 7.0), 199.0)));
  float flicker = step(0.5, fract(sin(u_time * 10.0 + uv.x * 100.0) * 10000.0));

  vec3 color = mix(vec3(0.05), vec3(1.0), glitch * flicker);
  color = mix(color, vec3(1.0), flash);
  color = mix(color, vec3(0.0), flash2);

  gl_FragColor = vec4(color, 1.0);
}
`;

const VERT_300 = `#version 300 es
precision mediump float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG_300 = `#version 300 es
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float gridSize = mix(20.0, 80.0, hash(vec2(u_time, 0.0)));
  vec2 grid = floor(uv * gridSize);
  float cell = hash(grid + floor(u_time * 2.0));
  float glitch = step(0.85, cell);

  float flash = step(0.98, hash(vec2(floor(u_time * 3.0), 99.0)));
  float flash2 = step(0.995, hash(vec2(floor(u_time * 7.0), 199.0)));
  float flicker = step(0.5, fract(sin(u_time * 10.0 + uv.x * 100.0) * 10000.0));

  vec3 color = mix(vec3(0.05), vec3(1.0), glitch * flicker);
  color = mix(color, vec3(1.0), flash);
  color = mix(color, vec3(0.0), flash2);

  outColor = vec4(color, 1.0);
}
`;

const GL_ATTRS = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
  powerPreference: "default",
};

function dprCap() {
  const raw = window.devicePixelRatio || 1;
  const coarse =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches) ||
    window.innerWidth <= 800;
  return Math.min(raw, coarse ? 1.5 : 2);
}

function sizeCanvas(canvas) {
  const dpr = dprCap();
  const w = Math.max(1, Math.floor((window.innerWidth || 1) * dpr));
  const h = Math.max(1, Math.floor((window.innerHeight || 1) * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return { w, h, dpr };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function linkProgram(gl, vertSrc, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "link failed";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function loseContext(gl) {
  try {
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  } catch {
    /* ignore */
  }
}

function acquireGL(canvas) {
  const tries = [
    { id: "webgl", api: 1 },
    { id: "experimental-webgl", api: 1 },
    { id: "webgl2", api: 2 },
  ];
  for (const attempt of tries) {
    let gl = null;
    try {
      gl = canvas.getContext(attempt.id, GL_ATTRS);
    } catch {
      gl = null;
    }
    if (!gl) continue;
    try {
      const program =
        attempt.api === 2
          ? linkProgram(gl, VERT_300, FRAG_300)
          : linkProgram(gl, VERT_100, FRAG_100);
      return { gl, program };
    } catch (err) {
      console.warn("Breaking Robots shader:", attempt.id, "failed", err);
      loseContext(gl);
    }
  }
  return null;
}

function startWebGL(canvas) {
  const acquired = acquireGL(canvas);
  if (!acquired) return null;
  const { gl, program } = acquired;
  gl.useProgram(program);

  const vertices = new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const timeLoc = gl.getUniformLocation(program, "u_time");
  const resLoc = gl.getUniformLocation(program, "u_resolution");

  return {
    kind: "webgl",
    draw(timeMs) {
      const { w, h } = sizeCanvas(canvas);
      gl.viewport(0, 0, w, h);
      gl.uniform1f(timeLoc, timeMs * 0.001);
      gl.uniform2f(resLoc, w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    isContextLost() {
      return typeof gl.isContextLost === "function" && gl.isContextLost();
    },
  };
}

function hash2(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function startFallback2D(canvas) {
  let ctx = null;
  try {
    ctx = canvas.getContext("2d", { alpha: false });
  } catch {
    ctx = null;
  }
  if (!ctx) return null;

  return {
    kind: "2d",
    draw(timeMs) {
      const { w, h } = sizeCanvas(canvas);
      const t = timeMs * 0.001;
      if (hash2(Math.floor(t * 7), 199) > 0.995) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        return;
      }
      if (hash2(Math.floor(t * 3), 99) > 0.98) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        return;
      }
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, w, h);
      const gridSize = 20 + hash2(t, 0) * 60;
      const cellW = w / gridSize;
      const cellH = h / gridSize;
      const cols = Math.ceil((w / cellW) + 2);
      const rows = Math.ceil((h / cellH) + 2);
      ctx.fillStyle = "#fff";
      const tick = Math.floor(t * 2);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (hash2(x + tick * 0.13, y + tick * 0.17) > 0.85) {
            if (hash2(x + t * 10, y) > 0.5) {
              ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
            }
          }
        }
      }
    },
    isContextLost() {
      return false;
    },
  };
}

function startRenderer(canvas, root) {
  const webgl = startWebGL(canvas);
  if (webgl) {
    root.classList.remove("no-webgl-fallback");
    return webgl;
  }
  const fallback = startFallback2D(canvas);
  if (fallback) {
    root.classList.remove("no-webgl-fallback");
    return fallback;
  }
  root.classList.add("no-webgl-fallback");
  return null;
}

export default function PsyShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const root = document.documentElement;

    sizeCanvas(canvas);
    let renderer = startRenderer(canvas, root);

    let running = true;
    let raf = 0;

    const loop = (t) => {
      if (!running) return;
      try {
        if (renderer && !renderer.isContextLost()) renderer.draw(t);
      } catch (err) {
        console.warn("Breaking Robots shader frame failed", err);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => sizeCanvas(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const onLost = (event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(raf);
    };
    const onRestored = () => {
      renderer = startRenderer(canvas, root);
      running = true;
      raf = requestAnimationFrame(loop);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, []);

  const node = <canvas ref={canvasRef} className="shader-canvas" aria-hidden="true" />;
  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}
