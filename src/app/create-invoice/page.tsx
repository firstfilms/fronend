"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  const [uploadError, setUploadError] = useState<string>('');
  const [bannerImage, setBannerImage] = useState<string>(""); // Banner image state
  const [signatureImage, setSignatureImage] = useState<string>(""); // Signature image state
  const [stampImage, setStampImage] = useState<string>(""); // Stamp image state
  const [logoImage, setLogoImage] = useState<string>(""); // Global logo image state
  const [headerType, setHeaderType] = useState<'logo' | 'banner'>("logo"); // Global header type state
  const [hideLogo, setHideLogo] = useState<boolean>(false);
  const [hideBanner, setHideBanner] = useState<boolean>(false);
  const [hideStamp, setHideStamp] = useState<boolean>(false);
  const [hideSignature, setHideSignature] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  // Handler to clear all uploaded images (logo, banner, signature, stamp)
  const clearImages = () => {
    setBannerImage('');
    setSignatureImage('');
    setStampImage('');
    setLogoImage('');
    setHideLogo(false);
    setHideBanner(false);
    setHideStamp(false);
    setHideSignature(false);
    // Update all invoices to remove image fields
    setInvoices(prev => prev.map(inv => ({
      ...inv,
      bannerImage: '',
      signatureImage: '',
      stampImage: '',
      logoImage: '',
      hideLogo: false,
      hideBanner: false,
      hideStamp: false,
      hideSignature: false,
    })));
  };
  
  // Global states for firm details to make edits dynamic and global
  const [firmName, setFirmName] = useState<string>("FIRST FILM STUDIOS LLP");
  const [address, setAddress] = useState<string>("1105, SRI KRISHNA BUILDING, FUN REPUBLIC LANE\nVEERA DESAI, ANDHERI WEST, MUMBAI - 400052, MAHARASHTRA");
  const [email, setEmail] = useState<string>("info@firstfilmstudios.com");
  const [gst, setGst] = useState<string>("27AAJFF7915J1Z1");
  const [pan, setPan] = useState<string>("AAJFF7915J");
  const [regNo, setRegNo] = useState<string>("ACH-2259");

  // New state for edit dropdown and terms
  const [editOption, setEditOption] = useState<string>("" as string);
  const [termsText, setTermsText] = useState<string>(
    `1. Payment is due within 14 days from the date invoice. Interest @18% pa. will be charged for payment delayed beyond that period.
2. All cheques / drafts should be crossed and made payable to
FIRST FILM STUDIOS LLP
Bank Detail: - HDFC BANK LIMITED A/C No.: 50200099601176 IFSC CODE: HDFC0000543
BRANCH: AHURA CENTRE, ANDHERI WEST
3. Subject to Mumbai jurisdiction`
  );
  const [signatoryText, setSignatoryText] = useState<string>("For FIRST FILM STUDIOS LLP");

  // Handler to receive invoices and share/gst from InvoiceForm
  const handleFormChange = (data: any[], isNewUpload: boolean = false, bannerImg?: string, signatureImg?: string, stampImg?: string) => {
    setInvoices(data || []);
    setSelectedIdx(0);
    
    // Update images if provided
    if (bannerImg !== undefined) {
      setBannerImage(bannerImg);
    }
    if (signatureImg !== undefined) {
      setSignatureImage(signatureImg);
    }
    if (stampImg !== undefined) {
      setStampImage(stampImg);
    }
    
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
      if (data[0].logoImage !== undefined) {
        setLogoImage(data[0].logoImage);
      }
      if (data[0].headerType !== undefined) {
        setHeaderType(data[0].headerType);
      }
    }
  };

  // Handler for banner image change
  const handleBannerImageChange = (bannerImg: string) => {
    setBannerImage(bannerImg);
    // Update all invoices with banner image
    setInvoices(prev => prev.map(inv => ({ ...inv, bannerImage: bannerImg })));
  };

  // Handler for signature image change
  const handleSignatureImageChange = (signatureImg: string) => {
    setSignatureImage(signatureImg);
    // Update all invoices with signature image
    setInvoices(prev => prev.map(inv => ({ ...inv, signatureImage: signatureImg })));
  };

  // Handler for stamp image change
  const handleStampImageChange = (stampImg: string) => {
  setStampImage(stampImg);
  // Update all invoices with stamp image
  setInvoices(prev => prev.map(inv => ({ ...inv, stampImage: stampImg })));
};

