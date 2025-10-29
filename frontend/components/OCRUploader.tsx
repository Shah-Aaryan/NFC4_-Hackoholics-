"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useHealthcare } from "@/context/healthcare-context"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Upload,
  FileText,
  Camera,
  Check,
  X,
  Loader2,
} from "lucide-react"

interface OCRResult {
  id: string
  image_url: string
  ocr_text: string
  extracted_medications: Array<{
    name: string
    dosage: string
    frequency: string
  }>
  confidence: number
}

interface OCRUploaderProps {
  onClose: () => void
  onUploadComplete: (result: OCRResult) => void
}

export function OCRUploader({ onClose, onUploadComplete }: OCRUploaderProps) {
  const { uploadPrescription, processPrescriptionWithGemini } = useHealthcare()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [uploadedPrescriptionId, setUploadedPrescriptionId] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter((file) =>
        file.type.startsWith("image/")
      )
      if (imageFiles.length > 0) {
        handleFileSelect(imageFiles[0])
      }
    },
    [handleFileSelect]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)

      const token = localStorage.getItem("accessToken") || ""

      // Step 1: Upload prescription
      const uploadRes = await fetch("https://nfc4-hackoholics.onrender.com/api/v1/prescriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

      const { prescription } = uploadData

      // Step 2: Process OCR and extract medications
      const processRes = await fetch(
        `https://nfc4-hackoholics.onrender.com/api/v1/prescriptions/${prescription._id}/process`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const processData = await processRes.json()
      if (!processRes.ok) throw new Error(processData.error || "Processing failed")

      const meds = processData.prescription.extracted_medications || []

      // Combine results
      const finalOCRResult: OCRResult = {
        id: prescription._id,
        image_url: prescription.image_url,
        ocr_text: prescription.ocr_text || uploadData.ocrResult?.text || "",
        extracted_medications: meds,
        confidence: 0.95, // Optional: estimate or get from backend
      }

      setOcrResult(finalOCRResult)
    } catch (error) {
      console.error("OCR processing failed:", error)
      alert("OCR processing failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComplete = () => {
    if (ocrResult) {
      onUploadComplete(ocrResult)
    }
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-teal-600" />
            Prescription OCR Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedFile && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Upload Prescription Image</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your prescription image here, or click to browse
              </p>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload">
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <span>Choose File</span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">Supports: JPG, PNG, GIF (max 10MB)</p>
            </div>
          )}

          {selectedFile && !ocrResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Image Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={previewUrl! || "/placeholder.svg"}
                    alt="Prescription preview"
                    className="w-full h-64 object-contain border rounded-lg bg-background"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>File: {selectedFile.name}</span>
                    <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </CardContent>
              </Card>

              {/* OCR Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">OCR Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>The AI will extract:</p>
                    <ul className="list-disc list-inside">
                      <li>Medication names and dosages</li>
                      <li>Frequencies and instructions</li>
                      <li>Doctor & patient information</li>
                    </ul>
                    {isProcessing ? (
                      <div className="text-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-3" />
                        <p>Processing prescription image...</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={processImage} className="flex-1 bg-teal-600 hover:bg-teal-700">
                          <FileText className="mr-2 h-4 w-4" />
                          Process Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {ocrResult && (
            <div className="space-y-6">
              {/* OCR Result */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">OCR Results</h3>
                <Badge className="bg-green-100 text-green-800">
                  {Math.round(ocrResult.confidence * 100)}% Confidence
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* OCR Text */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Extracted Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-background rounded border text-sm font-mono whitespace-pre-line max-h-64 overflow-y-auto">
                      {ocrResult.ocr_text}
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted Medications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Identified Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ocrResult.extracted_medications.map((med, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-900">{med.name}</h4>
                          <p className="text-sm text-green-700">
                            {med.dosage} - {med.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Final Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleComplete} className="bg-teal-600 hover:bg-teal-700">
                  <Check className="mr-2 h-4 w-4" />
                  Add to Medications
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
