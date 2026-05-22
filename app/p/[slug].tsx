import React, { useEffect, useState } from 'react';
import { YStack, XStack, SizableText, Button, ScrollView, SafeArea, AppHeader, Spinner, Image, Card, Badge, Divider, toast } from '@blinkdotnew/mobile-ui';
import { ShoppingCart, Share2, Copy, MessageCircle, ChevronLeft, Star, ShieldCheck } from '@blinkdotnew/mobile-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Platform, Dimensions, Linking } from 'react-native';

const getImageSize = (windowWidth: number) => {
  if (Platform.OS === 'web') {
    return Math.min(windowWidth, 500);
  }
  return windowWidth;
};

export default function PublicProductPage() {
  const { slug, ref: affiliateRef } = useLocalSearchParams();
  const router = useRouter();
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const updateSize = () => {
      const { width } = Dimensions.get('window');
      setImageSize(getImageSize(width));
    };
    
    updateSize();
    const subscription = Dimensions.addEventListener('change', updateSize);
    return () => subscription?.remove();
  }, []);

  // Handle Affiliate Ref Persistence
  useEffect(() => {
    if (affiliateRef) {
      AsyncStorage.setItem(`aff_ref_${slug}`, affiliateRef as string);
    }
  }, [affiliateRef, slug]);

  const { data: product, isLoading } = useQuery({
    queryKey: ['public-product', slug],
    queryFn: async () => {
      const res = await blink.db.products.list({
        where: { slug: slug as string, status: 'published', deleted_at: null }
      });
      if (res.length === 0) throw new Error('Product not found');
      return res[0];
    },
    enabled: !!slug,
  });

  const handleShare = async () => {
    const url = `https://velora.com/p/${slug}`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(url);
      toast('Link Copied', { message: 'Product link copied to clipboard.', variant: 'success' });
    } else {
      await Sharing.shareAsync(url);
    }
  };

  const handleBuyNow = () => {
    router.push({
      pathname: `/checkout/${product.id}`,
      params: { ref: affiliateRef || '' }
    });
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
      <AppHeader
        title=""
        onBack={() => router.back()}
        variant="back"
        right={<Button variant="ghost" icon={<Share2 size={20} color="$color10" />} onPress={handleShare} />}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack pb="$10" ai={Platform.OS === 'web' ? 'center' : undefined}>
          <Image
            source={{ uri: product.image_url || 'https://picsum.photos/600/600' }}
            style={{ 
              width: imageSize, 
              height: imageSize, 
              backgroundColor: '#f1f5f9',
              alignSelf: Platform.OS === 'web' ? 'center' : undefined,
            }}
          />
          
          <YStack p="$4" gap="$4" maxWidth={Platform.OS === 'web' ? 600 : undefined} width="100%">
            <YStack gap="$2">
              <XStack jc="space-between" ai="center">
                <Badge variant="success" size="$1" br="$pill">{product.category || 'General'}</Badge>
                <XStack ai="center" gap="$1">
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <SizableText fontWeight="600">4.8</SizableText>
                  <SizableText size="$2" color="$color9">(124 reviews)</SizableText>
                </XStack>
              </XStack>
              <SizableText size="$7" fontWeight="800" fontFamily="Playfair Display" color="$color11">
                {product.name}
              </SizableText>
              <SizableText size="$8" fontWeight="800" color="$color10">
                UGX {Number(product.price).toLocaleString()}
              </SizableText>
            </YStack>

            <Divider />

            <YStack gap="$2">
              <SizableText size="$5" fontWeight="700">Product Description</SizableText>
              <SizableText color="$color11" lineHeight={22}>
                {product.description || 'No description provided for this product.'}
              </SizableText>
            </YStack>

            <YStack gap="$3" mt="$4">
              <Button
                bg="$color10"
                color="white"
                size="$6"
                fontWeight="800"
                icon={<ShoppingCart size={22} />}
                onPress={handleBuyNow}
              >
                Buy Now
              </Button>
              
              <Button
                variant="outline"
                size="$5"
                icon={<MessageCircle size={20} color="#25D366" />}
                onPress={() => Linking.openURL(`https://wa.me/256700000000?text=I'm interested in ${product.name}`)}
              >
                Chat with Seller
              </Button>
            </YStack>

            <YStack mt="$6" p="$4" br="$4" bg="$backgroundSecondary" gap="$2">
              <XStack ai="center" gap="$2">
                <ShieldCheck size={18} color="$color10" />
                <SizableText fontWeight="700">Velora Buyer Protection</SizableText>
              </XStack>
              <SizableText size="$2" color="$color9">
                Your payment is held in escrow and only released to the seller after you confirm delivery of your {product.type} goods.
              </SizableText>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
