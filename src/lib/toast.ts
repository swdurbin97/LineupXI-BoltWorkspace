// Simple toast notification system
type ToastType = 'success' | 'error' | 'info';

let toastContainer: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message: string, type: ToastType = 'success') {
  const container = getContainer();

  const toastEl = document.createElement('div');
  toastEl.className = `
    px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium
    transition-all duration-300 transform translate-x-0
    ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
  `;
  toastEl.textContent = message;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.transform = 'translateX(400px)';
    toastEl.style.opacity = '0';
    setTimeout(() => {
      container.removeChild(toastEl);
    }, 300);
  }, 3000);
}
