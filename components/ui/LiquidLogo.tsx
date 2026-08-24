'use client';

/**
 * LiquidLogo.tsx
 * Composant Liquid Logo inspiré directement de paper-design/liquid-logo.
 * Transforme le logo Planifive en métal liquide / chrome fluide interactif avec WebGL2.
 */

import { useEffect, useRef, useState } from 'react';

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const liquidFragSource = `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;
uniform float u_scale_x;
uniform float u_scale_y;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    img_uv.x /= u_scale_x;
    img_uv.y /= u_scale_y;
    img_uv += .5;
    img_uv.y = 1. - img_uv.y;
    return img_uv;
}

vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float border = 0.;
    float blur = u_patternBlur + extra_blur;

    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));

    border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));

    return ch;
}

float get_img_frame_alpha(vec2 uv, float img_frame_width) {
    float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
    img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
    return img_frame_alpha;
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;

    float diagonal = uv.x - uv.y;
    float t = .001 * u_time;

    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);

    vec3 color = vec3(0.);
    float opacity = 1.;

    vec3 color1 = vec3(.98, 0.98, 1.);
    vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));

    float edge = img.r;

    vec2 grad_uv = uv;
    grad_uv -= .5;

    float dist = length(grad_uv + vec2(0., .2 * diagonal));
    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);

    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);

    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;

    opacity = 1. - smoothstep(.9 - .5 * u_edge, 1. - .5 * u_edge, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);

    float noise = snoise(uv - t);
    edge += (1. - edge) * u_liquid * noise;

    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);

    float dir = grad_uv.x;
    dir += diagonal;
    dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));

    bulge *= clamp(pow(uv.y, .1), .3, 1.);
    dir *= (.1 + (1.1 - edge) * bulge);
    dir *= smoothstep(1., .7, edge);
    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));
    dir *= (.5 + .5 * pow(uv.y, 2.));
    dir *= cycle_width;
    dir -= t;

    float refr_r = refr;
    refr_r += .03 * bulge * noise;
    float refr_b = 1.3 * refr;

    refr_r += 5. * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge));
    refr_r -= diagonal;

    refr_b += (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge));
    refr_b -= .2 * edge;

    refr_r *= u_refraction;
    refr_b *= u_refraction;

    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w[1] -= .02 * smoothstep(.0, 1., edge + bulge);
    float stripe_r = mod(dir + refr_r, 1.);
    float r = get_color_channel(color1.r, color2.r, stripe_r, w, 0.02 + .03 * u_refraction * bulge, bulge);
    float stripe_g = mod(dir, 1.);
    float g = get_color_channel(color1.g, color2.g, stripe_g, w, 0.01 / (1. - diagonal), bulge);
    float stripe_b = mod(dir - refr_b, 1.);
    float b = get_color_channel(color1.b, color2.b, stripe_b, w, .01, bulge);

    color = vec3(r, g, b);
    color *= opacity;

    fragColor = vec4(color, opacity);
}`;

/** Helper: Generates a beveled elevation map using Poisson solver */
function parseLogoImage(src: string, targetSize = 256): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = targetSize;
      const height = targetSize;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context failed'));

      // Draw the image centered with minimal margin to maximize logo presence
      const padding = 6;
      const drawWidth = width - padding * 2;
      const drawHeight = height - padding * 2;
      ctx.drawImage(img, padding, padding, drawWidth, drawHeight);

      const shapeImageData = ctx.getImageData(0, 0, width, height);
      const data = shapeImageData.data;
      const shapeMask = new Array(width * height).fill(false);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx4 = (y * width + x) * 4;
          const a = data[idx4 + 3];
          const r = data[idx4];
          const g = data[idx4 + 1];
          const b = data[idx4 + 2];
          // Non-shape if transparent or pure dark/white background
          if (a < 30 || (r < 15 && g < 15 && b < 15 && a > 240)) {
            shapeMask[y * width + x] = false;
          } else {
            shapeMask[y * width + x] = true;
          }
        }
      }

      function inside(x: number, y: number) {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        return shapeMask[y * width + x];
      }

      const boundaryMask = new Array(width * height).fill(false);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (!shapeMask[idx]) continue;
          let isBoundary = false;
          for (let ny = y - 1; ny <= y + 1 && !isBoundary; ny++) {
            for (let nx = x - 1; nx <= x + 1 && !isBoundary; nx++) {
              if (!inside(nx, ny)) isBoundary = true;
            }
          }
          if (isBoundary) boundaryMask[idx] = true;
        }
      }

      const u = new Float32Array(width * height).fill(0);
      const newU = new Float32Array(width * height).fill(0);
      const C = 0.01;
      const ITERATIONS = 120; // Fast and smooth at 256x256

      function getU(x: number, y: number, arr: Float32Array) {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        if (!shapeMask[y * width + x]) return 0;
        return arr[y * width + x];
      }

      for (let iter = 0; iter < ITERATIONS; iter++) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (!shapeMask[idx] || boundaryMask[idx]) {
              newU[idx] = 0;
              continue;
            }
            const sumN = getU(x + 1, y, u) + getU(x - 1, y, u) + getU(x, y + 1, u) + getU(x, y - 1, u);
            newU[idx] = (C + sumN) / 4;
          }
        }
        for (let i = 0; i < width * height; i++) {
          u[i] = newU[i];
        }
      }

      let maxVal = 0;
      for (let i = 0; i < width * height; i++) {
        if (u[i] > maxVal) maxVal = u[i];
      }
      if (maxVal === 0) maxVal = 1;

      const alpha = 2.0;
      const outImg = ctx.createImageData(width, height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const px = idx * 4;
          if (!shapeMask[idx]) {
            outImg.data[px] = 255;
            outImg.data[px + 1] = 255;
            outImg.data[px + 2] = 255;
            outImg.data[px + 3] = 255;
          } else {
            const raw = u[idx] / maxVal;
            const remapped = Math.pow(raw, alpha);
            const gray = Math.round(255 * (1 - remapped));
            outImg.data[px] = gray;
            outImg.data[px + 1] = gray;
            outImg.data[px + 2] = gray;
            outImg.data[px + 3] = 255;
          }
        }
      }

      resolve(outImg);
    };
    img.onerror = reject;
    img.src = src;
  });
}

