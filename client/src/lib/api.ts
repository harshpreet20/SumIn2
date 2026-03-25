const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}

// Prescriptions
export const api = {
  // Prescriptions
  getPrescriptions: (params?: { page?: number; search?: string; department?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    return fetchApi(`/prescriptions?${query}`);
  },
  getPrescription: (id: string) => fetchApi(`/prescriptions/${id}`),
  getNextRegNumber: () => fetchApi('/prescriptions/next-reg'),
  createPrescription: (data: any) =>
    fetchApi('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  updatePrescription: (id: string, data: any) =>
    fetchApi(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Print
  printPrescription: (id: string) =>
    fetchApi(`/print/${id}`, { method: 'POST' }),
  getPrintStatus: (jobId: string) => fetchApi(`/print/status/${jobId}`),
  getPrinters: () => fetchApi('/print/printers'),

  // Analytics
  getSummary: () => fetchApi('/analytics/summary'),
  getTrends: (days?: number) => fetchApi(`/analytics/trends?days=${days || 30}`),
  getDepartmentStats: () => fetchApi('/analytics/departments'),
  getDemographics: () => fetchApi('/analytics/demographics'),

  // Import
  importFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/import`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  },
  getImportHistory: () => fetchApi('/import/history'),

  // Config
  getConfig: () => fetchApi('/config'),
  updateConfig: (data: any) =>
    fetchApi('/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Health
  health: () => fetchApi('/health'),
};
