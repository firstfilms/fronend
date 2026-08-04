import React, { useState } from "react";
import * as XLSX from "xlsx";

const GST_RATE = 0.18; // 18%
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

interface InvoiceRow {
  [key: string]: string | number | boolean | { [key: string]: string | number }[] | undefined;
}

interface InvoiceFormProps {
  onChange?: (invoices: InvoiceRow[], isNewUpload?: boolean, bannerImage?: string, signatureImage?: string, stampImage?: string) => void;
  onPreview?: () => void;
  onBannerImageChange?: (bannerImage: string) => void;
  onSignatureImageChange?: (signatureImage: string) => void;
  onStampImageChange?: (stampImage: string) => void;
  hideLogo: boolean;
  setHideLogo: (hide: boolean) => void;
  hideBanner: boolean;
  setHideBanner: (hide: boolean) => void;
  hideStamp: boolean;
  setHideStamp: (hide: boolean) => void;
  hideSignature: boolean;
  setHideSignature: (hide: boolean) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  onChange, 
  onPreview, 
  onBannerImageChange, 
  onSignatureImageChange, 
  onStampImageChange,
  hideLogo,
  setHideLogo,
  hideBanner,
  setHideBanner,
  hideStamp,
  setHideStamp,
  hideSignature,
  setHideSignature
}) => {
  const [share, setShare] = useState<number>(45); // default 45%
  const [gstType, setGstType] = useState<'IGST' | 'CGST/SGST'>('CGST/SGST');
  const [gstRate, setGstRate] = useState<number>(18); // default 18%
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [bannerImage, setBannerImage] = useState<string>(""); // Banner image as base64 or blob URL
  const [signatureImage, setSignatureImage] = useState<string>(""); // Signature image as base64 or blob URL
  const [stampImage, setStampImage] = useState<string>(""); // Stamp image as base64 or blob URL
  const [logoImage, setLogoImage] = useState<string>(""); // Custom Logo Image state
  const [headerType, setHeaderType] = useState<'logo' | 'banner'>("logo"); // Header type ('logo' | 'banner')
  
  // Manual input fields
  const [movieName, setMovieName] = useState<string>("");
  const [movieVersion, setMovieVersion] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [screenFormat, setScreenFormat] = useState<string>("");
  const [releaseWeek, setReleaseWeek] = useState<string>("");
  const [cinemaWeek, setCinemaWeek] = useState<string>("");
  const [screeningDateFrom, setScreeningDateFrom] = useState<string>("");
  const [screeningDateTo, setScreeningDateTo] = useState<string>("");

  // Helper function to upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File, imageType: 'banner' | 'signature' | 'stamp'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imageType', imageType);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url; // Return Cloudinary URL
  };

  // Helper to construct mapped invoices with all settings
  const getMergedInvoices = (updatedFields: Record<string, any> = {}, customInvoices?: InvoiceRow[]) => {
    const list = customInvoices || invoices;
    return list.map(inv => ({
      ...inv,
      share,
      gstType,
      gstRate,
      bannerImage,
      signatureImage,
      stampImage,
      logoImage,
      headerType,
      hideLogo,
      hideBanner,
      hideStamp,
      hideSignature,
      ...updatedFields
    }));
  };

  // Handle banner image upload
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    try {
      setError('');
      const tempPreview = URL.createObjectURL(file);
      setBannerImage(tempPreview);
      
      const cloudinaryUrl = await uploadImageToCloudinary(file, 'banner');
      setBannerImage(cloudinaryUrl);
      onBannerImageChange && onBannerImageChange(cloudinaryUrl);
      onChange && onChange(getMergedInvoices({ bannerImage: cloudinaryUrl }), false);
      URL.revokeObjectURL(tempPreview);
    } catch (error: any) {
      setError(error.message || 'Error uploading banner image');
      setBannerImage('');
    }
  };

  // Handle logo image upload
  const handleLogoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    try {
      setError('');
      const tempPreview = URL.createObjectURL(file);
      setLogoImage(tempPreview);
      
      const cloudinaryUrl = await uploadImageToCloudinary(file, 'stamp');
      setLogoImage(cloudinaryUrl);
      onChange && onChange(getMergedInvoices({ logoImage: cloudinaryUrl }), false);
      URL.revokeObjectURL(tempPreview);
    } catch (error: any) {
      setError(error.message || 'Error uploading logo image');
      setLogoImage('');
    }
  };

  // Handle signature image upload
  const handleSignatureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    try {
      setError('');
      const tempPreview = URL.createObjectURL(file);
      setSignatureImage(tempPreview);
      
      const cloudinaryUrl = await uploadImageToCloudinary(file, 'signature');
      setSignatureImage(cloudinaryUrl);
      onSignatureImageChange && onSignatureImageChange(cloudinaryUrl);
      onChange && onChange(getMergedInvoices({ signatureImage: cloudinaryUrl }), false);
      URL.revokeObjectURL(tempPreview);
    } catch (error: any) {
      setError(error.message || 'Error uploading signature image');
      setSignatureImage('');
    }
  };

  // Handle stamp image upload
  const handleStampImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    try {
      setError('');
      const tempPreview = URL.createObjectURL(file);
      setStampImage(tempPreview);
      
      const cloudinaryUrl = await uploadImageToCloudinary(file, 'stamp');
      setStampImage(cloudinaryUrl);
      onStampImageChange && onStampImageChange(cloudinaryUrl);
      onChange && onChange(getMergedInvoices({ stampImage: cloudinaryUrl }), false);
      URL.revokeObjectURL(tempPreview);
    } catch (error: any) {
      setError(error.message || 'Error uploading stamp image');
      setStampImage('');
    }
  };

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setShare(val);
    onChange && onChange(getMergedInvoices({ share: val }), false);
  };
  
  const handleGstTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'IGST' | 'CGST/SGST';
    setGstType(val);
    onChange && onChange(getMergedInvoices({ gstType: val }), false);
  };
  
  const handleGstRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setGstRate(val);
    onChange && onChange(getMergedInvoices({ gstRate: val }), false);
  };

  // Handle manual input field changes
  const handleManualFieldChange = (field: string, value: any) => {
  // Update all invoices with the new field value
  const updatedInvoices = invoices.map(inv => ({ ...inv, [field]: value }));
  setInvoices(updatedInvoices);
  // Propagate changes up to parent via onChange
  onChange && onChange(updatedInvoices, false);
};

  // Parse Excel numbers that may include commas / currency (e.g. "31,104.73")
  const parseExcelNumber = (value: unknown): number => {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = parseFloat(String(value).replace(/,/g, '').replace(/[₹Rs\s]/gi, '').trim());
    return Number.isFinite(n) ? n : 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file ? file.name : "");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target) return;
      const data = new Uint8Array(evt.target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // raw:false keeps display text (invoice nos like 2026-27/03, and formatted amounts)
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "", raw: false });
      if (!rows.length) {
        setError("No data found in Excel file.");
        return;
      }
      
      // Clean up column names by trimming whitespace to prevent issues with trailing spaces
      const cleanedRows = rows.map(row => {
        const cleanedRow: Record<string, any> = {};
        Object.keys(row).forEach(key => {
          const cleanedKey = key.trim();
          cleanedRow[cleanedKey] = row[key];
        });
        return cleanedRow;
      });
      
      // Use cleaned rows for processing
      const processedRows = cleanedRows;
      // For each row, build invoice object with table array and summary fields
      const processed = processedRows.map((row) => {
        // Invoice-level fields (map Excel columns to expected keys)
        const today = new Date();
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const todayStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
        
        // Extract invoice number from Excel - Try multiple possible column names
        let excelInvoiceNo: string | number = "";
        
        // Try exact matches first
        if (row["In_no"] != null && row["In_no"] !== '') excelInvoiceNo = row["In_no"];
        else if (row["In_no "] != null && row["In_no "] !== '') excelInvoiceNo = row["In_no "];
        else if (row["In_no  "] != null && row["In_no  "] !== '') excelInvoiceNo = row["In_no  "];
        // Try common variations
        else if (row["Inv_no"] != null && row["Inv_no"] !== '') excelInvoiceNo = row["Inv_no"];
        else if (row["Inv No"] != null && row["Inv No"] !== '') excelInvoiceNo = row["Inv No"];
        else if (row["Invoice No"] != null && row["Invoice No"] !== '') excelInvoiceNo = row["Invoice No"];
        else if (row["Invoice No."] != null && row["Invoice No."] !== '') excelInvoiceNo = row["Invoice No."];
        else if (row["Invoice Number"] != null && row["Invoice Number"] !== '') excelInvoiceNo = row["Invoice Number"];
        // Try to find any column that might contain invoice numbers
        // Allow formats like 2026-27/03 (slash, hyphen, dots, underscore)
        else {
          const allColumns = Object.keys(row);
          for (const col of allColumns) {
            const value = row[col];
            if (value != null && value !== '') {
              const trimmedValue = String(value).trim();
              if (/^[A-Za-z0-9][A-Za-z0-9\-\/\._]*$/.test(trimmedValue) && trimmedValue.length >= 2) {
                excelInvoiceNo = trimmedValue;
                console.log('Found invoice number in column:', col, 'with value:', trimmedValue);
                break;
              }
            }
          }
        }

        // Keep invoice number exactly as given (e.g. 2026-27/03) — never strip / or -
        const invoiceNoStr = excelInvoiceNo !== '' && excelInvoiceNo != null
          ? String(excelInvoiceNo).trim()
          : '';
        
        if (!invoiceNoStr) {
          console.warn('No invoice number found in Excel data. Available columns:', Object.keys(row));
          console.log('Row data:', row);
        } else {
          console.log('Excel invoice number found:', invoiceNoStr);
        }

        // Normalize invoice date from Excel (Date object, serial, or string) to DD/MM/YYYY
        const formatToDdMmYyyy = (raw: unknown): string => {
          if (raw == null || raw === '') return todayStr;
          if (raw instanceof Date && !isNaN(raw.getTime())) {
            return `${pad(raw.getDate())}/${pad(raw.getMonth() + 1)}/${raw.getFullYear()}`;
          }
          if (typeof raw === 'number' && Number.isFinite(raw)) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const d = new Date(excelEpoch.getTime() + raw * 86400000);
            if (!isNaN(d.getTime())) {
              return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
            }
          }
          const s = String(raw).trim();
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
          const parsed = new Date(s);
          if (!isNaN(parsed.getTime())) {
            return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
          }
          return todayStr;
        };
        
        // Build invoice fields - Excel data for non-user fields, blank for user input fields
        const invoiceFields = {
          clientName: row["BILL TO"] || "",
          clientAddress: row["ADDRESS"] || "",
          panNo: row["PAN NO."] || "",
          gstinNo: row["GST NUMBER"] || "",
          property: row["CINEMA NAME"] || "",
          centre: row["CENTRE"] || "",
          placeOfService: row["PLACE OF SERVICE"] || "",
          businessTerritory: row["CIRCUIT"] || "",
          invoiceNo: invoiceNoStr,
          "In_no": invoiceNoStr,
          invoiceDate: formatToDdMmYyyy(row["Invoice Date"] ?? row["INVOICE DATE"]),
          // User input fields - these will be filled by user on the page
          movieName: movieName || "", // Use user input or blank
          movieVersion: movieVersion || "", // Use user input or blank
          language: language || "", // Use user input or blank
          screenFormat: screenFormat || "", // Use user input or blank
          releaseWeek: releaseWeek || "", // Use user input or blank
          cinemaWeek: cinemaWeek || "", // Use user input or blank
          screeningFrom: screeningDateFrom || row["Screening Date From"] || row["Screening Date"] || row["SCREENING DATE"] || row["Screening Start Date"] || row["SCREENING START DATE"] || row["H"] || "",
          screeningTo: screeningDateTo || row["Screening Date To"] || row["Screening End Date"] || row["SCREENING END DATE"] || row["I"] || "",
          hsnSacCode: row["HSN/SAC Code"] || row["HSN/SAC CODE"] || "997332", // Default HSN code
          description: row["Description"] || row["DESCRIPTION"] || "Theatrical Exhibition Rights", // Default description
        };
        // Build table array for all date columns dynamically
        const table: { date: string; show: number; aud: number; collection: number; deduction: string; deductionAmt: number }[] = [];
        let totalShow = 0, totalAud = 0, totalCollection = 0;
        // Find dates from SHOW / AUDIENCE / COLLECTION columns (e.g. "22-05 COLLECTION")
        const dateColRegex = /^([0-9]{1,2}-[0-9]{2})\s+(SHOW|AUDIENCE|AUDIEN|COLLECTION|COLLECT)$/i;
        const dateColumns = Array.from(new Set(
          Object.keys(row)
            .map((key) => {
              const match = key.match(dateColRegex);
              return match ? match[1] : null;
            })
            .filter((date): date is string => !!date)
        ));
        // For each found date, build the row
        dateColumns.forEach((date) => {
          const show = parseExcelNumber(row[`${date} SHOW`]);
          const aud =
            parseExcelNumber(row[`${date} AUDIENCE`]) ||
            parseExcelNumber(row[`${date} AUDIEN`]);
          const collection =
            parseExcelNumber(row[`${date} COLLECTION`]) ||
            parseExcelNumber(row[`${date} COLLECT`]);
          
          // Convert date format from DD-MM to DD/MM/YYYY using current year
          const [day, month] = date.split('-');
          const year = new Date().getFullYear();
          const formattedDate = `${day}/${month}/${year}`;
          
          if (show || aud || collection) {
            table.push({
              date: formattedDate,
              show,
              aud,
              collection,
              deduction: '',
              deductionAmt: 0,
            });
          }
          totalShow += show;
          totalAud += aud;
          totalCollection += collection;
        });
        // Summary fields
        const totalShowVal = parseExcelNumber(row["TOTAL SHOW"]) || totalShow;
        const totalAudVal = parseExcelNumber(row["TOTAL AUDIENCE"]) || totalAud;
        const totalCollectionVal = parseExcelNumber(row["TOTAL COLLECTION"]) || totalCollection;
        const showTax = parseExcelNumber(row["SHOW TAX"]);
        const otherDeduction = parseExcelNumber(row["OTHERS"]);
        const finalInvoice = {
          ...invoiceFields, // Use the new invoiceFields object
          table,
          totalShow: totalShowVal,
          totalAud: totalAudVal,
          totalCollection: totalCollectionVal,
          showTax: showTax,
          otherDeduction: otherDeduction,
          // Add user input values
          gstType: gstType || "CGST/SGST",
          gstRate: gstRate || 18,
          share: share || 45
        };
        
        return finalInvoice;
      });
      setInvoices(processed);
      setError("");
      
      // Pass share, gstType, gstRate, bannerImage, signatureImage, stampImage to parent for preview
      const processedWithShare = processed.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage, logoImage, headerType }));
      onChange && onChange(processedWithShare, true); // true = new upload
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoices.length) {
      setError("Please upload a valid Excel file.");
      return;
    }
    onChange && onChange(getMergedInvoices(), undefined);
    if (onPreview) onPreview();
  };

  return (
    <form className="space-y-4 text-gray-800 w-full max-w-xs bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold mb-4">Upload the file and set GST & Share</h2>
      
      {/* Header Configuration Upload Section */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-purple-600 font-bold">Header Configuration</h3>
        
        {/* Toggle option for Banner vs Logo */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-gray-700">Header Style</label>
          <div className="flex gap-4">
            <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="headerType"
                value="logo"
                checked={headerType === 'logo'}
                onChange={() => {
                  setHeaderType('logo');
                  onChange && onChange(getMergedInvoices({ headerType: 'logo' }), false);
                }}
                className="mr-1.5"
              />
              Logo & Firm Details
            </label>
            <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="headerType"
                value="banner"
                checked={headerType === 'banner'}
                onChange={() => {
                  setHeaderType('banner');
                  onChange && onChange(getMergedInvoices({ headerType: 'banner' }), false);
                }}
                className="mr-1.5"
              />
              Full Banner Image
            </label>
          </div>
        </div>

        {headerType === 'banner' ? (
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">Invoice Header Banner (800px × 150px)</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerImageUpload}
                id="banner-upload"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded shadow text-xs font-semibold flex-1"
                >
                  Upload Banner
                </button>
                <button
                  type="button"
                  onClick={() => setHideBanner(!hideBanner)}
                  className={`px-3 py-1 rounded shadow text-xs font-semibold flex-1 transition-colors ${
                    hideBanner 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {hideBanner ? "Show Banner" : "Hide Banner"}
                </button>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                Recommended: 800px × 150px. Aligned to the left. If uploading a square logo image, choose "Logo & Firm Details" header style above.
              </span>
              {bannerImage && (
                <div className="mt-2">
                  <img 
                    src={bannerImage} 
                    alt="Banner Preview" 
                    className="w-full max-h-24 object-contain border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImage("");
                      onBannerImageChange && onBannerImageChange("");
                      onChange && onChange(getMergedInvoices({ bannerImage: "" }), false);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1 font-semibold block"
                  >
                    Remove Banner
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">Custom Firm Logo (e.g. 120px wide)</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoImageUpload}
                id="logo-upload"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded shadow text-xs font-semibold flex-1"
                >
                  Upload Logo
                </button>
                <button
                  type="button"
                  onClick={() => setHideLogo(!hideLogo)}
                  className={`px-3 py-1 rounded shadow text-xs font-semibold flex-1 transition-colors ${
                    hideLogo 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {hideLogo ? "Show Logo" : "Hide Logo"}
                </button>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                Recommended width: 120px. Replaces the default logo on the left; other firm text details remain on the right.
              </span>
              {logoImage && (
                <div className="mt-2">
                  <img 
                    src={logoImage} 
                    alt="Logo Preview" 
                    className="w-24 max-h-24 object-contain border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoImage("");
                      onChange && onChange(getMergedInvoices({ logoImage: "" }), false);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1 font-semibold block"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signature Image Upload Section */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-green-600">Signature Image</h3>
        <div>
          <label className="block text-xs font-semibold mb-1">Signature (120px × 60px)</label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureImageUpload}
              id="signature-upload"
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('signature-upload')?.click()}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow text-xs flex-1"
              >
                Upload Signature
              </button>
              <button
                type="button"
                onClick={() => setHideSignature(!hideSignature)}
                className={`px-3 py-1 rounded shadow text-xs font-semibold flex-1 transition-colors ${
                  hideSignature 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                {hideSignature ? "Show Signature" : "Hide Signature"}
              </button>
            </div>
            {signatureImage && (
              <div className="mt-2">
                <img 
                  src={signatureImage} 
                  alt="Signature Preview" 
                  className="w-full max-h-16 object-contain border border-gray-300 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSignatureImage("");
                    onSignatureImageChange && onSignatureImageChange("");
                    onChange && onChange(getMergedInvoices({ signatureImage: "" }), false);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stamp Image Upload Section */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-blue-600">Stamp Image</h3>
        <div>
          <label className="block text-xs font-semibold mb-1">Stamp (110px × 100px)</label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleStampImageUpload}
              id="stamp-upload"
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('stamp-upload')?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow text-xs flex-1"
              >
                Upload Stamp
              </button>
              <button
                type="button"
                onClick={() => setHideStamp(!hideStamp)}
                className={`px-3 py-1 rounded shadow text-xs font-semibold flex-1 transition-colors ${
                  hideStamp 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                {hideStamp ? "Show Stamp" : "Hide Stamp"}
              </button>
            </div>
            {stampImage && (
              <div className="mt-2">
                <img 
                  src={stampImage} 
                  alt="Stamp Preview" 
                  className="w-full max-h-20 object-contain border border-gray-300 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStampImage("");
                    onStampImageChange && onStampImageChange("");
                    onChange && onChange(getMergedInvoices({ stampImage: "" }), false);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excel Upload Section */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-blue-600">Excel Upload</h3>
        <div>
          <label className="block text-xs font-semibold mb-1">Excel File</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              id="excel-upload"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById('excel-upload')?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow"
            >
              Select File
            </button>
            <span className="text-xs text-gray-600 truncate max-w-[120px]">{selectedFileName || "No file chosen"}</span>
          </div>
        </div>
      </div>

      {/* Preview Button - moved here */}
      <div className="border-t pt-4">
        <button 
          type="button" 
          onClick={onPreview}
          disabled={!invoices.length}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded w-full font-semibold transition-colors"
        >
          Preview Invoices
        </button>
      </div>

      {/* Manual Input Fields Section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3 text-orange-600">Manual Input Fields</h3>
        <p className="text-xs text-gray-500 mb-3">Changes update the preview in real-time as you type</p>
        
        {/* User Input Fields - These will be blank and user will fill them */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Movie Name</label>
            <input
              type="text"
              value={movieName}
              onChange={(e) => {
                const value = e.target.value;
                setMovieName(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, movieName: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="Enter movie name"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Movie Version</label>
            <select
              value={movieVersion}
              onChange={(e) => {
                const value = e.target.value;
                setMovieVersion(value);
                // Update preview immediately on every change
                const updateInvoices = invoices.map(inv => ({ ...inv, movieVersion: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              required
            >
              <option value="">Select version</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="4DX">4DX</option>
              <option value="IMAX">IMAX</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => {
                const value = e.target.value;
                setLanguage(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, language: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., Hindi, English, Tamil"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Screen Format</label>
            <input
              type="text"
              value={screenFormat}
              onChange={(e) => {
                const value = e.target.value;
                setScreenFormat(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, screenFormat: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., 1, 2, 3"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Release Week</label>
            <input
              type="text"
              value={releaseWeek}
              onChange={(e) => {
                const value = e.target.value;
                setReleaseWeek(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, releaseWeek: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., 1, 2, 3"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Cinema Week</label>
            <input
              type="text"
              value={cinemaWeek}
              onChange={(e) => {
                const value = e.target.value;
                setCinemaWeek(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, cinemaWeek: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., 1, 2, 3"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Screening Date From</label>
            <input
              type="date"
              value={screeningDateFrom}
              onChange={(e) => {
                const value = e.target.value;
                setScreeningDateFrom(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({
                  ...inv,
                  screeningDateFrom: value,
                  screeningFrom: value,
                }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="DD/MM/YYYY"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Screening Date To</label>
            <input
              type="date"
              value={screeningDateTo}
              onChange={(e) => {
                const value = e.target.value;
                setScreeningDateTo(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({
                  ...inv,
                  screeningDateTo: value,
                  screeningTo: value,
                }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate, bannerImage, signatureImage, stampImage })), false, bannerImage, signatureImage, stampImage);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>
        
        {/* GST and Share Settings */}
        <div className="space-y-3 mt-4">
          <h4 className="text-xs font-semibold text-blue-600">GST & Share Settings</h4>
          <p className="text-xs text-gray-500 mb-2">Changes update the preview in real-time</p>
          <div>
            <label className="block text-xs font-semibold mb-1">GST Type</label>
            <select
              value={gstType}
              onChange={(e) => {
                const value = e.target.value as "CGST/SGST" | "IGST";
                setGstType(value);
                // Update preview immediately on every change
                const updateInvoices = invoices.map(inv => ({ ...inv, gstType: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType: value, gstRate })), false);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              required
            >
              <option value="">Select GST type</option>
              <option value="CGST/SGST">CGST/SGST</option>
              <option value="IGST">IGST</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">GST Rate (%)</label>
            <input
              type="number"
              value={gstRate}
              onChange={(e) => {
                const value = Number(e.target.value);
                setGstRate(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, gstRate: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share, gstType, gstRate: value })), false);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., 18"
              min="0"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1">Share (%)</label>
            <input
              type="number"
              value={share}
              onChange={(e) => {
                const value = Number(e.target.value);
                setShare(value);
                // Update preview immediately on every keystroke
                const updateInvoices = invoices.map(inv => ({ ...inv, share: value }));
                setInvoices(updateInvoices);
                onChange && onChange(updateInvoices.map(inv => ({ ...inv, share: value, gstType, gstRate })), false);
              }}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="e.g., 45"
              min="0"
              max="100"
              required
            />
          </div>
        </div>
      </div>


      
      {error && <div className="text-red-500 text-xs">{error}</div>}
    </form>
  );
};

export default InvoiceForm; 