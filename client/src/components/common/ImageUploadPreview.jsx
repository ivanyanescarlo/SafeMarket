import React, { useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';

/**
 * ImageUploadPreview Component
 * Supports:
 * 1. Direct device file uploads (desktop file picker, mobile gallery/camera, drag & drop)
 * 2. Instant live visual previews of all uploaded photos
 * 3. Reorder/Set cover photo, remove photos, photo counter
 */
export default function ImageUploadPreview({
  images = [],
  onChange,
  maxImages = 6,
  label = 'Product Photos',
  description = 'Upload up to 6 photos from your device. The first image will be your main cover photo.'
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef(null);

  // Filter out any blank strings
  const validImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string' && img.trim() !== '')
    : [];

  // Helper to resize large images via canvas before storing as base64
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Handle local file selection
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const availableSlots = maxImages - validImages.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum limit of ${maxImages} photos reached.`);
      return;
    }

    setProcessingFiles(true);
    setErrorMsg('');

    const filesToProcess = Array.from(fileList)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots);

    try {
      const newBase64Images = [];
      for (const file of filesToProcess) {
        const dataUrl = await compressImage(file);
        if (dataUrl) newBase64Images.push(dataUrl);
      }

      if (newBase64Images.length > 0) {
        onChange([...validImages, ...newBase64Images]);
      }
    } catch (err) {
      console.error('Error processing images:', err);
      setErrorMsg('Failed to process image file.');
    } finally {
      setProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove single image
  const handleRemove = (indexToRemove) => {
    const updated = validImages.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  // Make an image the cover photo (index 0)
  const handleMakeCover = (index) => {
    if (index === 0) return;
    const target = validImages[index];
    const remaining = validImages.filter((_, idx) => idx !== index);
    onChange([target, ...remaining]);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-safegreen-600" />
            <span>{label}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {validImages.length} / {maxImages} Photos
        </span>
      </div>

      {/* Upload & Dropzone Area */}
      {validImages.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragging
              ? 'border-safegreen-500 bg-safegreen-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-safegreen-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-safegreen-100 text-safegreen-700 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {processingFiles ? 'Processing photo...' : 'Upload photos from your device'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and drop your photos here, or click to browse files
              </p>
            </div>

            <button
              type="button"
              disabled={processingFiles}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 px-4 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Browse Photos</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VISUAL IMAGE PREVIEWS: "we can see the image we input" */}
      {validImages.length > 0 ? (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Uploaded Photos Preview ({validImages.length})
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {validImages.map((src, index) => {
              const isCover = index === 0;
              return (
                <div
                  key={`${src.slice(0, 30)}-${index}`}
                  className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-100 shadow-xs transition-all ${
                    isCover
                      ? 'border-safegreen-500 ring-2 ring-safegreen-100'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* Photo Preview */}
                  <div className="aspect-square w-full relative overflow-hidden bg-slate-900/5">
                    <img
                      src={src}
                      alt={`Product preview ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600';
                      }}
                    />

                    {/* Gradient Overlay for controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-90 transition-opacity" />

                    {/* Cover Photo Badge */}
                    {isCover ? (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-safegreen-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-white" />
                        <span>Cover Photo</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        title="Set as main cover photo"
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 hover:bg-safegreen-600 text-white text-[10px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>Set Cover</span>
                      </button>
                    )}

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      title="Remove this photo"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Photo Number */}
                    <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-center">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-500">
            No photos uploaded yet.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click Browse Photos above to upload pictures from your computer or phone.
          </p>
        </div>
      )}
    </div>
  );
}
