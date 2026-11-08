import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { errorMessage } from '../services/api';
import { Button, Card, ErrorState, Loader } from '../components/ui';
import { inr } from '../utils/format';

interface OrderData {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  mock?: boolean;
  mockCredentials?: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };
}

const buildHtml = (o: OrderData) => {
  const options = JSON.stringify({
    key: o.keyId,
    amount: o.amount,
    currency: o.currency,
    name: o.name,
    description: o.description,
    order_id: o.orderId,
    prefill: o.prefill,
    theme: { color: '#D96A06' },
  }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#FFF8E7;font-family:sans-serif;text-align:center;padding-top:48px;color:#6B1D1D">
<p>Opening secure payment…</p>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var post = function (o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  try {
    var options = ${options};
    options.handler = function (r) { post({ type: 'success', payload: r }); };
    options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (r) { post({ type: 'failed', message: (r.error && r.error.description) || 'Payment failed' }); });
    rzp.open();
  } catch (e) { post({ type: 'failed', message: 'Could not start the payment. Check your connection.' }); }
</script></body></html>`;
};

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const goToBooking = useCallback(() => router.replace(`/booking/${bookingId}`), [router, bookingId]);

  const createOrder = useCallback(async () => {
    setError(null);
    setOrder(null);
    try {
      const res = await api.post('/payments/create-order', { bookingId });
      setOrder(res.data.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) createOrder();
  }, [bookingId, createOrder]);

  const verifyPayment = async (payload: Record<string, string>) => {
    setVerifying(true);
    try {
      await api.post('/payments/verify', { bookingId, ...payload });
      goToBooking();
    } catch (err) {
      setVerifying(false);
      setOrder(null);
      setError(`${errorMessage(err)} If money was deducted it will be reconciled automatically; check My Bookings.`);
    }
  };

  const onMessage = async (e: WebViewMessageEvent) => {
    let msg: { type: string; payload?: Record<string, string>; message?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'dismiss') {
      goToBooking();
      return;
    }
    if (msg.type === 'failed') {
      setOrder(null);
      setError(msg.message || 'Payment failed');
      return;
    }
    if (msg.type === 'success' && msg.payload) {
      await verifyPayment(msg.payload);
    }
  };

  if (!bookingId) return <ErrorState message="Missing booking reference" />;
  if (verifying) return <Loader label="Verifying your payment…" />;
  if (error) {
    return (
      <View className="flex-1 justify-center p-4">
        <ErrorState message={error} onRetry={createOrder} />
        <View className="mx-4">
          <Button title="View my booking" variant="outline" onPress={goToBooking} />
        </View>
      </View>
    );
  }
  if (!order) return <Loader label="Preparing secure payment…" />;

  // Sandbox/mock fallback UI when Razorpay credentials are not configured in backend/.env
  if (order.mock && order.mockCredentials) {
    return (
      <View className="flex-1 justify-center p-5">
        <Card className="p-6">
          <Text className="text-xs font-semibold uppercase tracking-wider text-saffron-600">Razorpay Sandbox Mode</Text>
          <Text className="mt-1 text-2xl font-bold text-maroon-800">{order.description}</Text>
          <Text className="mt-2 text-3xl font-bold text-maroon-900">{inr(order.amount / 100)}</Text>
          <Text className="mt-2 text-xs text-maroon-700">
            Order ID: {order.orderId}{'\n'}
            HMAC-SHA256 signature verification will be executed against the backend.
          </Text>
          <View className="mt-5">
            <Button title={`Complete Sandbox Payment (${inr(order.amount / 100)})`} onPress={() => verifyPayment(order.mockCredentials!)} />
          </View>
          <View className="mt-3">
            <Button title="Pay Later / View Booking" variant="outline" onPress={goToBooking} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(order), baseUrl: 'https://checkout.razorpay.com' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => <Loader label="Loading payment…" />}
        onError={() => setError('Could not load the payment page. Check your connection.')}
      />
      <Text className="bg-cream-100 p-2 text-center text-xs text-maroon-700">Payments are processed securely by Razorpay.</Text>
    </View>
  );
}
