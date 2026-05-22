import { YStack, XStack, SizableText, Card, Button, ScrollView, SafeArea, AppHeader, Spinner, ListItem, Divider, toast, Image, Badge } from '@blinkdotnew/mobile-ui';
import { Plus, Edit, Trash2, Globe, Lock, Copy, ChevronRight, MoreVertical } from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Alert, View } from 'react-native';

export default function MyProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      return await blink.db.products.list({
        where: { user_id: user?.id, deleted_at: null },
        orderBy: { created_at: 'desc' }
      });
    },
    enabled: !!user?.id,
  });

  const toggleStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await blink.db.products.update(productId, { status: newStatus });
      toast('Status Updated', { message: `Product is now ${newStatus}.`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['seller-products', user?.id] });
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    }
  };

  const deleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await blink.db.products.update(productId, { deleted_at: new Date().toISOString() });
              toast('Deleted', { message: 'Product has been deleted.', variant: 'success' });
              queryClient.invalidateQueries({ queryKey: ['seller-products', user?.id] });
            } catch (error: any) {
              toast('Error', { message: error.message, variant: 'error' });
            }
          }
        }
      ]
    );
  };

  const copyStoreLink = async (slug: string) => {
    const link = `https://velora.com/p/${slug}`;
    await Clipboard.setStringAsync(link);
    toast('Link Copied', { message: 'Product link copied to clipboard.', variant: 'success' });
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
        title="My Products"
        onBack={() => router.back()}
        variant="back"
        right={
          <Button
            size="$3"
            variant="ghost"
            icon={<Plus size={18} color="$color10" />}
            onPress={() => router.push('/(seller)/create-product')}
          />
        }
      />
      <ScrollView p="$4">
        <YStack gap="$4" pb="$10">
          {products?.map((product) => (
            <Card key={product.id} p="$0" br="$4" bg="white" elevation={2} overflow="hidden">
              <XStack>
                <Image
                  source={{ uri: product.image_url || 'https://picsum.photos/200/200?random=1' }}
                  style={{ width: 100, height: 100 }}
                />
                <YStack f={1} p="$3" jc="space-between">
                  <YStack gap="$1">
                    <XStack jc="space-between" ai="flex-start">
                      <SizableText f={1} fontWeight="700" numberOfLines={1}>{product.name}</SizableText>
                      <Badge variant={product.status === 'published' ? 'success' : 'secondary'} size="$1">
                        {product.status?.toUpperCase()}
                      </Badge>
                    </XStack>
                    <SizableText size="$2" color="$color9">UGX {Number(product.price).toLocaleString()}</SizableText>
                  </YStack>
                  
                  <XStack jc="space-between" ai="center">
                    <XStack gap="$2">
                      <Button
                        size="$2"
                        variant="ghost"
                        circular
                        icon={<Edit size={14} />}
                        onPress={() => {}}
                      />
                      <Button
                        size="$2"
                        variant="ghost"
                        circular
                        icon={<Copy size={14} />}
                        onPress={() => copyStoreLink(product.slug)}
                      />
                      <Button
                        size="$2"
                        variant="ghost"
                        circular
                        icon={product.status === 'published' ? <Globe size={14} color="$success" /> : <Lock size={14} color="$color9" />}
                        onPress={() => toggleStatus(product.id, product.status)}
                      />
                    </XStack>
                    <Button
                      size="$2"
                      variant="ghost"
                      circular
                      icon={<Trash2 size={14} color="$error" />}
                      onPress={() => deleteProduct(product.id)}
                    />
                  </XStack>
                </YStack>
              </XStack>
            </Card>
          ))}

          {products?.length === 0 && (
            <YStack ai="center" jc="center" py="$10" gap="$3">
              <SizableText color="$color9">You haven't added any products yet.</SizableText>
              <Button bg="$color10" color="white" onPress={() => router.push('/(seller)/create-product')}>
                Add Your First Product
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
