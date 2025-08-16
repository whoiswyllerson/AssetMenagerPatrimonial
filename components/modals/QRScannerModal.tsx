import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const QR_READER_ID = "qr-reader";

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!show) return;

        const scanner = new Html5QrcodeScanner(
            QR_READER_ID,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                supportedScanTypes: [0, 1] // SCAN_TYPE_CAMERA, SCAN_TYPE_FILE
            },
            false // verbose
        );

        let isScanning = true;

        const handleSuccess = (decodedText: string) => {
            if(isScanning) {
                isScanning = false;
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode-scanner.", error);
                });
                onScanSuccess(decodedText);
            }
        };

        const handleError = (errorMessage: string) => {
            // console.warn(`QR code scan error = ${errorMessage}`);
        };

        scanner.render(handleSuccess, handleError);

        return () => {
            if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
                 scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode-scanner on cleanup.", error);
                 });
            }
        };
    }, [onScanSuccess, show]);

    return (
        <div className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${show ? 'bg-opacity-75' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-secondary">Escanear Código do Ativo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                </div>
                <div className="p-4">
                    <p className="text-center text-text-secondary mb-4">Aponte a câmera para o QR Code ou código de barras do ativo.</p>
                    <div id={QR_READER_ID} className="w-full"></div>
                </div>
                 <div className="p-3 bg-gray-50 border-t flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};