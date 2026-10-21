import Link from 'next/link';
import { Search, Globe2, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <Link href="/" className="logo">
        Global<span>Vista</span>
      </Link>

      <nav className="navLinks">
        <Link href="/destinations">Destinations</Link>
        <Link href="/packages">Experiences</Link>
        <Link href="/bookings">Trips</Link>
        <Link href="/about">About Us</Link>
        <Link href="/blog">Blog</Link>
      </nav>

      <div className="navActions">
        <button className="iconButton" aria-label="Search">
          <Search size={19} />
        </button>

        <button className="languageButton">
          <Globe2 size={17} />
          EN
        </button>

        <Link href="/packages" className="planButton">
          Plan Your Trip
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </header>
  );
}