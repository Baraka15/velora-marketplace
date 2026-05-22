import { FinanceDashboard, YStack, XStack, SizableText, Button, Card, Spinner, toast, AppHeader, SafeArea, ScrollView, Badge, Image } from '@blinkdotnew/mobile-ui';
import { Plus, ArrowUpRight, Wallet, TrendingUp, MessageCircle, Send, Menu, Bell } from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Platform, View, Linking } from 'react-native';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

  // Metrics Queries
  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const res = await blink.db.wallets.list({ where: { user_id: user?.id } });
      return res[0] || { balance: 0, escrow_balance: 0 };
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await blink.db.profiles.list({ where: { user_id: user?.id } });
      return res[0];
    },
    enabled: !!user?.id,
  });

  const isSupplier = Number(profile?.is_supplier) > 0;

  const { data: todayRevenue } = useQuery({
    queryKey: ['revenue', 'today', user?.id],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const res = await blink.db.orders.list({
        where: {
          seller_id: user?.id,
          payment_status: 'paid',
          created_at: { gte: startOfDay.toISOString() }
        }
      });
      return res.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    },
    enabled: !!user?.id,
  });

  const { data: weekRevenue } = useQuery({
    queryKey: ['revenue', 'week', user?.id],
    queryFn: async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const res = await blink.db.orders.list({
        where: {
          seller_id: user?.id,
          payment_status: 'paid',
          created_at: { gte: startOfWeek.toISOString() }
        }
      });
      return res.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    },
    enabled: !!user?.id,
  });

  const { data: ordersCount } = useQuery({
    queryKey: ['ordersCount', user?.id],
    queryFn: async () => {
      return await blink.db.orders.count({ where: { seller_id: user?.id } });
    },
    enabled: !!user?.id,
  });

  // Real-time Subscriptions simulation (Refetch on window focus or interval)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['revenue', 'today', user?.id] });
    }, 10000); // Poll every 10 seconds for real-time feel

    return () => clearInterval(interval);
  }, [user?.id]);

  if (loadingWallet) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background">
        <Spinner size="large" color="$color10" />
      </YStack>
    );
  }

  return (
    <SafeArea bg="$background">
      <AppHeader
        title={
          <Image 
            source={require('@/assets/images/velora-logo.png')} 
            style={{ width: 100, height: 36, resizeMode: 'contain' }} 
          />
        }
        right={<XStack gap="$3"><Bell size={24} color="$color10" /><Menu size={24} color="$color10" /></XStack>}
      />
      <ScrollView p="$4">
        <YStack gap="$4">
          <YStack>
            <SizableText size="$3" color="$color9" textTransform="uppercase" letterSpacing={1}>
              {isSupplier ? 'SUPPLIER OPERATIONS' : 'RETAIL OPERATIONS'} · {currentDate.toUpperCase()}
            </SizableText>
            <SizableText size="$8" fontWeight="700" color="$color11" fontFamily="Playfair Display">
              Good day at {user?.displayName || 'Velora'}.
            </SizableText>
          </YStack>

          <XStack gap="$3" fw="wrap">
            <Button
              size="$4"
              bg="$color10"
              color="white"
              icon={<Plus size={18} />}
              onPress={() => router.push('/(seller)/create-product')}
            >
              {isSupplier ? 'New Bulk Listing' : 'New sale'}
            </Button>
            <Button 
              size="$4" 
              variant="outline" 
              icon={<Send size={18} />}
              onPress={() => router.push('/(tabs)/marketplace')}
            >
              {isSupplier ? 'Market Analysis' : 'Source stock'}
            </Button>
            <Button 
              size="$4" 
              variant="outline" 
              bg="#e8f5e9" 
              borderColor="#c8e6c9" 
              color="#2e7d32" 
              icon={<MessageCircle size={18} />}
              onPress={() => Linking.openURL('https://wa.me/256700000000?text=I%20need%20help%20with%20Velora')}
            >
              WhatsApp
            </Button>
          </XStack>

          <FinanceDashboard
            title="Business Metrics"
            balance={`UGX ${wallet?.balance?.toLocaleString() || 0}`}
            balanceLabel="Total Wallet Balance"
            rangeLabel="Instant Updates"
            metrics={[
              { label: 'TODAY REVENUE', value: `UGX ${todayRevenue?.toLocaleString() || 0}`, change: `${ordersCount || 0} orders today` },
              { label: '7 DAYS', value: `UGX ${weekRevenue?.toLocaleString() || 0}`, change: 'orders this week' },
              { label: 'RECEIVABLES', value: `UGX ${wallet?.escrow_balance?.toLocaleString() || 0}`, change: 'Owed by customers' },
              { label: 'B2B IN TRANSIT', value: '0', change: 'Track supplier orders' },
            ]}
            quickActions={[]}
            sections={[]}
          />

          <YStack gap="$3" mt="$4">
            <SizableText size="$5" fontWeight="700">Recent Activity</SizableText>
            <Card p="$4" br="$4" bg="white" elevation={2}>
              <YStack gap="$2">
                <SizableText color="$color9">No recent transactions yet.</SizableText>
                <Button variant="outline" mt="$2">View all sales</Button>
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
