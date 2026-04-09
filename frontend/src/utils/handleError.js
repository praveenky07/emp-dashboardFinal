let isAlerting = false;

export const showToast = (message, type = 'error') => {
  const container = document.getElementById('toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
  toast.className = `${bg} text-white px-6 py-4 rounded-2xl font-bold shadow-2xl transform transition-all duration-300 translate-x-full opacity-0 flex items-center gap-3 max-w-sm border border-white/20`;
  
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    <span class="text-sm font-medium leading-tight">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });

  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-4');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

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

  // Handle Authentication Errors (401 Unauthorized or 403 Forbidden with Invalid Token/Expired)
  const isAuthError = status === 401 || (status === 403 && (
    errorMessage.toLowerCase().includes("token") || 
    errorMessage.toLowerCase().includes("auth") ||
    errorMessage.toLowerCase().includes("expired")
  ));

  if (isAuthError) {
    if (isAlerting) return; // Prevent multiple alerts for the same auth issue
    isAlerting = true;

    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Safe redirect for Capacitor/Mobile & Web
    if (window?.location && !window.location.pathname.includes('/login')) {
       showToast("Session expired. Please login again.", 'error');
       setTimeout(() => {
           window.location.href = "/login";
       }, 1500);
    }
    
    // Reset after some time just in case, but usually page refresh handles it
    setTimeout(() => { isAlerting = false; }, 5000);
    return;
  }

  // General Error Alert (Safe fallback)
  if (!silent && errorMessage && !window.location.pathname.includes('/login')) {
      showToast(errorMessage, 'error');
  }
  
  return errorMessage;
};
