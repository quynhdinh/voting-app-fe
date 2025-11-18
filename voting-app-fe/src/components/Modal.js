import React from 'react';

export default function Modal({ children, onClose }) {
  return (
    <div
      onClick={() => onClose && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 6,
          width: '90%',
          maxWidth: 720,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
