let isAlerting = false;

export const handleError = (err, silent = false) => {
  if (!err) return;

  const status = err.response?.status;
  const data = err.response?.data;
  const errorMessage = data?.error || data?.message || err.message || "An unexpected error occurred";

  console.error("[API ERROR]", {
    status,
    message: errorMessage,
    data: data
  });

  // Handle Authentication Errors (401 Unauthorized or 403 Forbidden with Invalid Token)
  const isAuthError = status === 401 || (status === 403 && (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("auth")));

  if (isAuthError) {
    if (isAlerting) return; // Prevent multiple alerts for the same auth issue
    isAlerting = true;

    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Safe redirect for Capacitor/Mobile & Web
    if (window?.location && !window.location.pathname.includes('/login')) {
       alert("Session expired. Please login again.");
       window.location.href = "/login";
    }
    
    // Reset after some time just in case, but usually page refresh handles it
    setTimeout(() => { isAlerting = false; }, 5000);
    return;
  }

  // General Error Alert (Safe fallback)
  if (!silent && errorMessage && !window.location.pathname.includes('/login')) {
      alert(errorMessage);
  }
  
  return errorMessage;
};