// Helper to upload images from file input and apply to the selected field
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'signature' | 'stamp') => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    if (type === 'banner') handleBannerImageChange(result);
    else if (type === 'signature') handleSignatureImageChange(result);
    else if (type === 'stamp') handleStampImageChange(result);
  };
  reader.readAsDataURL(file);
};

  // Helper to update a field of the currently selected invoice
  const updateSelectedInvoiceField = (field: string, value: any) => {
    setInvoices(prev => prev.map((inv, i) => (i === selectedIdx ? { ...inv, [field]: value } : inv)));
    setBackendInvoices(prev => prev.map((inv, i) => (i === selectedIdx ? { ...inv, [field]: value } : inv)));
  };

  // Build full invoice payload with global settings before saving
  const buildSavePayload = (inv: any) => {
    const invoiceNo = String(inv["In_no"] ?? inv.invoiceNo ?? '').trim();
    return {
      ...inv,
      "In_no": invoiceNo,
      invoiceNo,
      share: inv.share ?? share,
      gstType: inv.gstType ?? gstType,
      gstRate: inv.gstRate ?? gstRate,
      bannerImage: bannerImage || inv.bannerImage || '',
      signatureImage: signatureImage || inv.signatureImage || '',
      stampImage: stampImage || inv.stampImage || '',
      logoImage: logoImage || inv.logoImage || '',
      headerType: headerType || inv.headerType || 'logo',
      terms: termsText || inv.terms,
      signatory: signatoryText || inv.signatory,
      firmName,
      address,
      email,
      gst,
      pan,
      regNo,
      hideLogo,
      hideBanner,
      hideStamp,
      hideSignature,
    };
  };

  const getCurrentInvoiceList = () =>
    previewSource === 'backend' && backendInvoices.length > 0 ? backendInvoices : invoices;

  const refreshBackendInvoices = async (savedNumbers: string[]) => {
    const fetchRes = await fetch('/api/proxy');
    if (!fetchRes.ok) return;

    const backendAll = await fetchRes.json();
    if (!Array.isArray(backendAll)) return;

    const idsArray = savedNumbers.map(String);
    const newBackendInvoices = backendAll
      .filter((inv: { data: any }) => {
        const excelInNo = inv.data?.["In_no"] != null ? String(inv.data["In_no"]) : null;
        return excelInNo && idsArray.includes(excelInNo);
      })
      .map((inv: { data: any }) => ({
        ...inv.data,
        invoiceNo: inv.data?.["In_no"] || '',
      }));

    if (newBackendInvoices.length > 0) {
      setBackendInvoices(newBackendInvoices);
      setPreviewSource('backend');
    }
  };

  // Save invoices to backend (Excel file optional — used when saving preview / copies)
  const saveInvoicesToBackend = async (dataToSave: any[]) => {
    if (!dataToSave.length) {
      alert('No invoices to save. Upload an Excel file first.');
      return false;
    }

    const payload = dataToSave.map(buildSavePayload);
    const missingNo = payload.filter(inv => !inv["In_no"]);
    if (missingNo.length > 0) {
      alert('Some invoices are missing an invoice number (In_no). Please check your data.');
      return false;
    }

    setSaving(true);
    setSaveMessage('');
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('invoiceData', JSON.stringify(payload));

      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (file) formData.append('excel', file);

      const res = await fetch('/api/proxy?path=invoice-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to save invoice(s)');
      }

      const uploadResponse = await res.json();
      const savedNumbers: string[] = Array.isArray(uploadResponse.invoiceNumbers)
        ? uploadResponse.invoiceNumbers.map(String)
        : payload.map(inv => String(inv["In_no"]));

      if (uploadResponse.failedCount > 0) {
        setUploadError(`${uploadResponse.failedCount} invoice(s) could not be saved.`);
      }

      await refreshBackendInvoices(savedNumbers);
      setHasUploaded(true);
      setShowPreview(true);
      setSaveMessage(
        (uploadResponse.totalInvoices ?? savedNumbers.length) === 1
          ? 'Invoice saved.'
          : `${uploadResponse.totalInvoices ?? savedNumbers.length} invoices saved.`
      );
      return true;
    } catch (err) {
      console.error('Save error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save invoice(s)';
      setUploadError(message);
      alert(`Save failed: ${message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrent = async () => {
    const list = getCurrentInvoiceList();
    if (!list.length) {
      alert('No invoice to save.');
      return;
    }
    await saveInvoicesToBackend([list[selectedIdx]]);
  };

  const handleSaveAll = async () => {
    const list = getCurrentInvoiceList();
    if (!list.length) {
      alert('No invoices to save.');
      return;
    }
    await saveInvoicesToBackend(list);
  };

  // Upload Excel and invoice data to backend (used by Preview flow)
  const uploadToBackend = async (dataToUpload?: any[]) => saveInvoicesToBackend(dataToUpload ?? invoices);

  const checkForDuplicates = async (invoicesToCheck: any[]) => {
    try {
      const res = await fetch('/api/proxy');
      if (!res.ok) {
        console.error('Failed to fetch backend invoices for duplicate check');
        return [];
      }
      const backendAll = await res.json();
      if (!Array.isArray(backendAll)) return [];
      const duplicates: any[] = [];
      invoicesToCheck.forEach(newInv => {
        const newInNo = newInv["In_no"] || newInv.invoiceNo;
        if (!newInNo) return;
        const existing = backendAll.find((b: any) => String(b.data?.["In_no"]) === String(newInNo));
        if (existing) {
          duplicates.push({ new: newInv, existing: existing.data });
        }
      });
      return duplicates;
    } catch (err) {
      console.error('Error checking duplicates:', err);
      return [];
    }
  };

  const handlePreviewClick = async () => {
    if (!invoices.length) {
      alert('Please upload an Excel file first.');
      return;
    }

    if (hasUploaded) {
      setShowWarningDialog(true);
      return;
    }

    const duplicates = await checkForDuplicates(invoices);
    if (duplicates.length > 0) {
      setDuplicateInvoices(duplicates);
      setShowWarningDialog(true);
      return;
    }

    setShowPreview(true);
    setPreviewSource('frontend');
  };

  // Handle warning dialog confirmation
  const handleWarningConfirm = async () => {
    setShowWarningDialog(false);
    setShowPreview(true);
    setPreviewSource('frontend');
    await uploadToBackend();
  };

  // Handle warning dialog cancel
  // Handler for Cancel button – already defined earlier
  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setDuplicateInvoices([]);
  };

  // Handler: Remove duplicate invoices and upload the rest
  const handleSkipDuplicates = async () => {
    setShowWarningDialog(false);
    const filtered = invoices.filter(inv => {
      const invNo = inv["In_no"] || inv.invoiceNo;
      return !duplicateInvoices.some(dup => {
        const dupNo = dup.new["In_no"] || dup.new.invoiceNo;
        return dupNo && dupNo === invNo;
      });
    });
    setInvoices(filtered);
    setSelectedIdx(0);
    setShowPreview(true);
    setPreviewSource('frontend');
    if (filtered.length > 0) {
      await uploadToBackend(filtered);
    }
    setDuplicateInvoices([]);
  };

  // Handler: Create copies of duplicates with new invoice numbers
  const handleCreateCopy = async () => {
    setShowWarningDialog(false);
    const copies = duplicateInvoices.map(dup => {
      const copy = { ...dup.new };
      const origNo = copy["In_no"] || copy.invoiceNo || 'copy';
      copy["In_no"] = `${origNo}_copy`;
      copy.invoiceNo = copy["In_no"];
      return copy;
    });
    setBackendInvoices([]);
    setInvoices(copies);
    setSelectedIdx(0);
    setShowPreview(true);
    setPreviewSource('frontend');
    setHasUploaded(false);
    setDuplicateInvoices([]);
    setSaveMessage('Copy ready. Click Save or Save All.');
  };
  // Safe PDF filename — keep display In_no as-is, but / \ break file paths
  const toSafeFilename = (invoiceNo: string) =>
    String(invoiceNo).trim().replace(/[\/\\?%*:|"<>]/g, '-');

  // Download a single invoice as PDF
  const handleDownloadInvoice = async (inv: any, idx: number) => {
    try {
      const invoiceNo = inv["In_no"] || inv.invoiceNo || '';
      const filename = invoiceNo
        ? `Invoice_${toSafeFilename(invoiceNo)}.pdf`
        : `Invoice_${Date.now()}_${idx}.pdf`;
      
      const { data } = await generateStandardizedPDF(
        <InvoicePreview data={{
          ...inv,
          invoiceNo,
          bannerImage: bannerImage || inv.bannerImage || "",
          signatureImage: signatureImage || inv.signatureImage || "",
          stampImage: stampImage || inv.stampImage || "",
          logoImage: logoImage || inv.logoImage || "",
          headerType: headerType || inv.headerType || "logo",
          terms: termsText || inv.terms || undefined,
          signatory: signatoryText || inv.signatory || undefined,
          firmName,
          address,
          email,
          gst,
          pan,
          regNo,
          hideLogo,
          hideBanner,
          hideStamp,
          hideSignature,
        }} showDownloadButton={false} isPdfExport={true} />,
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
      const filename = invoiceNo
        ? `Invoice_${toSafeFilename(invoiceNo)}.pdf`
        : `Invoice_${Date.now()}_${index}.pdf`;
      
      const { data } = await generateStandardizedPDF(
        <InvoicePreview data={{
          ...invoice,
          invoiceNo,
          bannerImage: bannerImage || invoice.bannerImage || "",
          signatureImage: signatureImage || invoice.signatureImage || "",
          stampImage: stampImage || invoice.stampImage || "",
          logoImage: logoImage || invoice.logoImage || "",
          headerType: headerType || invoice.headerType || "logo",
          terms: termsText || invoice.terms || undefined,
          signatory: signatoryText || invoice.signatory || undefined,
          firmName,
          address,
          email,
          gst,
          pan,
          regNo,
          hideLogo,
          hideBanner,
          hideStamp,
          hideSignature,
        }} showDownloadButton={false} isPdfExport={true} />,
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
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 md:px-8 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 shadow-md border-b" style={{ height: 72 }}>
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>
        <h1 className="text-xl font-bold text-white text-center flex-1">Invoice Creation</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={saving || !getCurrentInvoiceList().length}
            className="bg-white text-orange-600 hover:bg-orange-50 disabled:bg-gray-200 disabled:text-gray-500 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || !getCurrentInvoiceList().length}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
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
                className={`cursor-pointer px-4 py-3 border-b text-sm transition-all duration-150 rounded-md my-2 mx-2 shadow-sm ${selectedIdx === idx ? "bg-orange-200 font-bold text-orange-900 ring-2 ring-orange-400" : "hover:bg-orange-50 hover:shadow-md text-gray-800"}`}
                onClick={() => setSelectedIdx(idx)}
                style={{ boxShadow: selectedIdx === idx ? '0 2px 8px rgba(255,140,0,0.10)' : undefined }}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 flex-shrink-0"
                    checked={selectedInvoices.includes(idx)}
                    onChange={e => { e.stopPropagation(); handleSelectOne(idx, e.target.checked); }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 font-normal">No:</span>
                      <span className="font-bold text-orange-800 truncate">{inv["In_no"] || inv.invoiceNo || '—'}</span>
                    </div>
                    {(inv.movieName || inv["Movie_Name"] || inv["movie_name"]) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-500 font-normal">Movie:</span>
                        <span className="text-xs text-gray-700 truncate">{inv.movieName || inv["Movie_Name"] || inv["movie_name"]}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="mt-2 w-full bg-orange-500 hover:bg-orange-700 text-white font-bold px-2 py-1 rounded text-xs shadow"
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
                invoiceNo: backendInvoices[selectedIdx]?.["In_no"] || backendInvoices[selectedIdx]?.invoiceNo || "",
                bannerImage: bannerImage || backendInvoices[selectedIdx]?.bannerImage || "",
                signatureImage: signatureImage || backendInvoices[selectedIdx]?.signatureImage || "",
                stampImage: stampImage || backendInvoices[selectedIdx]?.stampImage || "",
                logoImage: logoImage || backendInvoices[selectedIdx]?.logoImage || "",
                headerType: headerType || backendInvoices[selectedIdx]?.headerType || "logo",
                terms: termsText || undefined,
                signatory: signatoryText || undefined,
                firmName,
                address,
                email,
                gst,
                pan,
                regNo,
                hideLogo,
                hideBanner,
                hideStamp,
                hideSignature,
              }} />
            ) : invoices.length > 0 ? (
              <InvoicePreview data={{
                ...invoices[selectedIdx],
                "In_no": invoices[selectedIdx]?.["In_no"] || invoices[selectedIdx]?.invoiceNo || "",
                invoiceNo: invoices[selectedIdx]?.["In_no"] || invoices[selectedIdx]?.invoiceNo || "",
                bannerImage: bannerImage || invoices[selectedIdx]?.bannerImage || "",
                signatureImage: signatureImage || invoices[selectedIdx]?.signatureImage || "",
                stampImage: stampImage || invoices[selectedIdx]?.stampImage || "",
                logoImage: logoImage || invoices[selectedIdx]?.logoImage || "",
                headerType: headerType || invoices[selectedIdx]?.headerType || "logo",
                terms: termsText || undefined,
                signatory: signatoryText || undefined,
                firmName,
                address,
                email,
                gst,
                pan,
                regNo,
                hideLogo,
                hideBanner,
                hideStamp,
                hideSignature,
              }} />
            ) : (
              <div className="text-gray-400 text-center w-full mt-24">Upload an Excel file to preview invoices.</div>
            )
          )}
          {!showPreview && (
            <div className="text-gray-400 text-center w-full mt-24">Upload an Excel file to preview invoices.</div>
          )}
        </section>
        <aside className={styles.sidebar}>
          {/* Edit Details Dropdown at the top */}
          <div className="w-full mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-orange-700 mb-2">Edit Details</h3>
            <select
              value={editOption}
              onChange={e => setEditOption(e.target.value)}
              disabled={invoices.length === 0}
              className="w-full p-2 border rounded bg-white focus:outline-none text-black disabled:bg-gray-200 disabled:cursor-not-allowed font-semibold"
            >
              <option value="">Select field to edit</option>
              <option value="firmDetails">Firm Details</option>
              <option value="terms">Terms & Conditions</option>
              <option value="signatory">Signatory Text</option>
            </select>
            {editOption === 'firmDetails' && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Firm Name</label>
                  <input
                    type="text"
                    placeholder="FIRST FILM STUDIOS LLP"
                    value={firmName}
                    onChange={e => setFirmName(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Address</label>
                  <textarea
                    placeholder={`1105, SRI KRISHNA BUILDING, FUN REPUBLIC LANE\nVEERA DESAI, ANDHERI WEST, MUMBAI - 400052, MAHARASHTRA`}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Email</label>
                  <input
                    type="text"
                    placeholder="info@firstfilmstudios.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">GST Number</label>
                  <input
                    type="text"
                    placeholder="27AAJFF7915J1Z1"
                    value={gst}
                    onChange={e => setGst(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">PAN Number</label>
                  <input
                    type="text"
                    placeholder="AAJFF7915J"
                    value={pan}
                    onChange={e => setPan(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">LLP Reg. No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="Optional (e.g. ACH-2259)"
                    value={regNo}
                    onChange={e => setRegNo(e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  />
                </div>
              </div>
            )}
            {editOption === 'terms' && (
              <div className="mt-2">
                <label className="block text-xs font-semibold mb-1 text-gray-700">Terms & Conditions</label>
                <textarea
                  value={termsText}
                  onChange={e => setTermsText(e.target.value)}
                  placeholder="Enter terms and conditions..."
                  className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                  rows={6}
                />
              </div>
            )}
            {editOption === 'signatory' && (
              <div className="mt-2">
                <label className="block text-xs font-semibold mb-1 text-gray-700">Signatory Text</label>
                <input
                  type="text"
                  placeholder="For FIRST FILM STUDIOS LLP"
                  value={signatoryText}
                  onChange={e => setSignatoryText(e.target.value)}
                  className="w-full p-2 border rounded bg-white focus:outline-none text-black font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Text shown above signature (e.g. "For FIRST FILM STUDIOS LLP")
                </p>
              </div>
            )}
          </div>
          {/* Button to clear all uploaded images */}
          <button
            type="button"
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs mt-2"
            onClick={clearImages}
          >
            Clear All Images
          </button>

          <InvoiceForm
            onChange={handleFormChange}
            onPreview={handlePreviewClick}
            onBannerImageChange={handleBannerImageChange}
            onSignatureImageChange={handleSignatureImageChange}
            onStampImageChange={handleStampImageChange}
            hideLogo={hideLogo}
            setHideLogo={setHideLogo}
            hideBanner={hideBanner}
            setHideBanner={setHideBanner}
            hideStamp={hideStamp}
            setHideStamp={setHideStamp}
            hideSignature={hideSignature}
            setHideSignature={setHideSignature}
          />
        </aside>
      </main>
      
      {/* Upload Error Alert */}
      {uploadError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-md z-50">
          {uploadError}
        </div>
      )}

      {/* Toast — top right, below navbar */}
      {saveMessage && (
        <div
          className={`fixed top-[80px] right-6 z-50 flex items-center gap-3 min-w-[260px] max-w-sm rounded-xl border shadow-lg px-4 py-3 ${
            saveMessage.toLowerCase().includes('saved')
              ? 'bg-white border-green-200 shadow-green-100/50'
              : 'bg-white border-orange-200 shadow-orange-100/50'
          }`}
          role="status"
        >
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
              saveMessage.toLowerCase().includes('saved') ? 'bg-green-100' : 'bg-orange-100'
            }`}
          >
            {saveMessage.toLowerCase().includes('saved') ? (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-800 font-medium leading-snug pr-1">{saveMessage}</p>
        </div>
      )}

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
                  Do you want to replace the existing uploaded invoices?
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
                onClick={handleSkipDuplicates}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Remove Duplicates
              </button>
              <button
                onClick={handleWarningConfirm}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Replace
              </button>
              <button
                onClick={handleCreateCopy}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Copy (then Save)
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