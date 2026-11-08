import api from './api';

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById('razorpay-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Could not load payment SDK')));
      return undefined;
    }
    const s = document.createElement('script');
    s.id = 'razorpay-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Could not load the payment SDK. Check your internet connection.'));
    document.body.appendChild(s);
    return undefined;
  });
}

/**
 * Opens Razorpay checkout for a booking (or automatic sandbox verification when backend
 * runs without live Razorpay keys). Resolves 'paid' after server-side signature
 * verification succeeds, or 'dismissed' if the user closes the popup.
 */
export async function payForBooking(bookingId) {
  const { data } = await api.post('/payments/create-order', { bookingId });
  const o = data.data;

  // Sandbox/mock fallback when Razorpay credentials are not set in backend/.env
  if (o.mock && o.mockCredentials) {
    await api.post('/payments/verify', { bookingId, ...o.mockCredentials });
    return 'paid';
  }

  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: o.keyId,
      amount: o.amount,
      currency: o.currency,
      name: o.name,
      description: o.description,
      order_id: o.orderId,
      prefill: o.prefill,
      theme: { color: '#D96A06' },
      handler: async (response) => {
        try {
          await api.post('/payments/verify', { bookingId, ...response });
          resolve('paid');
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve('dismissed') },
    });
    rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'Payment failed')));
    rzp.open();
  });
}
