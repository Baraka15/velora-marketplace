import { YStack, XStack, SizableText, SearchBar, ProductCard, ScrollView, SafeArea, AppHeader, Spinner, Tabs, Badge } from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['marketplace-products', searchQuery, activeTab],
    queryFn: async () => {
      let where: any = {};
      if (searchQuery) {
        where.name = { contains: searchQuery };
      }
      if (activeTab !== 'all') {
        where.type = activeTab;
      }
      return await blink.db.products.list({ where });
    },
  });

  return (
    <SafeArea bg="$background">
      <AppHeader title="Marketplace" />
      <YStack p="$4" gap="$4">
        <SearchBar
          placeholder="Search products, sellers, or categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <XStack gap="$2" fw="wrap">
          {['all', 'physical', 'digital', 'membership'].map((tab) => (
            <Badge
              key={tab}
              variant={activeTab === tab ? 'success' : 'secondary'}
              onPress={() => setActiveTab(tab)}
              p="$2"
              px="$3"
              br="$pill"
            >
              <SizableText color={activeTab === tab ? 'white' : '$color10'} textTransform="capitalize">
                {tab}
              </SizableText>
            </Badge>
          ))}
        </XStack>

        {isLoading ? (
          <YStack ai="center" jc="center" py="$10">
            <Spinner color="$color10" />
          </YStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <XStack fw="wrap" jc="space-between" gap="$3">
              {products?.map((product) => (
                <View key={product.id} style={{ width: '47%' }}>
                  <ProductCard
                    title={product.name}
                    price={`UGX ${Number(product.price).toLocaleString()}`}
                    image={product.image_url}
                    rating={4.8}
                    onPress={() => router.push(`/p/${product.slug}`)}
                  />
                </View>
              ))}
              {products?.length === 0 && (
                <YStack f={1} ai="center" jc="center" py="$10">
                  <SizableText color="$color9">No products found.</SizableText>
                </YStack>
              )}
            </XStack>
          </ScrollView>
        )}
      </YStack>
    </SafeArea>
  );
}