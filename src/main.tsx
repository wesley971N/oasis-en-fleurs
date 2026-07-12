// Inject Google Fonts dynamically so bundler doesn't treat it as a local asset
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Vollkorn:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Petit+Formal+Script&display=swap'
document.head.appendChild(fontLink)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Smooth scroll with Lenis
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
})

function raf(time: number) {
  lenis.raf(time)
  ScrollTrigger.update()
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Reset Lenis on page navigation (React re-renders)
window.addEventListener('page-change', () => {
  lenis.scrollTo(0, { immediate: true })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
