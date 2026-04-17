// src/lib/api.ts
// In production (Vercel), set NEXT_PUBLIC_API_URL to your Render backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function loginUser(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Login failed");
    }

    return response.json();
}

export async function registerUser(username: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Registration failed");
    }

    return response.json();
}

export async function submitDiagnosticImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (response.status === 401) {
        throw new Error("SESSION_EXPIRED");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Server error: ${response.status}`);
    }

    return response.json();
}

export async function fetchDiagnosticHistory(token: string) {
    const response = await fetch(`${API_URL}/history`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch history");
    }

    return response.json();
}
