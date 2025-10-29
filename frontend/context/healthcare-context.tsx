"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  role: "head" | "member"
  family_id: string
  created_at: Date
}

interface Family {
  _id: string
  name: string
  head_id: string
  members: string[]
  emergency_contacts: Array<{
    name: string
    relation: string
    phone: string
  }>
}

interface Profile {
  _id: string
  user_id: string
  DOB: Date
  height: number
  weight: number
  gender: "Male" | "Female" | "Other"
  blood_group: string
  family_doctor_email: string[]
  allergies: string[]
  existing_conditions: string[]
  medications: string[]
}

interface Medication {
  _id: string
  user_id: string
  medicine_name: string
  dosage: string
  frequency: string
  timing: string[]
  start_date: Date
  end_date: Date
  stock_count: number
  refill_alert_threshold: number
}

interface Vital {
  _id: string
  user_id: string
  timestamp: Date
  bp_systolic: number
  bp_diastolic: number
  sugar: number
  weight: number
  temperature: number
}

interface Alert {
  _id: string
  user_id: string
  timestamp: Date
  type: "vital_alert" | "missed_meds" | "summary"
  message: string
  severity: "low" | "moderate" | "high"
  acknowledged: boolean
}

interface Appointment {
  _id: string
  user_id: string
  doctor_name: string
  date: Date
  type: string
  notes: string
  reminder: boolean
}

interface Prescription {
  _id: string
  user_id: string
  upload_time: Date
  image_url: string
  ocr_text: string
  extracted_medications: Array<{
    name: string
    dosage: string
    frequency: string
    linked_medication_id?: string
  }>
  status: "processing" | "completed" | "error"
}

interface HealthcareContextType {
  user: User | null
  family: Family | null
  profiles: Profile[]
  profile: Profile | null
  medications: Medication[]
  vitals: Vital[]
  alerts: Alert[]
  appointments: Appointment[]
  prescriptions: Prescription[]
  darkMode: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  toggleDarkMode: () => void
  addFamilyMember: (memberData: Partial<User>) => Promise<void>
  updateProfile: (userId: string, profileData: Partial<Profile>) => Promise<void>
  getProfile: () => Promise<void>
  addFamilyDoctor: (email: string) => Promise<void>
  getFamily: () => Promise<void>
  updateEmergencyContacts: (contacts: Array<{ name: string; relation: string; phone: string }>) => Promise<void>
  getMedications: () => Promise<void>
  getVitals: () => Promise<void>
  getNotifications: () => Promise<void>
  getAgentAlerts: () => Promise<void>
  getPrescriptions: () => Promise<void>
  uploadPrescription: (formData: FormData) => Promise<Prescription>
  processPrescriptionWithGemini: (prescriptionId: string) => Promise<void>
  sendChatMessage: (message: string) => Promise<string>
  generateHealthReportSummary: (data: {
    vitals: any[]
    medications: any[]
    profile: any
    healthScoreData: any[]
  }) => Promise<string>
  addMedication: (medicationData: Partial<Medication>) => void
  addVital: (vitalData: Partial<Vital>) => void
  addAppointment: (appointmentData: Partial<Appointment>) => void
  acknowledgeAlert: (alertId: string) => void
}

const HealthcareContext = createContext<HealthcareContextType | undefined>(undefined)

