/**
 * API helper terpusat untuk Sistem Antrean BPR Kerta Raharja.
 * Semua panggilan API melalui fungsi-fungsi di sini.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | undefined | null>;
}

async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, params } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }
    return data;
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return {} as T;
}

// ── Branch API ──
export interface Branch {
  id_kantor: string;
  nama_kantor: string;
  alamat: string | null;
  gambar_kantor: string | null;
}

export const branchApi = {
  list: () => request<Branch[]>("/branches"),
};

// ── Queue API ──
export interface QueueItem {
  id: number;
  ticket_number: string;
  service_type: string;
  prefix: string;
  number: number;
  status: string;
  counter_name: string | null;
  id_kantor: string;
  created_at: string;
  updated_at: string;
}

export interface QueueStatusResponse {
  calling: QueueItem[];
  waiting: QueueItem[];
  announcements: string[];
  stats: {
    total_waiting: number;
    teller_waiting: number;
    kredit_waiting: number;
    cs_waiting: number;
  };
}

export const queueApi = {
  status: (idKantor: string) =>
    request<QueueStatusResponse>("/queues/status", { params: { id_kantor: idKantor } }),

  store: (data: { id_kantor: string; service_type: string; prefix: string }) =>
    request<{ success: boolean; data: QueueItem }>("/queues/store", {
      method: "POST",
      body: data,
    }),

  callNext: (data: { id_kantor: string; counter_name: string; service_type: string }) =>
    request<{ success: boolean; data: QueueItem }>("/queues/call-next", {
      method: "POST",
      body: data,
    }),

  recall: (queueId: number) =>
    request<{ success: boolean; data: QueueItem }>("/queues/recall", {
      method: "POST",
      body: { queue_id: queueId },
    }),

  complete: (queueId: number) =>
    request<{ success: boolean; data: QueueItem }>("/queues/complete", {
      method: "POST",
      body: { queue_id: queueId },
    }),

  skip: (queueId: number) =>
    request<{ success: boolean; data: QueueItem }>("/queues/skip", {
      method: "POST",
      body: { queue_id: queueId },
    }),

  reset: (idKantor: string) =>
    request<{ success: boolean; message: string }>("/queues/reset", {
      method: "POST",
      body: { id_kantor: idKantor },
    }),
};

// ── Counter API ──
export interface CounterItem {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  id_kantor: string;
  created_at?: string;
  updated_at?: string;
}

export const counterApi = {
  list: (idKantor: string) =>
    request<CounterItem[]>("/counters", { params: { id_kantor: idKantor } }),

  create: (data: { name: string; type: string; is_active: boolean; id_kantor: string }) =>
    request<{ success: boolean; data: CounterItem }>("/counters", {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: { name: string; type: string; is_active: boolean; id_kantor: string }) =>
    request<{ success: boolean; data: CounterItem }>(`/counters/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/counters/${id}`, {
      method: "DELETE",
    }),
};

// ── Informasi Publik API ──
export interface InformasiPublikItem {
  id: number;
  judul: string;
  tipe: "gambar" | "youtube" | "teks_bergulir";
  konten: string;
  tanggal_berlaku: string | null;
  tanggal_kadaluarsa: string | null;
  is_active: boolean;
  urutan: number;
  id_kantor: string | null;
}

export const informasiApi = {
  list: (idKantor?: string) => {
    const params = idKantor ? { id_kantor: idKantor } : undefined;
    return request<InformasiPublikItem[]>("/informasi-publik", { params });
  },

  aktif: (idKantor?: string) => {
    const params = idKantor ? { id_kantor: idKantor } : undefined;
    return request<InformasiPublikItem[]>("/informasi-publik/aktif", { params });
  },

  create: (data: {
    id_kantor: string | null;
    judul: string;
    tipe: string;
    konten: string;
    tanggal_berlaku: string | null;
    tanggal_kadaluarsa: string | null;
    is_active: boolean;
    urutan: number;
  }) =>
    request<{ success: boolean; data: InformasiPublikItem }>("/informasi-publik", {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: Record<string, unknown>) =>
    request<{ success: boolean; data: InformasiPublikItem }>(`/informasi-publik/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/informasi-publik/${id}`, {
      method: "DELETE",
    }),
};

// ── Login API ──
export interface LoginUser {
  name: string;
  email: string;
  role: "admin" | "petugas";
  id_kantor: string;
}

export const authApi = {
  login: (data: { email: string; password: string; id_kantor: string }) =>
    request<{ success: boolean; user: LoginUser }>("/login", {
      method: "POST",
      body: data,
    }),
};

// ── Interest Rate API ──
export interface BiRateData {
  bi_rate: number;
  bi_rate_str: string;
  period: string;
  source: string;
}

export const interestApi = {
  getRate: () => request<BiRateData>("/interest-rate"),
};
