// pages/dashboard.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import WebcamCaptureModal from '../../components/WebcamCaptureModal';

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);

  // Hardcoded Pokémon card images (place these images in your public folder)
  const cards = [
    { id: 1, image: '/cards/dracaufeu.jpg' },
    { id: 2, image: '/cards/mewtwo.jpg' },
    { id: 3, image: '/cards/pikachu.jpg' },
    { id: 4, image: '/cards/dracaufeu.jpg' },
    { id: 5, image: '/cards/mewtwo.jpg' },
    { id: 6, image: '/cards/pikachu.jpg' },
    { id: 7, image: '/cards/dracaufeu.jpg' },
    { id: 8, image: '/cards/mewtwo.jpg' },
    { id: 9, image: '/cards/pikachu.jpg' },
  ];

  const handleDisconnect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search friends..."
          className="input input-bordered w-full max-w-xs"
        />
        <button onClick={handleDisconnect} className="btn btn-error">
          Disconnect
        </button>
      </header>

      <main>
        <div>
          <button className="btn btn-primary mb-4" onClick={() => setModalOpen(true)}>
            Scan New Card
          </button>
        </div>

        <div className="carousel rounded-box shadow-lg h-100">
          {cards.map((card) => (
            <div key={card.id} className="carousel-item">
              <img src={card.image} alt={`Card ${card.id}`} className="rounded-lg border" />
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <WebcamCaptureModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