export function HealthcareProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [vitals, setVitals] = useState<Vital[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check for existing authentication and initialize data
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user")
      const accessToken = localStorage.getItem("accessToken")
      
      if (storedUser && accessToken) {
        try {
          // Verify token is still valid by calling a protected endpoint
          const response = await apiClient.getCurrentUser()
          
          if (response.success) {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            
            // Load user-specific data from backend
            await Promise.all([
              getProfile(),
              getFamily(),
              getMedications(),
              getVitals(),
              getNotifications(),
              getPrescriptions(),
            ])
            
            setLoading(false)
            return
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("user")
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          // Clear storage on error
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
        }
      }

      // If no valid auth, set loading to false
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data
        
        // Store tokens and user data
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        localStorage.setItem("user", JSON.stringify(userData))
        
        setUser(userData)
        
        // Load user-specific data from backend
        await Promise.all([
          getProfile(),
          getFamily(),
          getMedications(),
          getVitals(),
          getNotifications(),
          getPrescriptions(),
        ])
        
        return true
      } else {
        console.error("Login failed:", response.error)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
      
      setUser(null)
      setFamily(null)
      setProfiles([])
      setMedications([])
      setVitals([])
      setAlerts([])
      setAppointments([])
      setPrescriptions([])
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const addFamilyMember = async (memberData: Partial<User>) => {
    try {
      const response = await apiClient.post('/families/members', {
        name: memberData.name,
        email: memberData.email,
        password: memberData.password,
        relation: memberData.relation || 'other'
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to add family member')
      }

      // Update local state if needed
      console.log('Family member added successfully:', response.data)
      
      // You might want to refresh family data here
      // await refreshFamilyData()
      
    } catch (error) {
      console.error('Error adding family member:', error)
      throw error
    }
  }

  const getProfile = async () => {
    try {
      const response = await apiClient.getProfile()
      if (response.success) {
        setProfile(response.data)
      } else {
        // Don't log as error since this is expected for new users
        console.log('Profile not found, will be created when user edits profile')
        setProfile(null)
      }
    } catch (error) {
      console.error('Error getting profile:', error)
      setProfile(null)
    }
  }

  const updateProfile = async (userId: string, profileData: Partial<Profile>) => {
    try {
      const response = await apiClient.updateProfile({
        DOB: profileData.DOB?.toISOString().split('T')[0],
        height: profileData.height,
        weight: profileData.weight,
        gender: profileData.gender,
        blood_group: profileData.blood_group,
        family_doctor_email: profileData.family_doctor_email,
        allergies: profileData.allergies,
        existing_conditions: profileData.existing_conditions,
      })

      if (response.success) {
        // Update local state
        setProfile(response.data)
        setProfiles(prev => 
          prev.map(p => p.user_id === userId ? response.data : p)
        )
      } else {
        throw new Error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const addFamilyDoctor = async (email: string) => {
    try {
      const response = await apiClient.addFamilyDoctor(email);
      if (response.success) {
        setProfile(prev => {
          if (prev) {
            return {
              ...prev,
              family_doctor_email: [...prev.family_doctor_email, email],
            };
          }
          return prev;
        });
        setProfiles(prev =>
          prev.map(p => p.user_id === user?._id ? { ...p, family_doctor_email: [...p.family_doctor_email, email] } : p)
        );
      } else {
        throw new Error(response.error || 'Failed to add family doctor');
      }
    } catch (error) {
      console.error('Error adding family doctor:', error);
      throw error;
    }
  };

  const getFamily = async () => {
    try {
      const response = await apiClient.getFamily();
      if (response.success) {
        setFamily(response.data);
      } else {
        console.error('Failed to get family:', response.error);
        setFamily(null);
      }
    } catch (error) {
      console.error('Error getting family:', error);
      setFamily(null);
    }
  };

  const updateEmergencyContacts = async (contacts: Array<{ name: string; relation: string; phone: string }>) => {
    try {
      const response = await apiClient.updateEmergencyContacts(contacts);
      if (response.success) {
        // Update the family state with new emergency contacts
        setFamily(prev => prev ? { ...prev, emergency_contacts: contacts } : null);
      } else {
        throw new Error(response.error || 'Failed to update emergency contacts');
      }
    } catch (error) {
      console.error('Error updating emergency contacts:', error);
      throw error;
    }
  };

  const getMedications = async () => {
    try {
      const response = await apiClient.getMedications();
      if (response.success) {
        // Convert date strings to Date objects
        const medicationsWithDates = response.data.map((med: any) => ({
          ...med,
          start_date: new Date(med.start_date),
          end_date: new Date(med.end_date),
        }));
        setMedications(medicationsWithDates);
      } else {
        console.error('Failed to get medications:', response.error);
        setMedications([]);
      }
    } catch (error) {
      console.error('Error getting medications:', error);
      setMedications([]);
    }
  };

  const getVitals = async () => {
    try {
      const response = await apiClient.getVitals();
      if (response.success) {
        // Convert date strings to Date objects
        const vitalsWithDates = response.data.map((vital: any) => ({
          ...vital,
          timestamp: new Date(vital.timestamp),
        }));
        setVitals(vitalsWithDates);
      } else {
        console.error('Failed to get vitals:', response.error);
        setVitals([]);
      }
    } catch (error) {
      console.error('Error getting vitals:', error);
      setVitals([]);
    }
  };

  const getNotifications = async () => {
    try {
      const response = await apiClient.getNotifications();
      if (response.success) {
        // Convert date strings to Date objects and map to Alert interface
        const alertsWithDates = response.data.map((notification: any) => ({
          _id: notification._id,
          user_id: notification.user_id,
          timestamp: new Date(notification.timestamp),
          type: notification.type as "vital_alert" | "missed_meds" | "summary",
          message: notification.message,
          severity: notification.severity as "low" | "moderate" | "high",
          acknowledged: notification.acknowledged || false,
        }));
        setAlerts(alertsWithDates);
      } else {
        console.error('Failed to get notifications:', response.error);
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error getting notifications:', error);
      setAlerts([]);
    }
  };

  const getAgentAlerts = async () => {
    try {
      const response = await apiClient.getAgentAlerts();
      if (response.success) {
        // Convert date strings to Date objects and map to Alert interface
        const alertsWithDates = response.data.map((alert: any) => ({
          _id: alert._id,
          user_id: alert.user_id,
          timestamp: new Date(alert.timestamp),
          type: alert.type as "vital_alert" | "missed_meds" | "summary",
          message: alert.message,
          severity: alert.severity as "low" | "moderate" | "high",
          acknowledged: alert.acknowledged || false,
        }));
        setAlerts(prev => [...prev, ...alertsWithDates]);
      } else {
        console.error('Failed to get agent alerts:', response.error);
      }
    } catch (error) {
      console.error('Error getting agent alerts:', error);
    }
  };

  const getPrescriptions = async () => {
    try {
      const response = await apiClient.getPrescriptions();
      if (response.success) {
        // Convert date strings to Date objects
        const prescriptionsWithDates = response.data.prescriptions.map((prescription: any) => ({
          ...prescription,
          upload_time: new Date(prescription.upload_time),
        }));
        setPrescriptions(prescriptionsWithDates);
      } else {
        console.error('Failed to get prescriptions:', response.error);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error getting prescriptions:', error);
      setPrescriptions([]);
    }
  };

  const uploadPrescription = async (formData: FormData) => {
    try {
      const response = await apiClient.uploadPrescription(formData);
      if (response.success) {
        // Add the new prescription to the state
        const prescriptionWithDate = {
          ...response.data.prescription,
          upload_time: new Date(response.data.prescription.upload_time),
        };
        setPrescriptions(prev => [...prev, prescriptionWithDate]);

        // Automatically process with Gemini
        await processPrescriptionWithGemini(prescriptionWithDate._id);

        // Refresh medications so extracted meds are visible
        await getMedications();

        return prescriptionWithDate;
      } else {
        console.error('Failed to upload prescription:', response.error);
        throw new Error(response.error || 'Failed to upload prescription');
      }
    } catch (error) {
      console.error('Error uploading prescription:', error);
      throw error;
    }
  };

  const processPrescriptionWithGemini = async (prescriptionId: string) => {
    try {
      const response = await apiClient.processPrescriptionWithGemini(prescriptionId);
      if (response.success) {
        // Update the specific prescription in the state
        setPrescriptions(prev => prev.map(prescription =>
          prescription._id === prescriptionId ? { ...prescription, status: response.data.status, extracted_medications: response.data.extracted_medications } : prescription
        ));
        // Optionally, refresh prescriptions list
        // await getPrescriptions();
      } else {
        console.error('Failed to process prescription with Gemini:', response.error);
      }
    } catch (error) {
      console.error('Error processing prescription with Gemini:', error);
    }
  };

  const sendChatMessage = async (message: string): Promise<string> => {
    try {
      const response = await apiClient.sendChatMessage(message);
      if (response.success) {
        return response.data.reply;
      } else {
        throw new Error(response.error || 'Failed to send chat message');
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  };

  const generateHealthReportSummary = async (data: {
    vitals: any[]
    medications: any[]
    profile: any
    healthScoreData: any[]
  }): Promise<string> => {
    try {
      const response = await apiClient.generateHealthReportSummary(data);
      if (response.success) {
        return response.data.summary;
      } else {
        throw new Error(response.error || 'Failed to generate health report summary');
      }
    } catch (error) {
      console.error('Error generating health report summary:', error);
      throw error;
    }
  };

  const addMedication = (medicationData: Partial<Medication>) => {
    const newMedication: Medication = {
      _id: `med${Date.now()}`,
      user_id: user?._id || "",
      medicine_name: "",
      dosage: "",
      frequency: "",
      timing: [],
      start_date: new Date(),
      end_date: new Date(),
      stock_count: 0,
      refill_alert_threshold: 10,
      ...medicationData,
    }
    setMedications((prev) => [...prev, newMedication])
  }

  const addVital = (vitalData: Partial<Vital>) => {
    const newVital: Vital = {
      _id: `vital${Date.now()}`,
      user_id: user?._id || "",
      timestamp: new Date(),
      bp_systolic: 0,
      bp_diastolic: 0,
      sugar: 0,
      weight: 0,
      temperature: 0,
      ...vitalData,
    }
    setVitals((prev) => [...prev, newVital])
  }

  const addAppointment = (appointmentData: Partial<Appointment>) => {
    const newAppointment: Appointment = {
      _id: `appt${Date.now()}`,
      user_id: user?._id || "",
      doctor_name: "",
      date: new Date(),
      type: "",
      notes: "",
      reminder: false,
      ...appointmentData,
    }
    setAppointments((prev) => [...prev, newAppointment])
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert._id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  return (
    <HealthcareContext.Provider
      value={{
        user,
        family,
        profiles,
        profile,
        medications,
        vitals,
        alerts,
        appointments,
        prescriptions,
        darkMode,
        loading,
        login,
        logout,
        toggleDarkMode,
        addFamilyMember,
        updateProfile,
        getProfile,
        addFamilyDoctor,
        getFamily,
        updateEmergencyContacts,
        getMedications,
        getVitals,
        getNotifications,
        getAgentAlerts,
        getPrescriptions,
        uploadPrescription,
        processPrescriptionWithGemini,
        sendChatMessage,
        generateHealthReportSummary,
        addMedication,
        addVital,
        addAppointment,
        acknowledgeAlert,
      }}
    >
      {children}
    </HealthcareContext.Provider>
  )
}

export function useHealthcare() {
  const context = useContext(HealthcareContext)
  if (context === undefined) {
    throw new Error("useHealthcare must be used within a HealthcareProvider")
  }
  return context
}
