import { YStack, XStack, SizableText, Card, Button, ScrollView, SafeArea, AppHeader, Spinner, ListItem, Divider, toast } from '@blinkdotnew/mobile-ui';
import { TrendingUp, Users, DollarSign, Copy, ExternalLink, ChevronRight, BarChart3 } from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import * as Clipboard from 'expo-clipboard';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['affiliate-stats', user?.id],
    queryFn: async () => {
      const affiliates = await blink.db.affiliates.list({ where: { user_id: user?.id } });
      const commissions = await blink.db.affiliateCommissions.list({
        where: { affiliate_id: { in: affiliates.map(a => a.id) } }
      });

      const totalEarnings = commissions.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const pendingEarnings = commissions
        .filter(c => c.status === 'pending')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      return {
        affiliates,
        commissions,
        totalEarnings,
        pendingEarnings,
        totalClicks: 1240, // Simulated for demo
      };
    },
    enabled: !!user?.id,
  });

  const copyAffiliateLink = async (slug: string, code: string) => {
    const link = `https://velora.com/p/${slug}?ref=${code}`;
    await Clipboard.setStringAsync(link);
    toast('Link Copied', { message: 'Your affiliate link is ready to share!', variant: 'success' });
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
      <AppHeader title="Affiliate Hub" onBack={() => router.back()} variant="back" />
      <ScrollView p="$4">
        <YStack gap="$6" pb="$10">
          <YStack gap="$1">
            <SizableText size="$8" fontWeight="800" fontFamily="Playfair Display">Affiliate Earnings</SizableText>
            <SizableText color="$color9">Track your referrals and commissions.</SizableText>
          </YStack>

          <XStack gap="$3">
            <Card f={1} p="$4" br="$4" bg="$color10" elevation={2}>
              <YStack gap="$1">
                <SizableText color="white" size="$2" o={0.8}>TOTAL EARNINGS</SizableText>
                <SizableText color="white" size="$6" fontWeight="800">UGX {stats?.totalEarnings.toLocaleString()}</SizableText>
              </YStack>
            </Card>
            <Card f={1} p="$4" br="$4" bg="white" elevation={1}>
              <YStack gap="$1">
                <SizableText color="$color9" size="$2">PENDING</SizableText>
                <SizableText color="$color10" size="$6" fontWeight="800">UGX {stats?.pendingEarnings.toLocaleString()}</SizableText>
              </YStack>
            </Card>
          </XStack>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">My Affiliate Links</SizableText>
            <YStack gap="$3">
              {stats?.affiliates.map((aff) => (
                <Card key={aff.id} p="$4" br="$4" bg="white" elevation={1}>
                  <YStack gap="$3">
                    <XStack jc="space-between" ai="center">
                      <SizableText fontWeight="700" size="$4">Product ID: {aff.product_id.slice(-8)}</SizableText>
                      <SizableText color="$color10" fontWeight="600">{aff.commission_rate}% Commission</SizableText>
                    </XStack>
                    <Divider />
                    <XStack jc="space-between" ai="center">
                      <YStack>
                        <SizableText size="$2" color="$color9">Status</SizableText>
                        <SizableText fontWeight="600" textTransform="capitalize">{aff.status}</SizableText>
                      </YStack>
                      <Button
                        size="$3"
                        variant="outline"
                        icon={<Copy size={16} />}
                        onPress={() => copyAffiliateLink('slug-placeholder', aff.code)}
                      >
                        Copy Link
                      </Button>
                    </XStack>
                  </YStack>
                </Card>
              ))}
              {(!stats?.affiliates || stats.affiliates.length === 0) && (
                <YStack p="$6" ai="center" bg="$backgroundSecondary" br="$4">
                  <SizableText color="$color9">You haven't applied to any affiliate programs.</SizableText>
                  <Button mt="$4" variant="outline" onPress={() => router.push('/(tabs)/marketplace')}>
                    Browse Marketplace
                  </Button>
                </YStack>
              )}
            </YStack>
          </YStack>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Recent Conversions</SizableText>
            <Card bg="white" br="$4" elevation={1} overflow="hidden">
              {stats?.commissions.map((comm, index) => (
                <YStack key={comm.id}>
                  <ListItem
                    title={`Sale Referral #${comm.order_id.slice(-4)}`}
                    subtitle={new Date(comm.created_at).toLocaleDateString()}
                    icon={<TrendingUp color="$success" size={20} />}
                    right={<SizableText fontWeight="600" color="$success">+UGX {Number(comm.amount).toLocaleString()}</SizableText>}
                  />
                  {index < stats.commissions.length - 1 && <Divider />}
                </YStack>
              ))}
              {(!stats?.commissions || stats.commissions.length === 0) && (
                <YStack p="$6" ai="center">
                  <SizableText color="$color9">No conversions yet.</SizableText>
                </YStack>
              )}
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
