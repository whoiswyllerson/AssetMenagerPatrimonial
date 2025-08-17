import React, { useEffect, useRef, useState } from 'react';
import type { Asset } from '../../types';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { PrintIcon } from '../shared/Icons';

interface LabelPrintModalProps {
    asset: Asset;
    onClose: () => void;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ asset, onClose }) => {
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const barcodeRef = useRef<SVGSVGElement>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const qrCodeValue = asset.identifiers?.qrCode || asset.id;
        const barcodeValue = asset.identifiers?.barcode || asset.serialNumber || asset.id.replace('ASSET-', '');

        if (qrCodeRef.current) {
            QRCode.toCanvas(qrCodeRef.current, qrCodeValue, { width: 90, margin: 1 }, (error) => {
                if (error) console.error("QR Code generation error:", error);
            });
        }
        if (barcodeRef.current) {
             try {
                JsBarcode(barcodeRef.current, barcodeValue, {
                    format: 'CODE128',
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 5,
                });
             } catch (e) {
                console.error("Barcode generation error:", e);
                // Fallback for invalid barcode values
                JsBarcode(barcodeRef.current, asset.id, {
                    format: 'CODE128',
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 5,
                });
             }
        }
    }, [asset]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        body > *:not(.printable-area) {
                            display: none !important;
                        }
                        .printable-area {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .label-card {
                            border: 2px dashed #000 !important;
                            transform: scale(1.5); /* Make it larger for printing */
                        }
                        .no-print {
                           display: none !important;
                        }
                    }
                `}
            </style>
            <div className={`fixed inset-0 bg-black flex justify-center items-center z-[60] p-4 no-print transition-opacity duration-300 ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
                <div className={`bg-white rounded-lg shadow-xl w-full max-w-lg transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-brand-secondary">Etiqueta de Ativo</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                    </div>

                    <div className="p-6 bg-gray-50 printable-area">
                       <div className="bg-white p-4 border border-gray-300 rounded-md w-[350px] mx-auto label-card">
                            <p className="text-xs text-center font-semibold text-brand-secondary">AssetManager Pro</p>
                            <h3 className="text-lg font-bold text-center truncate" title={asset.name}>{asset.name}</h3>
                            <p className="text-sm text-center text-gray-600 mb-2">{asset.id}</p>
                            <div className="flex justify-between items-center mt-4">
                                <div className="w-1/3 flex justify-center">
                                    <canvas ref={qrCodeRef}></canvas>
                                </div>
                                <div className="w-2/3 flex justify-center">
                                    <svg ref={barcodeRef}></svg>
                                </div>
                            </div>
                       </div>
                    </div>
                    
                    <div className="p-4 bg-gray-100 border-t flex justify-end items-center space-x-3">
                         <p className="text-xs text-text-secondary mr-auto">Visualize a impressão antes de confirmar.</p>
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium">Cancelar</button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent text-sm font-medium transform transition-transform active:scale-95"
                        >
                            <PrintIcon className="mr-2"/>
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};