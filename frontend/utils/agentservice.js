"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nfc4-hackoholics.onrender.com';

class AgentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/agents`;
    if (process.env.NODE_ENV !== "production") {
      console.log("Initialized agentService with baseURL:", this.baseURL);
    }
  }

  getAuthHeaders() {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async runMyAgent() {
    try {
      const url = `${this.baseURL}/run-for-me`;
      if (process.env.NODE_ENV !== "production") {
        console.log("Calling runMyAgent API:", url);
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse(res);
      return { success: true, data };
    } catch (err) {
      console.error("runMyAgent failed:", err);
      return { success: false, error: err.message };
    }
  }

  async runFamilyAgents() {
    try {
      const url = `${this.baseURL}/run-for-family`;
      if (process.env.NODE_ENV !== "production") {
        console.log("Calling runFamilyAgents API:", url);
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse(res);
      return { success: true, data };
    } catch (err) {
      console.error("runFamilyAgents failed:", err);
      return { success: false, error: err.message };
    }
  }
}

export const agentService = new AgentService();
export default agentService;
