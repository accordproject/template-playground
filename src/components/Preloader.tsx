import React from 'react';

const Preloader: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#1b2540', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="text">
        <svg width="700" height="100" viewBox="0 0 137 136" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M88.1 135.8H136.1L92.3 0H44.3L55.9 36.1H32.4L0 135.8H48L67.5 73.5H67.8L88.1 135.8ZM85.8 9L123.8 126.8H94.7L56.7 9H85.8ZM65.1 64.5H47.3L40.9 45.1H58.9L65.1 64.5ZM41.5 126.8H12.5L35.3 56.7L40.9 73.5H58.3L41.5 126.8Z" fill="white"/>
        </svg>
      </div>
      <style>{`
        .text {
          max-width: 100%;
        }
        svg {
          max-width: 100%;
          height: auto;
        }
        svg path {
          stroke: rgb(255, 255, 255);
          stroke-width: 0.7;
          stroke-dasharray: 100;
          stroke-dashoffset: 10;
          animation: textAnimation 2s ease-in-out infinite forwards;
        }
        @keyframes textAnimation {
          0% {
            stroke-dashoffset: 50;
          }
          80% {
            fill: transparent;
          }
          100% {
            fill: white;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Preloader;