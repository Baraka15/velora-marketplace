export const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

export const initializePaystackPayment = async ({
  email,
  amount,
  orderId,
  productId,
  metadata = {},
}: {
  email: string;
  amount: number;
  orderId: string;
  productId: string;
  metadata?: any;
}) => {
  // In a real mobile app, you might call your backend to initialize this
  // or use the PAYSTACK_PUBLIC_KEY directly in the WebView component.
  // For the WebView approach, we just need to return the configuration
  // that the Paystack WebView expects.
  
  return {
    email,
    amount: amount * 100, // Paystack expects amount in kobo/cents
    ref: orderId,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      ...metadata,
      productId,
      orderId,
    },
  };
};
