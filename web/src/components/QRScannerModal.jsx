import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM element is mounted
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          let displayId = decodedText;
          if (decodedText.startsWith('upi://pay')) {
            const match = decodedText.match(/[?&]pa=([^&]+)/);
            if (match) displayId = decodeURIComponent(match[1]);
          }
          onScan({ displayId, fullData: decodedText });
          scanner.clear();
          onClose();
        },
        (error) => {
          // ignore scan errors per frame
        }
      );

      scannerRef.current = scanner;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <QrCode size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Scan UPI QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Align the UPI payment QR code inside the frame to auto-fill payment & merchant info.
        </p>

        <div id="qr-reader-container" className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800"></div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const input = prompt("Enter UPI ID manually (e.g. merchant@upi):");
              if (input) {
                onScan({ displayId: input, fullData: `upi://pay?pa=${input}` });
                onClose();
              }
            }}
            className="text-xs text-indigo-400 hover:underline font-medium"
          >
            Enter UPI ID manually
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
