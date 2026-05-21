'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

interface FileUploadProps {
  bucketName: string
  folderPath: string
  onUploadComplete: (urls: string[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  existingFiles?: string[]
  variant?: 'default' | 'icon'
}

export default function FileUpload({
  bucketName,
  folderPath,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = "image/jpeg, image/png, image/webp",
  existingFiles = [],
  variant = 'default'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<{ url: string; name: string }[]>(
    existingFiles.map(url => ({ url, name: url.split('/').pop() || 'file' }))
  )
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`لا يمكنك رفع أكثر من ${maxFiles} ملفات`)
      return
    }

    const invalidSize = selectedFiles.find(f => f.size > maxSizeMB * 1024 * 1024)
    if (invalidSize) {
      setError(`حجم الملف يجب أن لا يتجاوز ${maxSizeMB}MB`)
      return
    }

    setError('')
    setUploading(true)

    const newUrls: string[] = []
    
    for (const file of selectedFiles) {
      let fileToUpload = file

      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await imageCompression(file, {
            maxSizeMB: Math.min(maxSizeMB, 4.5),
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          })
        } catch (err) {
          console.error('Image compression error:', err)
          setError('حدث خطأ أثناء ضغط الصورة')
          setUploading(false)
          return
        }
      }

      const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileExt = fileToUpload.type === 'image/jpeg' ? 'jpg' 
                    : fileToUpload.type === 'image/png' ? 'png' 
                    : fileToUpload.type === 'image/webp' ? 'webp' 
                    : originalExt
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload)

      if (uploadError) {
        setError('حدث خطأ أثناء رفع بعض الملفات')
        console.error(uploadError)
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)
        
        newUrls.push(publicUrlData.publicUrl)
      }
    }

    const updatedFiles = [
      ...files,
      ...newUrls.map(url => ({ url, name: url.split('/').pop() || 'file' }))
    ]
    setFiles(updatedFiles)
    onUploadComplete(updatedFiles.map(f => f.url))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, i) => i !== indexToRemove)
    setFiles(updatedFiles)
    onUploadComplete(updatedFiles.map(f => f.url))
  }

  return (
    <div className="w-full">
      {variant === 'default' && (
        <div className="flex flex-wrap gap-3 mb-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-sm border border-emerald-100">
              <span className="truncate max-w-[150px] font-medium" dir="ltr">{file.name}</span>
              <button 
                type="button" 
                onClick={() => removeFile(idx)}
                className="text-emerald-400 hover:text-emerald-600 transition-colors bg-white w-5 h-5 rounded-full flex items-center justify-center font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < maxFiles && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept={accept}
            className="hidden"
            id={`file-upload-${folderPath.replace(/\//g, '-')}`}
          />
          <label
            htmlFor={`file-upload-${folderPath.replace(/\//g, '-')}`}
            className={variant === 'default' 
              ? "cursor-pointer flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
              : "cursor-pointer flex items-center justify-center w-11 h-11 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-emerald-600 transition-colors flex-shrink-0"
            }
          >
            {uploading ? (
              variant === 'default' ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium py-2">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  جارٍ الرفع...
                </div>
              ) : (
                <svg className="animate-spin text-emerald-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )
            ) : (
              variant === 'default' ? (
                <div className="flex items-center gap-3 text-gray-500 group-hover:text-emerald-600 py-1">
                  <span className="text-xl">📎</span>
                  <span className="text-sm font-medium">اضغط لإرفاق ملفات (حتى {maxSizeMB}MB)</span>
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              )
            )}
          </label>
        </div>
      )}
      
      {error && <p className={`text-red-500 text-xs font-medium ${variant === 'icon' ? 'absolute bottom-14 left-4 bg-white p-2 rounded shadow-lg border border-red-100' : 'mt-2'}`}>{error}</p>}
    </div>
  )
}
