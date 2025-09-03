"use client";
import React, { useState } from "react";
import InvoiceForm from "../../components/InvoiceForm";
import InvoicePreview from "../../components/InvoicePreview";
import { generateStandardizedPDF } from "../../utils/pdfGenerator";
import JSZip from 'jszip';

export default function CreateInvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [backendInvoices, setBackendInvoices] = useState<any[]>([]); // NEW
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [share, setShare] = useState(45); // Default share %
  const [gstType, setGstType] = useState('CGST/SGST');
  const [gstRate, setGstRate] = useState(18);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSource, setPreviewSource] = useState<'frontend' | 'backend'>('frontend'); // NEW
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [duplicateInvoices, setDuplicateInvoices] = useState<any[]>([]);

  // Handler to receive invoices and share/gst from InvoiceForm
  const handleFormChange = (data: any[], isNewUpload: boolean = false) => {
    setInvoices(data || []);
    setSelectedIdx(0);
    
    // Only reset preview and upload state if this is a new file upload
    if (isNewUpload) {
      setShowPreview(false);
      setHasUploaded(false);
      setBackendInvoices([]);
      setDuplicateInvoices([]);
      setSelectedInvoices([]);
      setSelectAll(false);
    }
    
    if (data && data.length) {
      setShare(data[0].share ?? 45);
      setGstType(data[0].gstType ?? 'CGST/SGST');
      setGstRate(data[0].gstRate ?? 18);
    }
  };

  // New: Upload Excel and invoice data to backend
  // Check for duplicate invoices in backend
  const checkForDuplicates = async (invoicesToCheck: any[]) => {
    try {
      const fetchRes = await fetch('/api/proxy');
      if (fetchRes.ok) {
        const backendInvoices = await fetchRes.json();
        
        const duplicates = [];
        
        for (const newInvoice of invoicesToCheck) {
          for (const existingInvoice of backendInvoices) {
            // Compare EVERY SINGLE FIELD - only warn if ALL fields are exactly identical
            const isDuplicate = 
              // Basic invoice info
              newInvoice.clientName === existingInvoice.data?.clientName &&
              newInvoice.invoiceDate === existingInvoice.data?.invoiceDate &&
              newInvoice.dueDate === existingInvoice.data?.dueDate &&
              newInvoice["In_no"] === existingInvoice.data?.["In_no"] &&
              
              // Financial details
              newInvoice.totalAmount === existingInvoice.data?.totalAmount &&
              newInvoice.subTotal === existingInvoice.data?.subTotal &&
              newInvoice.gstAmount === existingInvoice.data?.gstAmount &&
              newInvoice.finalAmount === existingInvoice.data?.finalAmount &&
              
              // Share and GST
              newInvoice.share === existingInvoice.data?.share &&
              newInvoice.gstType === existingInvoice.data?.gstType &&
              newInvoice.gstRate === existingInvoice.data?.gstRate &&
              
              // Client details
              newInvoice.clientEmail === existingInvoice.data?.clientEmail &&
              newInvoice.clientPhone === existingInvoice.data?.clientPhone &&
              newInvoice.clientAddress === existingInvoice.data?.clientAddress &&
              
              // Other details
              newInvoice.paymentTerms === existingInvoice.data?.paymentTerms &&
              newInvoice.notes === existingInvoice.data?.notes &&
              
              // Table data - exact match including all table fields
              newInvoice.table?.length === existingInvoice.data?.table?.length &&
              JSON.stringify(newInvoice.table) === JSON.stringify(existingInvoice.data?.table) &&
              
              // Calculated totals - these must also match exactly
              newInvoice.totalShow === existingInvoice.data?.totalShow &&
              newInvoice.totalAud === existingInvoice.data?.totalAud &&
              newInvoice.totalCollection === existingInvoice.data?.totalCollection &&
              newInvoice.showTax === existingInvoice.data?.showTax &&
              newInvoice.otherDeduction === existingInvoice.data?.otherDeduction;
            
            if (isDuplicate) {
              duplicates.push({
                new: newInvoice,
                existing: existingInvoice
              });
            }
          }
        }
        
        return duplicates;
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
    }
    return [];
  };

  const uploadToBackend = async () => {
    if (!invoices.length) return;
    try {
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('invoiceData', JSON.stringify(invoices));
      
      const res = await fetch('/api/proxy?path=invoice-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload error:', errorText);
        throw new Error('Failed to upload invoice');
      }
      
      // After upload, fetch the latest invoices from backend
      const uploadResponse = await res.json();
      console.log('Upload response:', uploadResponse);
      
      // Check if upload was successful and contains invoiceIds
      if (!uploadResponse.invoiceIds || !Array.isArray(uploadResponse.invoiceIds)) {
        console.warn('Upload response missing invoiceIds:', uploadResponse);
        // Still mark as uploaded but show warning
        setHasUploaded(true);
        setShowPreview(true);
        setPreviewSource('frontend');
        return;
      }
      
      const fetchRes = await fetch('/api/proxy');
      if (fetchRes.ok) {
        const backendAll = await fetchRes.json();
        
        // Ensure backendAll is an array
        if (!Array.isArray(backendAll)) {
          console.warn('Backend response is not an array:', backendAll);
          setHasUploaded(true);
          setShowPreview(true);
          setPreviewSource('frontend');
          return;
        }
        
        const { invoiceIds } = uploadResponse;
        
        console.log('Filtering backend invoices with invoiceIds:', invoiceIds);
        console.log('Total backend invoices:', backendAll.length);
        
        const newBackendInvoices = backendAll.filter((inv: { data: any }) => {
          // ONLY use Excel "In_no" field for filtering
          const excelInNo = inv.data?.["In_no"];
          const shouldInclude = excelInNo && invoiceIds.includes(excelInNo);
          console.log(`Invoice ${excelInNo}: ${shouldInclude ? 'INCLUDED' : 'EXCLUDED'}`);
          return shouldInclude;
        });
        
        console.log('Filtered backend invoices:', newBackendInvoices);
        
        if (newBackendInvoices.length === 0) {
          console.warn('No matching invoices found in backend');
          setHasUploaded(true);
          setShowPreview(true);
          setPreviewSource('frontend');
          return;
        }
        
        setBackendInvoices(newBackendInvoices.map((inv: { data: any }) => ({
          ...inv.data,
          invoiceNo: inv.data?.["In_no"] || "", // ONLY use Excel "In_no" field
        })));
        setSelectedIdx(0);
        setShowPreview(true);
        setHasUploaded(true); // Mark as uploaded
        setPreviewSource('backend');
      } else {
        console.error('Failed to fetch backend invoices:', fetchRes.status);
        // Still mark as uploaded but show frontend preview
        setHasUploaded(true);
        setShowPreview(true);
        setPreviewSource('frontend');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Even if upload fails, show preview with frontend data
      console.log('Falling back to frontend preview due to upload error');
      setHasUploaded(false);
      setShowPreview(true);
      setPreviewSource('frontend');
      
      // Show user-friendly error message
      alert('Invoice upload failed, but you can still preview and download the invoice. Please try uploading again later.');
    }
  };

  const handlePreviewClick = async () => {
    // Check if data has already been uploaded
    if (hasUploaded) {
      setShowWarningDialog(true);
      return;
    }
    
    // Check for duplicate invoices in backend
    const duplicates = await checkForDuplicates(invoices);
    if (duplicates.length > 0) {
      setDuplicateInvoices(duplicates);
      setShowWarningDialog(true);
      return;
    }
    
    // Show preview immediately with frontend data
    setShowPreview(true);
    setPreviewSource('frontend');
    
    // Then upload to backend and update
    await uploadToBackend();
    setPreviewSource('backend');
  };

  // Handle warning dialog confirmation
  const handleWarningConfirm = async () => {
    setShowWarningDialog(false);
    
    // Show preview immediately with frontend data
    setShowPreview(true);
    setPreviewSource('frontend');
    
    // Then upload to backend and update
    await uploadToBackend();
    setPreviewSource('backend');
  };

  // Handle warning dialog cancel
  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setDuplicateInvoices([]);
  };

  // Download a single invoice as PDF
  const handleDownloadInvoice = async (inv: any, idx: number) => {
    try {
      const invoiceNo = inv["In_no"] || inv.invoiceNo || '';
      const filename = invoiceNo ? `Invoice_${invoiceNo}.pdf` : `Invoice_${Date.now()}_${idx}.pdf`;
      
      const { data } = await generateStandardizedPDF(
        <InvoicePreview data={inv} showDownloadButton={false} isPdfExport={true} />,
        filename
      );
      
      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`Invoice ${filename} downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };

  // Download all selected invoices
  // Function to generate PDF for ZIP using standardized generator
  const generatePDFForZip = async (invoice: any, index: number): Promise<{ filename: string, data: Uint8Array }> => {
    try {
      const invoiceNo = invoice["In_no"] || invoice.invoiceNo || '';
      const filename = invoiceNo ? `Invoice_${invoiceNo}.pdf` : `Invoice_${Date.now()}_${index}.pdf`;
      
      const { data } = await generateStandardizedPDF(
        <InvoicePreview data={invoice} showDownloadButton={false} isPdfExport={true} />,
        filename,
        { isZipGeneration: true }
      );
      
      return { filename, data };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const handleDownloadAll = async () => {
    try {
    const currentInvoices = previewSource === 'backend' ? backendInvoices : invoices;
      const selectedInvoicesData = selectedInvoices.map(idx => currentInvoices[idx]);
      
      if (selectedInvoicesData.length === 0) {
        alert('Please select at least one invoice to download.');
        return;
      }

      // Show loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 16px;
      `;
      loadingMsg.textContent = `Generating ${selectedInvoicesData.length} PDFs for ZIP...`;
      document.body.appendChild(loadingMsg);

      // Create ZIP file
      const zip = new JSZip();
      
      // Generate PDFs and add to ZIP
      for (let i = 0; i < selectedInvoicesData.length; i++) {
        const invoice = selectedInvoicesData[i];
        try {
          const { filename, data } = await generatePDFForZip(invoice, i);
          zip.file(filename, data);
          
          // Update loading message
          loadingMsg.textContent = `Generated ${i + 1}/${selectedInvoicesData.length} PDFs...`;
        } catch (error) {
          console.error(`Error generating PDF for invoice ${i + 1}:`, error);
        }
      }

      // Generate and download ZIP
      loadingMsg.textContent = 'Creating ZIP file...';
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 } // Balanced compression
      });
      
      // Download ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoices_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Remove loading message
      document.body.removeChild(loadingMsg);
      
      alert(`Successfully downloaded ${selectedInvoicesData.length} invoices as ZIP file!`);
    } catch (error) {
      console.error('ZIP generation error:', error);
      alert('Error generating ZIP file. Please try again.');
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInvoices(invoices.map((_, idx) => idx));
    } else {
      setSelectedInvoices([]);
    }
  };

  // Handle select one
  const handleSelectOne = (idx: number, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, idx]);
    } else {
      setSelectedInvoices(prev => prev.filter(i => i !== idx));
      setSelectAll(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="flex items-center justify-center px-8 py-0 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 shadow-md border-b" style={{ height: 72 }}>
        <h1 className="text-xl font-bold text-white text-center w-full">Invoice Creation</h1>
      </div>
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Invoice List */}
        <aside className="w-64 bg-gradient-to-b from-white via-orange-50 to-orange-100 border-r border-gray-200 flex flex-col rounded-tr-xl rounded-br-xl shadow-md">
          <div className="p-4 border-b font-bold text-lg text-orange-700 tracking-wide bg-white/80 rounded-tr-xl flex items-center gap-2">
            <input type="checkbox" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)} />
            <span>Invoice List</span>
          </div>
          <div className="flex flex-row items-center justify-between px-4 py-2">
            <div className="flex gap-2">
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1 rounded transition text-xs shadow"
              onClick={handleDownloadAll}
              disabled={selectedInvoices.length === 0}
            >
              Download All
            </button>
            </div>
            <span className="text-xs text-gray-500">{selectedInvoices.length} selected</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(previewSource === 'backend' && backendInvoices.length > 0 ? backendInvoices : invoices).length === 0 && (
              <div className="p-4 text-xs text-gray-400">No invoices loaded.</div>
            )}
            {(previewSource === 'backend' && backendInvoices.length > 0 ? backendInvoices : invoices).map((inv, idx) => (
              <div
                key={idx}
                className={`cursor-pointer px-4 py-3 border-b text-sm transition-all duration-150 rounded-md my-2 mx-2 font-medium shadow-sm ${selectedIdx === idx ? "bg-orange-200 font-bold text-orange-900 ring-2 ring-orange-400" : "hover:bg-orange-50 hover:shadow-md text-gray-800"}`}
                onClick={() => setSelectedIdx(idx)}
                style={{ boxShadow: selectedIdx === idx ? '0 2px 8px rgba(255,140,0,0.10)' : undefined }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(idx)}
                    onChange={e => { e.stopPropagation(); handleSelectOne(idx, e.target.checked); }}
                    onClick={e => e.stopPropagation()}
                  />
                                          <span>{inv["In_no"] || inv.invoiceNo || 'No Invoice Number'}</span>
                </div>
                <button
                  className="ml-2 bg-orange-500 hover:bg-orange-700 text-white font-bold px-2 py-1 rounded text-xs shadow"
                  onClick={e => { e.stopPropagation(); handleDownloadInvoice(inv, idx); }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </aside>
        {/* Center: Invoice Preview */}
        <section className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col items-center">
          {/* Invoice Preview */}
          {showPreview && invoices.length > 0 && (
            previewSource === 'backend' && backendInvoices.length > 0 ? (
              <InvoicePreview data={{
                ...backendInvoices[selectedIdx],
                
                invoiceNo: backendInvoices[selectedIdx]?.["In_no"] || backendInvoices[selectedIdx]?.invoiceNo || ""
              }} />
            ) : invoices.length > 0 ? (
              <InvoicePreview data={{
                ...invoices[selectedIdx],
                "In_no": invoices[selectedIdx]?.["In_no"] || invoices[selectedIdx]?.invoiceNo || "",
                invoiceNo: invoices[selectedIdx]?.["In_no"] || invoices[selectedIdx]?.invoiceNo || ""
              }} />
            ) : (
              <div className="text-gray-400 text-center w-full mt-24">Upload an Excel file to preview invoices.</div>
            )
          )}
          {!showPreview && (
            <div className="text-gray-400 text-center w-full mt-24">Upload an Excel file to preview invoices.</div>
          )}
        </section>
        {/* Right: InvoiceForm Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col items-center p-6">
          <InvoiceForm onChange={handleFormChange} onPreview={handlePreviewClick} />
        </aside>
      </main>
      
      {/* Warning Dialog for Duplicate Upload */}
      {showWarningDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Duplicate Invoice Warning</h3>
              </div>
            </div>
            <div className="mt-2">
              {hasUploaded ? (
                <>
                  <p className="text-sm text-gray-600">
                    This data has already been uploaded to the database. Creating duplicate invoices will:
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                    <li>Generate new invoice numbers</li>
                    <li>Create duplicate entries in the database</li>
                    <li>Increase the invoice counter</li>
                  </ul>
                </>
              ) : duplicateInvoices.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600">
                    Found {duplicateInvoices.length} invoice(s) with <strong>EVERY SINGLE FIELD IDENTICAL</strong> in the database:
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {duplicateInvoices.map((dup, idx) => (
                      <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-1">
                        <strong>Client:</strong> {dup.new.clientName} | 
                        <strong>Date:</strong> {dup.new.invoiceDate} | 
                        <strong>Amount:</strong> ₹{dup.new.totalAmount} | 
                        <strong>Share:</strong> {dup.new.share}% | 
                        <strong>GST:</strong> {dup.new.gstType} @ {dup.new.gstRate}% | 
                        <strong>Items:</strong> {dup.new.items?.length || 0}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    These invoices have <strong>EVERY SINGLE FIELD IDENTICAL</strong> to existing invoices. Creating them will generate new invoice numbers and create exact duplicate entries.
                  </p>
                </>
              ) : null}
              <p className="mt-3 text-sm font-medium text-gray-900">
                Do you want to proceed with uploading this data?
              </p>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleWarningCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWarningConfirm}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Proceed & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 text-white py-4 text-center shadow-md">
        <div className="text-center text-white text-sm py-2">
          Powered by{' '}
          <a 
            href="https://highflyersinfotech.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-orange-100 underline font-medium"
          >
            Highflyers Infotech
          </a>
        </div>
      </footer>
    </div>
  );
} 