import { YStack, XStack, SizableText, Card, Button, ScrollView, SafeArea, AppHeader, Avatar, ListItem, Divider, Switch, Label, toast } from '@blinkdotnew/mobile-ui';
import { User, Settings, ShoppingBag, Store, HelpCircle, LogOut, ChevronRight, Briefcase, Box, MessageCircle, BarChart2, Users } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await blink.db.profiles.list({ where: { user_id: user?.id } });
      return res[0];
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    try {
      await blink.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    }
  };

  const toggleSupplierMode = async (value: boolean) => {
    try {
      if (profile) {
        await blink.db.profiles.update(profile.id, { is_supplier: value });
        toast('Mode Switched', { message: `You are now in ${value ? 'Supplier' : 'Retailer'} mode.`, variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      }
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    }
  };

  return (
    <SafeArea bg="$background">
      <AppHeader title="Seller Hub" />
      <ScrollView p="$4">
        <YStack gap="$6">
          <XStack ai="center" gap="$4">
            <Avatar size="$6" br="$pill" src={user?.avatarUrl} />
            <YStack f={1}>
              <SizableText size="$6" fontWeight="700">{user?.displayName || 'Velora User'}</SizableText>
              <SizableText color="$color9">{user?.email}</SizableText>
            </YStack>
            <Button size="$3" variant="outline" icon={<Settings size={18} />} />
          </XStack>

          <Card p="$4" br="$4" bg="$color10" elevation={2}>
            <XStack ai="center" jc="space-between">
              <YStack f={1} gap="$1">
                <SizableText color="white" fontWeight="700" size="$4">Supplier Mode</SizableText>
                <SizableText color="white" o={0.8} size="$2">Switch to wholesale view and bulk pricing.</SizableText>
              </YStack>
              <Switch
                size="$3"
                value={Number(profile?.is_supplier) > 0}
                onValueChange={toggleSupplierMode}
                bg="rgba(255,255,255,0.2)"
              />
            </XStack>
          </Card>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Store Management</SizableText>
            <Card bg="white" br="$4" elevation={1} overflow="hidden">
              <ListItem
                title="My Products"
                subtitle="Manage your inventory and variants"
                icon={<Box size={20} color="$color10" />}
                onPress={() => router.push('/(seller)/products')}
                right={<ChevronRight size={18} color="$color8" />}
              />
              <Divider />
              <ListItem
                title="Affiliate Hub"
                subtitle="Track referrals and commissions"
                icon={<Users size={20} color="$color10" />}
                onPress={() => router.push('/(affiliate)/dashboard')}
                right={<ChevronRight size={18} color="$color8" />}
              />
              <Divider />
              <ListItem
                title="Storefront Settings"
                subtitle="Customize your public store page"
                icon={<Store size={20} color="$color10" />}
                onPress={() => {}}
                right={<ChevronRight size={18} color="$color8" />}
              />
              <Divider />
              <ListItem
                title="Analytics & Reports"
                subtitle="Detailed insights into your sales"
                icon={<BarChart2 size={20} color="$color10" />}
                onPress={() => {}}
                right={<ChevronRight size={18} color="$color8" />}
              />
              <Divider />
              <ListItem
                title="WhatsApp Auto-Order"
                subtitle="Configure WhatsApp pre-filled orders"
                icon={<MessageCircle size={20} color="$color10" />}
                onPress={() => {}}
                right={<ChevronRight size={18} color="$color8" />}
              />
            </Card>
          </YStack>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Account</SizableText>
            <Card bg="white" br="$4" elevation={1} overflow="hidden">
              <ListItem
                title="Help & Support"
                icon={<HelpCircle size={20} color="$color9" />}
                onPress={() => {}}
              />
              <Divider />
              <ListItem
                title="Sign Out"
                icon={<LogOut size={20} color="$error" />}
                onPress={handleSignOut}
              />
            </Card>
          </YStack>

          <YStack ai="center" mt="$4" mb="$8">
            <SizableText color="$color8" size="$2">Velora Marketplace v1.0.0</SizableText>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
