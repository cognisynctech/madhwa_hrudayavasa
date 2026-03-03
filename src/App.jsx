import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Navbar from './components/Navbar'
import CustomCursor from './components/CustomCursor'
import Footer from './components/Footer'
import SplashScreen from './components/SplashScreen'
import Home from './pages/Home'
import Library from './pages/Library'
import Contact from './pages/Contact'

gsap.registerPlugin(ScrollTrigger)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  return null
}

export default function App() {
  const [loaded, setLoaded] = useState(false)

  /* Lock scroll while splash is showing, force to top when done */
  useEffect(() => {
    if (loaded) {
      document.body.style.overflow = ''
      window.scrollTo(0, 0)
    } else {
      document.body.style.overflow = 'hidden'
      window.scrollTo(0, 0)
    }
  }, [loaded])

  useEffect(() => {
    // Do NOT set smooth scroll globally — it fights with instant ScrollToTop navigation
  }, [])

  return (
    <Router>
      {!loaded && <SplashScreen onComplete={() => setLoaded(true)} />}
      <ScrollToTop />
      <CustomCursor />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home loaded={loaded} />} />
        <Route path="/library" element={<Library />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </Router>
  )
}
