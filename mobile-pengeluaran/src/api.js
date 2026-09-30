const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error('Isi EXPO_PUBLIC_API_URL di .env');
  }

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    // DELETE berhasil → 204 tanpa body
    if (response.status === 204) {
      return null;
    }

    const raw = await response.text();

    let data;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error(`Respons bukan JSON (${response.status})`);
    }

    if (!response.ok) {
      const error = new Error(
        data?.pesan || `HTTP ${response.status}`
      );

      error.status = response.status;

      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Waktu tunggu habis. Periksa data sebelum mengulang.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // GET
  list: () => request('/pengeluaran'),

  // GET detail
  detail: (id) => request(`/pengeluaran/${id}`),

  // GET kategori
  categories: () => request('/kategori'),

  // POST
  create: (body) =>
    request('/pengeluaran', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // PUT
  update: (id, body) =>
    request(`/pengeluaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // DELETE
  remove: (id) =>
    request(`/pengeluaran/${id}`, {
      method: 'DELETE',
    }),
};