import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { podcasts, categories } from '../data/podcasts'
import VideoCard from '../components/VideoCard'
import './Library.css'

export default function Library() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = podcasts.filter((p) => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory
        const q = searchQuery.toLowerCase()
        const matchSearch = !q ||
            p.titleEn.toLowerCase().includes(q) ||
            p.title.includes(q) ||
            p.description.toLowerCase().includes(q)
        return matchCat && matchSearch
    })

    return (
        <main className="lib">
            {/* Header */}
            <section className="lib-header">
                <div className="lib-title-wrap">
                    <h1 className="lib-title anim-fadein">All Episodes</h1>
                </div>
                <div className="container">
                    <div className="rule" />
                    <div className="lib-controls anim-fadein-delay1">
                        {/* Search */}
                        <div className="lib-search">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search episodes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="lib-search-input"
                            />
                            {searchQuery && (
                                <button className="lib-clear" onClick={() => setSearchQuery('')}>✕</button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="lib-filters">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`lib-filter${activeCategory === cat ? ' active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="lib-grid-section">
                {filtered.length === 0 ? (
                    <div className="container lib-empty">
                        <p>No episodes found.</p>
                        <button onClick={() => { setSearchQuery(''); setActiveCategory('All') }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="lib-grid">
                        {filtered.map((p) => (
                            <VideoCard key={p.id} podcast={p} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
