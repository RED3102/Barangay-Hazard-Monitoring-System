// If you want to use the local backend, set this to true
// If you want to use the production backend (Railway), set this to false
const USE_LOCAL = false; 

export const API_URL = USE_LOCAL
  ? "http://localhost:3000"
  : "https://backend-production-f78d.up.railway.app";
