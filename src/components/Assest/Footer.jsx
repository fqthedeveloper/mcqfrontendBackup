// src/components/Shared/Footer.js
import React from 'react';


export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="container footer-container">
        <p>&copy; {new Date().getFullYear()} MyApp. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
