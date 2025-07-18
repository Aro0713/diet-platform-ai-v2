import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-black text-white text-sm px-6 py-4 z-50 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        This website uses cookies to enhance user experience. See our{' '}
        <Link href="/polityka-prywatnosci" className="underline hover:text-gray-300">
          privacy policy
        </Link>.
      </div>
      <button
        onClick={handleAccept}
        className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition"
      >
        Accept
      </button>
    </div>
  );
}
