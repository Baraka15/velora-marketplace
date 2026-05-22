import React from 'react';
import { YStack, SizableText, Button, Card, SafeArea, AppHeader, Spinner, Image, XStack } from '@blinkdotnew/mobile-ui';
import { CheckCircle2, Download, Home, ShoppingBag, ExternalLink } from '@blinkdotnew/mobile-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import * as Linking from 'expo-linking';
import { View } from 'react-native';

export default function ThankYou() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-thank-you', orderId],
    queryFn: async () => {
      const o = await blink.db.orders.get(orderId as string);
      if (!o) throw new Error('Order not found');
      
      const p = await blink.db.products.get(o.product_id);
      return { ...o, product: p };
    },
    enabled: !!orderId,
  });

  const handleDownload = async () => {
    if (!order?.download_token || !order.product?.digital_file_url) return;

    try {
      // Increment download count
      await blink.db.orders.update(order.id, {
        download_count: Number(order.download_count || 0) + 1
      });

      // Open the digital file URL
      await Linking.openURL(order.product.digital_file_url);
    } catch (error: any) {
      console.error('Download error:', error);
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
      <AppHeader title="Success" hideBack />
      <YStack f={1} p="$6" ai="center" jc="center" gap="$6">
        <YStack ai="center" gap="$3">
          <CheckCircle2 size={80} color="$success" />
          <SizableText size="$8" fontWeight="800" fontFamily="Playfair Display">Order Successful!</SizableText>
          <SizableText color="$color9" ta="center">
            Thank you for your purchase. A confirmation email has been sent to {order?.buyer_email}.
          </SizableText>
        </YStack>

        <Card p="$4" br="$4" bg="white" elevation={2} width="100%">
          <XStack gap="$4" ai="center">
            <Image
              source={{ uri: order?.product?.image_url || 'https://picsum.photos/200/200' }}
              style={{ width: 60, height: 60, borderRadius: 8 }}
            />
            <YStack f={1}>
              <SizableText fontWeight="700">{order?.product?.name}</SizableText>
              <SizableText size="$2" color="$color9">Order ID: #{order?.id.slice(-8)}</SizableText>
            </YStack>
          </XStack>
        </Card>

        {order?.product?.type === 'digital' && (
          <YStack width="100%" gap="$3">
            <Button
              bg="$color10"
              color="white"
              size="$5"
              fontWeight="700"
              icon={<Download size={20} />}
              onPress={handleDownload}
            >
              Download Content
            </Button>
            <SizableText size="$2" color="$color9" ta="center">
              You can download this file up to 3 times.
            </SizableText>
          </YStack>
        )}

        <YStack width="100%" gap="$3" mt="$4">
          <Button variant="outline" icon={<ShoppingBag size={20} />} onPress={() => router.push('/(tabs)/marketplace')}>
            Continue Shopping
          </Button>
          <Button variant="ghost" icon={<Home size={20} />} onPress={() => router.replace('/(tabs)')}>
            Back to Dashboard
          </Button>
        </YStack>
      </YStack>
    </SafeArea>
  );
}
