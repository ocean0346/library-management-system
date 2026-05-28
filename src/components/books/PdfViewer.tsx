import React from 'react'
import { Viewer, Worker, PageChangeEvent } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

interface PdfViewerProps {
    fileUrl: string
    initialPage?: number
    onPageChange?: (page: number) => void
}

export default function PdfViewer({ fileUrl, initialPage = 0, onPageChange }: PdfViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin()

    const handlePageChange = (e: PageChangeEvent) => {
        if (onPageChange) {
            onPageChange(e.currentPage)
        }
    }

    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div className="h-full w-full pdf-viewer-container">
                <style>{`
                    .pdf-viewer-container [aria-label="Download"],
                    .pdf-viewer-container [aria-label="Print"],
                    .pdf-viewer-container [aria-label="Open"] {
                        display: none !important;
                    }
                `}</style>
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[defaultLayoutPluginInstance]}
                    initialPage={initialPage}
                    onPageChange={handlePageChange}
                    defaultScale={1.5}
                    theme="auto"
                />
            </div>
        </Worker>
    )
}
