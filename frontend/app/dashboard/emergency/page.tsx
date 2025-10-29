"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Phone, Share, Shield, AlertTriangle, User, Mail } from "lucide-react"
import { AddEmergencyContactModal } from "@/components/modals/add-emergency-contact-modal"
import { EmergencyContactCard } from "@/components/EmergencyContactCard"
import { useToast } from "@/hooks/use-toast"
import { emergencyAPI } from "@/lib/api"
import { useHealthcare } from "@/context/healthcare-context"
import { useEffect } from "react"
import type { EmergencyApiResponse } from "@/types/emergency"

export default function EmergencyPage() {
  
  const { family, user } = useHealthcare()
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [contacts, setContacts] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(true)

useEffect(() => {
  const fetchContacts = async () => {
    setIsFetching(true)
    try {
      const res = await fetch("https://nfc4-hackoholics.onrender.com/api/v1/emergency", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setContacts(data.emergencyContacts || [])
      } else {
        console.error("Error fetching emergency contacts:", data?.error)
      }
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setIsFetching(false)
    }
  }

  fetchContacts()
}, [])


  const handleMailEmergencyContacts = async () => {
    if (!family?.emergency_contacts || family.emergency_contacts.length === 0) {
      toast({
        title: "No emergency contacts",
        description: "Please add emergency contacts first.",
        variant: "destructive",
      })
      return
    }

    // If contacts do not have an email property, you can either add it to the type/interface,
    // or skip this logic. Here, we assume you want to add the email property.
    const recipientEmails = family.emergency_contacts
      .map(c => (c as { email?: string }).email)
      .filter((email): email is string => !!email)

    if (recipientEmails.length === 0) {
      toast({
        title: "No valid emails",
        description: "None of your contacts have valid email addresses.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await emergencyAPI.mailContacts(recipientEmails)

      if (response.success) {
        toast({
          title: "Emails Sent",
          description: "Emergency info emailed to all contacts.",
        })
      } else {
        throw new Error(response.error || "Failed to send emails")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareSummary = async () => {
    // Check if there are emergency contacts
    if (!family?.emergency_contacts || family.emergency_contacts.length === 0) {
      toast({
        title: "No Emergency Contacts",
        description: "Please add emergency contacts before sharing health summary.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await emergencyAPI.shareSummary() as EmergencyApiResponse;
      if (response.success) {
        const sentCount = response.sentTo?.length || 0;
        const failedCount = response.failures?.length || 0;
        
        if (failedCount > 0) {
          toast({
            title: "Partially Sent",
            description: `Summary sent to ${sentCount} contacts. ${failedCount} failed.`,
            variant: "destructive",
          });
          console.warn("Failed to send to some contacts:", response.failures);
        } else {
          toast({
            title: "Health Summary Shared",
            description: `Summary successfully sent to ${sentCount} emergency contacts.`,
          });
        }
      } else {
        throw new Error(response.error || "Failed to share summary");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not share health summary. Please try again.",
        variant: "destructive",
      });
      console.error("Share summary error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emergency Contacts</h1>
          <p className="text-muted-foreground">
            Manage emergency contacts and send health reports when needed.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Emergency Contact
        </Button>
      </div>

      {/* Emergency Email Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Emergency Information
          </CardTitle>
          <CardDescription className="text-red-600">
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
              onClick={handleShareSummary}
              disabled={isLoading}
            >
              <Share className="mr-2 h-4 w-4" />
              {isLoading ? "Sharing..." : "Share Health Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts List */}
      <Card className="shadow transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-teal-600" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>People to contact in case of medical emergency</CardDescription>
        </CardHeader>
        <CardContent>
{isFetching ? (
  <p className="text-muted-foreground text-sm">Loading contacts...</p>
) : contacts.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {contacts.map((contact, index) => (
      <EmergencyContactCard key={index} contact={contact} />
    ))}
  </div>
) : (
  <div className="text-center py-8">
    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-foreground mb-2">No emergency contacts</h3>
    <p className="text-muted-foreground mb-4">Add emergency contacts to ensure help is available when needed</p>
    <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
      <Plus className="mr-2 h-4 w-4" />
      Add First Contact
    </Button>
  </div>
)}

        </CardContent>
      </Card>

      {/* Medical Summary */}
      <Card className="shadow transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Medical Information Summary
          </CardTitle>
          <CardDescription>Critical health information for emergency responders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Personal Information</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {user?.name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Family:</span> {family?.name}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Critical Medical Info</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Blood Type:</span> O+ (example)</p>
                <p><span className="font-medium">Allergies:</span> Peanuts (example)</p>
                <p><span className="font-medium">Conditions:</span> Hypertension (example)</p>
                <p><span className="font-medium">Current Medications:</span> Lisinopril 10mg (example)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Note</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This information is automatically generated from your health profile. Keep it updated.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <AddEmergencyContactModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  )
}

