const fromEnv = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const envPointsAtThisMachine = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(fromEnv);

// Local dev always talks to the Flask server on this machine.
// The live site calls its own API. A localhost address in the host settings is ignored there.
export const API_URL = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : envPointsAtThisMachine
    ? ""
    : fromEnv;

export function apiFetch(input, options = {}) {
  let url = input;
  if (typeof input === "string") {
    const localApi = /^http:\/\/(127\.0\.0\.1|localhost):5000/;
    if (localApi.test(input)) {
      url = API_URL + input.replace(localApi, "");
    } else if (!input.startsWith("http")) {
      url = `${API_URL}${input.startsWith("/") ? input : `/${input}`}`;
    }
  }

  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
