import { YStack, XStack, SizableText, Card, Button, ScrollView, SafeArea, AppHeader, Spinner, ListItem, Divider } from '@blinkdotnew/mobile-ui';
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark, CreditCard, ChevronRight } from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Finance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const res = await blink.db.wallets.list({ where: { user_id: user?.id } });
      return res[0] || { balance: 0, escrow_balance: 0 };
    },
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      // In a real app, we'd join orders/payments. Simulating with payments list.
      return await blink.db.payments.list({ orderBy: { created_at: 'desc' }, limit: 10 });
    },
    enabled: !!user?.id,
  });

  const handleWithdraw = async () => {
    if (!wallet || Number(wallet.balance) <= 0) {
      toast('No Funds', { message: 'You do not have any funds to withdraw.', variant: 'error' });
      return;
    }

    setWithdrawing(true);
    try {
      const amount = Number(wallet.balance);
      await blink.db.payouts.create({
        sellerId: user?.id,
        amount,
        status: 'pending',
        method: 'Bank Transfer',
      });

      await blink.db.wallets.update(wallet.id, { balance: 0 });
      
      toast('Withdrawal Requested', { message: `Your withdrawal of UGX ${amount.toLocaleString()} is being processed.`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <SafeArea bg="$background">
      <AppHeader title="Finance & Payments" />
      <ScrollView p="$4">
        <YStack gap="$4">
          <Card p="$6" br="$6" bg="$color10" elevation={4}>
            <YStack gap="$4">
              <YStack>
                <SizableText color="white" o={0.8} size="$3">TOTAL WALLET BALANCE</SizableText>
                <SizableText color="white" size="$9" fontWeight="800" mt="$1">
                  UGX {Number(wallet?.balance || 0).toLocaleString()}
                </SizableText>
              </YStack>
              
              <XStack gap="$3">
                <Button 
                  f={1} 
                  bg="white" 
                  color="$color10" 
                  icon={<ArrowUpRight size={18} />}
                  onPress={handleWithdraw}
                  loading={withdrawing}
                >
                  Withdraw
                </Button>
                <Button f={1} variant="outline" borderColor="rgba(255,255,255,0.3)" bg="rgba(255,255,255,0.1)" color="white" icon={<Landmark size={18} />}>
                  Banks
                </Button>
              </XStack>
            </YStack>
          </Card>

          <XStack gap="$3">
            <Card f={1} p="$4" br="$4" bg="white" elevation={1}>
              <SizableText size="$2" color="$color9">ESCROW (PENDING)</SizableText>
              <SizableText size="$5" fontWeight="700" mt="$1">UGX {Number(wallet?.escrow_balance || 0).toLocaleString()}</SizableText>
            </Card>
            <Card f={1} p="$4" br="$4" bg="white" elevation={1}>
              <SizableText size="$2" color="$color9">LIFETIME SALES</SizableText>
              <SizableText size="$5" fontWeight="700" mt="$1">UGX 1.2M</SizableText>
            </Card>
          </XStack>

          <YStack mt="$4" gap="$3">
            <SizableText size="$5" fontWeight="700">Recent Transactions</SizableText>
            <Card bg="white" br="$4" elevation={1} overflow="hidden">
              {transactions?.map((tx, index) => (
                <YStack key={tx.id}>
                  <ListItem
                    title={`Order Payment #${tx.order_id.slice(-4)}`}
                    subtitle={new Date(tx.created_at).toLocaleDateString()}
                    icon={<ArrowDownLeft color="$success" size={20} />}
                    right={<SizableText fontWeight="600" color="$success">+UGX {Number(tx.amount).toLocaleString()}</SizableText>}
                  />
                  {index < transactions.length - 1 && <Divider />}
                </YStack>
              ))}
              {(!transactions || transactions.length === 0) && (
                <YStack p="$6" ai="center">
                  <SizableText color="$color9">No transactions yet.</SizableText>
                </YStack>
              )}
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
