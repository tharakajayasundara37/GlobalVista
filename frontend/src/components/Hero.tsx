'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

import Navbar from './Navbar';
import TravelSearch from './TravelSearch';

export default function Hero() {
  return (
    <section className="hero">
      <video
        className="heroVideo"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
      >
        <source src="/videos/globalvista-hero.mp4" type="video/mp4" />
      </video>

      <div className="heroOverlay" />

      <Navbar />

      <div className="heroContent">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="eyebrow">
            <span />
            THE WORLD IS WAITING
          </div>

          <h1>
            Adventures That
            <br />
            <em>Stay With You.</em>
          </h1>

          <p>
            Discover extraordinary destinations, thoughtfully crafted
            experiences and journeys designed to become unforgettable stories.
          </p>

          <div className="heroButtons">
            <Link href="/destinations" className="primaryButton">
              Explore Destinations
              <ArrowRight size={19} />
            </Link>

            <button className="videoButton">
              <span className="playIcon">
                <Play size={17} fill="currentColor" />
              </span>
              Watch Video
            </button>
          </div>
        </motion.div>
      </div>

      <TravelSearch />

      <div className="scrollText">
        <span />
        SCROLL TO DISCOVER
      </div>
    </section>
  );
}