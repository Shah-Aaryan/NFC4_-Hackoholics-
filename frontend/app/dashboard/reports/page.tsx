"use client";

import { useRef, useState } from "react";
import { useHealthcare } from "@/context/healthcare-context";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FileText, TrendingUp, Activity, Pill, Heart } from "lucide-react";

export default function ReportsPage() {
  const { vitals, medications, profile, generateHealthReportSummary } = useHealthcare();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Generate comprehensive dummy data for better visualization
  const generateDummyVitals = () => {
    const dummyVitals = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 days of data
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      dummyVitals.push({
        date: date.toLocaleDateString(),
        systolic: Math.floor(Math.random() * 40) + 110, // 110-150
        diastolic: Math.floor(Math.random() * 20) + 70, // 70-90
        sugar: Math.floor(Math.random() * 60) + 80, // 80-140
        temperature: Math.floor(Math.random() * 4) + 96, // 96-100
        weight: Math.floor(Math.random() * 10) + 65, // 65-75
        heartRate: Math.floor(Math.random() * 30) + 60, // 60-90
      });
    }
    return dummyVitals;
  };

  const dummyVitals = generateDummyVitals();
  const chartData = vitals.length > 0 ? vitals.map((v) => ({
    date: new Date(v.timestamp).toLocaleDateString(),
    systolic: v.bp_systolic,
    diastolic: v.bp_diastolic,
    sugar: v.sugar,
    temperature: v.temperature,
    weight: v.weight,
  })) : dummyVitals;

  // Medication adherence data
  const medicationAdherence = [
    { name: "Taken", value: 85, color: "#10b981" },
    { name: "Missed", value: 15, color: "#ef4444" },
  ];

  // Health score data
  const healthScoreData = [
    { month: "Jan", score: 75 },
    { month: "Feb", score: 78 },
    { month: "Mar", score: 82 },
    { month: "Apr", score: 79 },
    { month: "May", score: 85 },
    { month: "Jun", score: 88 },
  ];

  const downloadReport = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Generate AI summary
      const aiSummary = await generateHealthReportSummary({
        vitals: chartData,
        medications,
        profile,
        healthScoreData
      });

      // Create PDF with AI summary
      const pdf = new jsPDF("p", "mm", "a4");
      let yPosition = 25;
      const pageHeight = 297;
      const margin = 25;
      const rightMargin = 25;
      const maxWidth = 210 - margin - rightMargin;
      
      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, indent: number = 0) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = 25;
        }
        
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        // Split text into lines that fit within the page width
        const lines = pdf.splitTextToSize(text, maxWidth - indent);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = 25;
          }
          pdf.text(line, margin + indent, yPosition);
          yPosition += fontSize * 0.4;
        });
        
        yPosition += 2; // Add some spacing between paragraphs
      };

      // Helper function to add a section divider
      const addSectionDivider = () => {
        yPosition += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, 210 - rightMargin, yPosition);
        yPosition += 10;
      };

      // Header with professional styling
      pdf.setFillColor(41, 128, 185); // Blue background
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text("AI-GENERATED HEALTH SUMMARY REPORT", 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      
      // Reset text color and position
      pdf.setTextColor(0, 0, 0);
      yPosition = 50;

      // Patient Information Section
      if (profile) {
        addText("PATIENT INFORMATION", 16, true);
        yPosition += 3;
        
        const patientInfo = [
          { label: "Name", value: `${profile.gender === "Male" ? "Mr." : "Ms."} ${profile.user_id}` },
          { label: "Age", value: `${Math.floor((new Date().getTime() - new Date(profile.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` },
          { label: "Gender", value: profile.gender },
          { label: "Blood Group", value: profile.blood_group },
          { label: "Height", value: `${profile.height} cm` },
          { label: "Weight", value: `${profile.weight} kg` }
        ];
        
        patientInfo.forEach(({ label, value }) => {
          addText(`${label}: ${value}`, 12, false, 10);
        });
        
        addSectionDivider();
      }

      // AI Summary Section with better formatting
      addText("AI HEALTH ANALYSIS", 18, true);
      yPosition += 5;
      
      // Process AI summary with better formatting
      const summaryLines = aiSummary.split('\n');
      let inList = false;
      
      summaryLines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          yPosition += 3; // Add spacing for empty lines
          return;
        }
        
        // Detect different types of content for better formatting
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          // Bold headers
          addText(trimmedLine.replace(/\*\*/g, ''), 14, true);
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          // Bullet points
          if (!inList) {
            yPosition += 2;
            inList = true;
          }
          addText(`• ${trimmedLine.substring(2)}`, 12, false, 15);
        } else if (trimmedLine.match(/^\d+\./)) {
          // Numbered lists
          if (!inList) {
            yPosition += 2;
            inList = true;
          }
          addText(trimmedLine, 12, false, 15);
        } else if (trimmedLine.includes('**') && trimmedLine.includes(':')) {
          // Bold labels
          addText(trimmedLine, 12, true);
        } else {
          // Regular text
          if (inList) {
            yPosition += 2;
            inList = false;
          }
          addText(trimmedLine, 12, false);
        }
      });

      // Footer with professional styling
      addSectionDivider();
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      
      const footerText = "This AI-generated report was created by the PariCare Management System";
      const footerText2 = "For any questions, please consult with your healthcare provider";
      
      pdf.text(footerText, 105, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text(footerText2, 105, yPosition, { align: 'center' });

      pdf.save(`AI_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF generation failed. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const first = chartData[0];
  const last = chartData[chartData.length - 1];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Health Summary Report</h1>
        </div>
                 <Button 
           onClick={downloadReport} 
           disabled={isGeneratingPDF}
           className="flex items-center gap-2"
         >
           <Download className="h-4 w-4" />
           {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
         </Button>
      </div>

      <div
        ref={reportRef}
        className="bg-white text-black p-8 rounded-lg max-w-6xl mx-auto font-sans shadow-lg"
      >
        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Health Summary Report</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* User Profile Info */}
        {profile && (
          <Card className="mb-8 border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-700">Name:</p>
                  <p className="text-gray-900">{profile.gender === "Male" ? "Mr." : "Ms."} {profile.user_id}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Age:</p>
                  <p className="text-gray-900">{Math.floor((new Date().getTime() - new Date(profile.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Gender:</p>
                  <p className="text-gray-900">{profile.gender}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Blood Group:</p>
                  <p className="text-gray-900">{profile.blood_group}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Height:</p>
                  <p className="text-gray-900">{profile.height} cm</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Weight:</p>
                  <p className="text-gray-900">{profile.weight} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Vitals Summary */}
        <Card className="mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Current Vitals Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="text-2xl font-bold text-red-600">{last?.systolic || 120}/{last?.diastolic || 80}</p>
                <p className="text-xs text-gray-500">mmHg</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Blood Sugar</p>
                <p className="text-2xl font-bold text-blue-600">{last?.sugar || 95}</p>
                <p className="text-xs text-gray-500">mg/dL</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Weight</p>
                <p className="text-2xl font-bold text-purple-600">{last?.weight || 70}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-2xl font-bold text-orange-600">{last?.temperature || 98.6}</p>
                <p className="text-xs text-gray-500">°F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitals Trends Chart */}
        <Card className="mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vitals Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!isGeneratingPDF ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={3} name="Systolic BP" />
                    <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={3} name="Diastolic BP" />
                    <Line type="monotone" dataKey="sugar" stroke="#3b82f6" strokeWidth={3} name="Blood Sugar" />
                    <Line type="monotone" dataKey="temperature" stroke="#10b981" strokeWidth={3} name="Temperature" />
                    <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} name="Weight" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500 italic">Chart rendering for PDF...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Progress Comparison */}
        {first && last && (
          <Card className="mb-8 border-2">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Health Progress Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Blood Pressure</p>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">
                      {first.systolic}/{first.diastolic} → {last.systolic}/{last.diastolic}
                    </p>
                    <p className="text-xs text-gray-500">mmHg</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Blood Sugar</p>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">
                      {first.sugar} → {last.sugar}
                    </p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Weight</p>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">
                      {first.weight} → {last.weight}
                    </p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Temperature</p>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">
                      {first.temperature} → {last.temperature}
                    </p>
                    <p className="text-xs text-gray-500">°F</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medication Adherence */}
        <Card className="mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Adherence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={medicationAdherence}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {medicationAdherence.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Taken: 85%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Missed: 15%</span>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-semibold">Excellent adherence rate!</p>
                  <p className="text-xs text-green-600">Keep up the good work with your medication schedule.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Trend */}
        <Card className="mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {medications.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No medications currently prescribed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Medication Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Dosage</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Frequency</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Timing</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Stock Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med._id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-medium">{med.medicine_name}</td>
                        <td className="border border-gray-300 px-4 py-3">{med.dosage}</td>
                        <td className="border border-gray-300 px-4 py-3">{med.frequency}</td>
                        <td className="border border-gray-300 px-4 py-3">{med.timing.join(", ")}</td>
                        <td className={`border border-gray-300 px-4 py-3 font-semibold ${
                          med.stock_count <= med.refill_alert_threshold ? "text-red-600" : "text-green-600"
                        }`}>
                          {med.stock_count}
                          {med.stock_count <= med.refill_alert_threshold && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Low Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>This report was generated automatically by the PariCare Management System</p>
          <p>For any questions, please consult with your healthcare provider</p>
        </div>
      </div>
    </div>
  );
}