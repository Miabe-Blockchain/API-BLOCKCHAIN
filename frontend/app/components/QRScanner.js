"use client";

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError, onClose }) {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!qrRef.current) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCode.start(
      { facingMode: "environment" }, // Utiliser la caméra arrière si disponible
      config,
      (decodedText) => {
        // Succès - QR code détecté
        onScan(decodedText);
        html5QrCode.stop();
      },
      (errorMessage) => {
        // Erreur de lecture (normal pendant la recherche)
        // Ne pas afficher d'erreur pour les erreurs de lecture normales
      }
    ).catch((err) => {
      // Erreur de démarrage de la caméra
      onError(err);
    });

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {
          // Ignorer les erreurs lors de l'arrêt
        });
      }
    };
  }, [onScan, onError]);

  const handleClose = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {
        // Ignorer les erreurs lors de l'arrêt
      });
    }
    onClose();
  };

  return (
    <div className="qr-scanner-container">
      <div id="qr-reader" ref={qrRef} style={{ width: '100%', minHeight: '300px' }}></div>
      <div className="text-center mt-3">
        <button className="btn btn-secondary" onClick={handleClose}>
          Fermer le scanner
        </button>
      </div>
    </div>
  );
} 