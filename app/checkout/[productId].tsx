import React, { useState } from 'react';
import { YStack, XStack, SizableText, Input, Button, ScrollView, SafeArea, AppHeader, toast, Card, Image, Spinner, Badge, Divider } from '@blinkdotnew/mobile-ui';
import { ShoppingCart, ShieldCheck, Lock, CreditCard } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Paystack } from 'react-native-paystack-webview';
import { PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';
import { View, KeyboardAvoidingView, Platform } from 'react-native';

export default function Checkout() {
  const { productId, ref: affiliateRef } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-checkout', productId],
    queryFn: async () => {
      const p = await blink.db.products.get(productId as string);
      if (!p) throw new Error('Product not found');
      return p;
    },
    enabled: !!productId,
  });

  const completeFreeOrder = async () => {
    if (!customer.name || !customer.email) {
      toast('Missing Info', { message: 'Please provide your name and email.', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const orderId = `ord_free_${Date.now()}`;
      const downloadToken = `dlk_${Math.random().toString(36).slice(2, 12)}`;

      await blink.db.orders.create({
        id: orderId,
        buyerId: 'anonymous', // For guest checkout
        sellerId: product.user_id,
        buyerEmail: customer.email,
        buyerName: customer.name,
        totalAmount: 0,
        status: 'completed',
        paymentStatus: 'paid',
        downloadToken,
        paidAt: new Date().toISOString(),
      });

      router.push(`/thank-you?orderId=${orderId}`);
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (res: any) => {
    setLoading(true);
    try {
      const orderId = `ord_${res.transactionRef.reference}`;
      const downloadToken = `dlk_${Math.random().toString(36).slice(2, 12)}`;

      // 1. Create Order
      await blink.db.orders.create({
        id: orderId,
        buyerId: 'anonymous',
        sellerId: product.user_id,
        buyerEmail: customer.email,
        buyerName: customer.name,
        totalAmount: product.price,
        status: product.type === 'digital' ? 'completed' : 'processing',
        paymentStatus: 'paid',
        paymentProvider: 'paystack',
        paymentRef: res.transactionRef.reference,
        downloadToken: product.type === 'digital' ? downloadToken : null,
        affiliateRef: affiliateRef as string || null,
        paidAt: new Date().toISOString(),
      });

      // 2. Create Payment Record
      await blink.db.payments.create({
        orderId,
        amount: product.price,
        gateway: 'paystack',
        transactionRef: res.transactionRef.reference,
        status: 'success',
      });

      // 3. Handle Affiliate Commission if applicable
      if (affiliateRef) {
        const affiliates = await blink.db.affiliates.list({
          where: { code: affiliateRef as string, product_id: product.id }
        });
        
        if (affiliates.length > 0) {
          const aff = affiliates[0];
          const commissionAmount = (product.price * Number(aff.commission_rate)) / 100;
          
          await blink.db.affiliateCommissions.create({
            affiliateId: aff.id,
            orderId,
            productId: product.id,
            amount: commissionAmount,
            status: 'pending',
          });
        }
      }

      router.push(`/thank-you?orderId=${orderId}`);
    } catch (error: any) {
      toast('Error saving order', { message: error.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background">
        <Spinner size="large" color="$color10" />
      </YStack>
    );
  }

  return (
    <SafeArea bg="$background">
      <AppHeader title="Checkout" onBack={() => router.back()} variant="back" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView p="$4">
          <YStack gap="$6" pb="$10">
            <Card p="$4" br="$4" bg="white" elevation={2}>
              <XStack gap="$4">
                <Image
                  source={{ uri: product.image_url || 'https://picsum.photos/200/200?random=1' }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <YStack f={1} gap="$1">
                  <SizableText fontWeight="700" size="$4">{product.name}</SizableText>
                  <SizableText color="$color10" fontWeight="600">UGX {Number(product.price).toLocaleString()}</SizableText>
                  <Badge variant="secondary" size="$1" alignSelf="flex-start">
                    {product.type?.toUpperCase()}
                  </Badge>
                </YStack>
              </XStack>
            </Card>

            <YStack gap="$4">
              <SizableText size="$5" fontWeight="700">Customer Information</SizableText>
              <YStack gap="$3">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={customer.name}
                  onChangeText={(t) => setCustomer({ ...customer, name: t })}
                />
                <Input
                  label="Email Address"
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={customer.email}
                  onChangeText={(t) => setCustomer({ ...customer, email: t })}
                />
              </YStack>
            </YStack>

            <YStack gap="$4">
              <SizableText size="$5" fontWeight="700">Order Summary</SizableText>
              <Card p="$4" br="$4" bg="white" elevation={1}>
                <YStack gap="$2">
                  <XStack jc="space-between">
                    <SizableText color="$color9">Subtotal</SizableText>
                    <SizableText>UGX {Number(product.price).toLocaleString()}</SizableText>
                  </XStack>
                  <XStack jc="space-between">
                    <SizableText color="$color9">Transaction Fee</SizableText>
                    <SizableText>UGX 0</SizableText>
                  </XStack>
                  <Divider my="$2" />
                  <XStack jc="space-between">
                    <SizableText fontWeight="700" size="$5">Total</SizableText>
                    <SizableText fontWeight="700" size="$5" color="$color10">
                      UGX {Number(product.price).toLocaleString()}
                    </SizableText>
                  </XStack>
                </YStack>
              </Card>
            </YStack>

            <YStack gap="$3">
              <XStack ai="center" gap="$2" jc="center" mb="$2">
                <ShieldCheck size={16} color="$success" />
                <SizableText size="$2" color="$color9">Secure Checkout powered by Paystack</SizableText>
              </XStack>
              
              {Number(product.price) === 0 ? (
                <Button
                  bg="$color10"
                  color="white"
                  size="$5"
                  fontWeight="700"
                  onPress={completeFreeOrder}
                  loading={loading}
                >
                  Get for Free
                </Button>
              ) : (
                <View>
                  <Paystack
                    paystackKey={PAYSTACK_PUBLIC_KEY}
                    amount={Number(product.price)}
                    billingEmail={customer.email}
                    billingName={customer.name}
                    activityIndicatorColor="#0f766e"
                    onCancel={() => toast('Payment Cancelled', { variant: 'info' })}
                    onSuccess={onPaymentSuccess}
                    autoStart={false}
                    renderButton={({ onPress }) => (
                      <Button
                        bg="$color10"
                        color="white"
                        size="$5"
                        fontWeight="700"
                        onPress={() => {
                          if (!customer.name || !customer.email) {
                            toast('Missing Info', { message: 'Please provide your name and email.', variant: 'error' });
                            return;
                          }
                          onPress();
                        }}
                        loading={loading}
                        icon={<CreditCard size={20} />}
                      >
                        Pay Now
                      </Button>
                    )}
                  />
                </View>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
