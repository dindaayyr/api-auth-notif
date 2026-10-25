
const API_URL = 'http://192.168.110.48:3000';

export async function registerUser(nama, email, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nama, email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Registrasi gagal');
  }

  return result;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Login gagal');
  }

  return result;
}


export async function registerPushToken(expo_push_token, jwt) {
  const response = await fetch(
    `${API_URL}/api/notifications/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ expo_push_token }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Gagal menyimpan push token'
    );
  }

  return result;
}