interface LiquidLogoProps {
  src?: string;
  size?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  patternScale?: number;
  refraction?: number;
  edge?: number;
  patternBlur?: number;
  liquid?: number;
  speed?: number;
}

export function LiquidLogo({
  src = '/logo-five.png',
  size = 180,
  width,
  height,
  scaleX = 1.35, // Élargissement horizontal par défaut
  scaleY = 1.0,
  patternScale = 2.2,
  refraction = 0.018,
  edge = 0.4,
  patternBlur = 0.005,
  liquid = 0.07,
  speed = 0.12, // Ralenti pour un effet fluide et élégant
}: LiquidLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  useEffect(() => {
    let active = true;
    let animId = 0;

    async function init() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
      if (!gl) return;

      let imageData: ImageData;
      try {
        imageData = await parseLogoImage(src, 384);
      } catch (err) {
        console.error('Failed to parse logo for liquid shader:', err);
        return;
      }
      if (!active) return;

      function createShader(glCtx: WebGL2RenderingContext, source: string, type: number) {
        const s = glCtx.createShader(type);
        if (!s) return null;
        glCtx.shaderSource(s, source);
        glCtx.compileShader(s);
        if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) {
          console.error(glCtx.getShaderInfoLog(s));
          glCtx.deleteShader(s);
          return null;
        }
        return s;
      }

      const vs = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fs = createShader(gl, liquidFragSource, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      // Setup fullscreen quad
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Texture
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        imageData.width,
        imageData.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imageData.data
      );

      // Uniforms
      const uEdge = gl.getUniformLocation(program, 'u_edge');
      const uPatternBlur = gl.getUniformLocation(program, 'u_patternBlur');
      const uPatternScale = gl.getUniformLocation(program, 'u_patternScale');
      const uRefraction = gl.getUniformLocation(program, 'u_refraction');
      const uLiquid = gl.getUniformLocation(program, 'u_liquid');
      const uScaleX = gl.getUniformLocation(program, 'u_scale_x');
      const uScaleY = gl.getUniformLocation(program, 'u_scale_y');
      const uRatio = gl.getUniformLocation(program, 'u_ratio');
      const uImgRatio = gl.getUniformLocation(program, 'u_img_ratio');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uTexture = gl.getUniformLocation(program, 'u_image_texture');

      gl.uniform1f(uEdge, edge);
      gl.uniform1f(uPatternBlur, patternBlur);
      gl.uniform1f(uPatternScale, patternScale);
      gl.uniform1f(uRefraction, refraction);
      gl.uniform1f(uLiquid, liquid);
      gl.uniform1f(uScaleX, scaleX);
      gl.uniform1f(uScaleY, scaleY);
      gl.uniform1f(uRatio, finalWidth / finalHeight);
      gl.uniform1f(uImgRatio, imageData.width / imageData.height);
      gl.uniform1i(uTexture, 0);

      // Canvas dimensions
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = finalWidth * dpr;
      canvas.height = finalHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      let totalTime = 0;
      let lastTime = performance.now();

      setLoaded(true);

      function render(now: number) {
        if (!active) return;
        const dt = now - lastTime;
        lastTime = now;
        totalTime += dt * speed;

        gl!.uniform1f(uTime, totalTime);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

        animId = requestAnimationFrame(render);
      }

      animId = requestAnimationFrame(render);
    }

    init();

    return () => {
      active = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [src, finalWidth, finalHeight, patternScale, refraction, edge, patternBlur, liquid, speed]);

  return (
    <div
      style={{
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${finalWidth}px`,
          height: `${finalHeight}px`,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 15px rgba(19, 48, 236, 0.4))',
        }}
      />
      {!loaded && (
        <img
          src={src}
          alt="Logo fallback"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}
