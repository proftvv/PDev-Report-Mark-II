import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Worker configuration
// Use Vite's ?url import to get the correct path to the worker in node_modules
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function PDFCanvas({ file, children, onLoadSuccess, onLoadError }) {
    const [numPages, setNumPages] = useState(null);
    const [pageWidth, setPageWidth] = useState(null);
    const containerRef = useRef(null);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        if (onLoadSuccess) onLoadSuccess({ numPages });
    }

    // We only render Page 1 for field mapping for now
    return (
        <div className="pdf-canvas-container" ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '400px' }}>
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-4">PDF Yükleniyor...</div>}
                error={<div>PDF yüklenemedi. <br /> <span style={{ fontSize: '10px', color: 'red' }}>{window.pdfError}</span></div>}
                onLoadError={(error) => {
                    console.error('PDF Load Error:', error);
                    // alert('PDF Hatası: ' + error.message);
                    if (onLoadError) onLoadError(error); // Call parent handler if exists
                }}
            >
                <Page
                    pageNumber={1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={containerRef.current ? containerRef.current.clientWidth : null}
                    onLoadSuccess={(page) => {
                        setPageWidth(page.width);
                    }}
                />
            </Document>

            {/* Overlay - Only show if page is loaded to avoid layout shifts affecting absolute pos */}
            {pageWidth && (
                <div className="pdf-overlay" style={{ position: 'absolute', inset: 0 }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default PDFCanvas;
