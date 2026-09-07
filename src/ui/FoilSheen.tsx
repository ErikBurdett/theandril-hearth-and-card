import { useEffect, useRef } from "react";
import * as THREE from "three";

/** One transparent inspection surface; binder cards use the cheaper CSS finish. */
export function FoilSheen() {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = host.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.Camera();
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        light: { value: new THREE.Vector2(0.5, 0.5) },
        time: { value: 0 },
      },
      vertexShader: `varying vec2 uvCard; void main(){uvCard=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader: `precision mediump float;
        varying vec2 uvCard; uniform vec2 light; uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){
          vec2 p=uvCard;
          float phase=dot(p,vec2(1.2,.7))+dot(light,vec2(1.8,-1.2));
          vec3 spectrum=.55+.45*cos(6.28318*(phase+vec3(0.,.33,.67)));
          float diagonal=p.x*.8+p.y*.6-(light.x*.8+light.y*.6);
          float reflection=pow(max(0.,1.-abs(diagonal)*30.),3.);
          float grain=hash(floor(p*vec2(160.,240.)));
          float flecks=step(.996,grain)*pow(max(0.,sin(time*1.2+grain*180.+phase)),24.);
          float edge=smoothstep(0.,.03,min(min(p.x,1.-p.x),min(p.y,1.-p.y)));
          gl_FragColor=vec4(mix(spectrum,vec3(1.,.94,.77),.5),edge*(reflection*.23+flecks*.45));
        }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    const card = el.closest(".playing-card")!;
    const target = new THREE.Vector2(0.5, 0.5);
    const move = (event: Event) => {
      if (reduced.matches) return;
      const e = event as PointerEvent,
        r = card.getBoundingClientRect();
      target.set(
        (e.clientX - r.left) / r.width,
        1 - (e.clientY - r.top) / r.height,
      );
    };
    const leave = () => target.set(0.5, 0.5);
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    const size = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.render(scene, camera);
    });
    size.observe(el);
    let frame = 0,
      visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      material.uniforms.light.value.lerp(target, 0.12);
      material.uniforms.time.value = reduced.matches ? 0 : t / 1000;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect();
      observer.disconnect();
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return <span ref={host} className="foil-shader" aria-hidden="true" />;
}
