import React, { useEffect, useRef, useState } from 'react';
import type { Asset } from '../../types';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { PrintIcon } from '../shared/Icons';

interface BulkLabelPrintModalProps {
    assets: Asset[];
    onClose: () => void;
}

const Label: React.FC<{ asset: Asset }> = ({ asset }) => {
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const qrCodeValue = asset.identifiers?.qrCode || asset.id;
        const barcodeValue = asset.identifiers?.barcode || asset.serialNumber || asset.id.replace('ASSET-', '');

        if (qrCodeRef.current) {
            QRCode.toCanvas(qrCodeRef.current, qrCodeValue, { width: 60, margin: 1, errorCorrectionLevel: 'L' }, (error) => {
                if (error) console.error("QR Code generation error:", error);
            });
        }
        if (barcodeRef.current) {
             try {
                JsBarcode(barcodeRef.current, barcodeValue, {
                    format: 'CODE128',
                    width: 1.5,
                    height: 35,
                    displayValue: false,
                    margin: 2,
                });
             } catch (e) {
                 // Fallback for invalid barcode values
                JsBarcode(barcodeRef.current, asset.id, {
                    format: 'CODE128', width: 1.5, height: 35, displayValue: false, margin: 2
                });
             }
        }
    }, [asset]);

    return (
        <div className="p-2 border border-gray-300 bg-white break-inside-avoid-page">
            <p className="text-xs font-bold text-center truncate leading-tight" title={asset.name}>{asset.name}</p>
            <p className="text-[10px] text-center text-gray-600 mb-1 leading-tight">{asset.id}</p>
            <div className="flex items-center justify-around">
                <canvas ref={qrCodeRef}></canvas>
                <svg ref={barcodeRef} className="w-24"></svg>
            </div>
        </div>
    );
};

export const BulkLabelPrintModal: React.FC<BulkLabelPrintModalProps> = ({ assets, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        body > *:not(.printable-area-bulk) {
                            display: none !important;
                        }
                        .printable-area-bulk {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            background-color: white !important;
                            padding: 2rem;
                        }
                        .label-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                        }
                         .no-print {
                           display: none !important;
                        }
                    }
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                `}
            </style>
            <div className={`fixed inset-0 bg-black flex justify-center items-center z-[60] p-4 no-print transition-opacity duration-300 ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
                <div className={`bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-brand-secondary">Impressão de Etiquetas em Massa</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                    </div>

                    <div className="p-6 bg-gray-200 flex-1 overflow-y-auto printable-area-bulk">
                       <div className="label-grid grid grid-cols-2 gap-2">
                            {assets.map(asset => (
                                <Label key={asset.id} asset={asset} />
                            ))}
                       </div>
                    </div>
                    
                    <div className="p-4 bg-gray-100 border-t flex justify-end items-center space-x-3 no-print">
                         <p className="text-xs text-text-secondary mr-auto">Gerado {assets.length} etiquetas. Use a pré-visualização de impressão do seu navegador.</p>
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium">Cancelar</button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent text-sm font-medium transform transition-transform active:scale-95"
                        >
                            <PrintIcon className="mr-2"/>
                            Imprimir Tudo
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};