import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between relative">
      {/* Logo */}
      <div className="text-lg font-bold">
        <a href="/" className="flex items-center space-x-2">
          {/* You can replace this text with an actual image */}
          <img
            src="/image/image3.png"  // your logo path
            alt="ShramikBandhu Logo"
            className="w-8 h-8"
          />
          <span>ShramikBandhu</span>
        </a>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-6">
        <a href="/" className="hover:text-gray-400">Home</a>
        <a href="/about" className="hover:text-gray-400">About</a>
        <a href="/contact" className="hover:text-gray-400">Contact</a>
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-gray-800 flex flex-col items-center py-4 md:hidden">
          <a href="/" className="py-2 hover:text-gray-400">Home</a>
          <a href="/about" className="py-2 hover:text-gray-400">About</a>
          <a href="/contact" className="py-2 hover:text-gray-400">Contact</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
