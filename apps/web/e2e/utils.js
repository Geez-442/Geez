const API_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status} ${text}`);
  }
  return data;
}

async function registerRole(email, role) {
  const password = 'Password123!';
  await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      role,
      displayName: `${role} Test`,
      prazVendorNumber: `PRAZ-${Date.now()}`,
    }),
  });
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return login;
}

async function seedSupplierAndTender() {
  const now = Date.now();
  const supplier = await registerRole(`supplier-${now}@e2e.test`, 'Supplier');
  const pmu = await registerRole(`pmu-${now}@e2e.test`, 'PMU_Officer');

  const tender = await apiRequest('/tenders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pmu.token}` },
    body: JSON.stringify({
      title: `E2E Tender ${now}`,
      tenderType: 'Goods',
      procuringEntity: 'E2E Entity',
      budget: 100000,
      currency: 'ZWL',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  await apiRequest(`/tenders/${tender.id}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pmu.token}` },
  });

  return { supplier, tender };
}

module.exports = { apiRequest, registerRole, seedSupplierAndTender };
