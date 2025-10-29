// frontend/utils/api.ts
export const getAgentById = async (id: string) => {
  const res = await fetch(`https://nfc4-hackoholics.onrender.com/api/agent/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch agent");
  return res.json();
};
