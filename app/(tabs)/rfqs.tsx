import { YStack, XStack, SizableText, Card, Button, ScrollView, SafeArea, AppHeader, Spinner, Badge, ListItem, BlinkDialog, Input, toast } from '@blinkdotnew/mobile-ui';
import { MessageSquare, Plus, Clock, DollarSign } from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function RFQs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');

  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      return await blink.db.rfqs.list({ orderBy: { created_at: 'desc' } });
    },
  });

  const handleQuoteSubmit = async (rfqId: string) => {
    if (!quoteAmount) {
      toast('Required', { message: 'Please enter a quote amount.', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await blink.db.quotes.create({
        rfqId,
        supplierId: user?.id,
        amount: parseFloat(quoteAmount),
        message: quoteMessage,
        status: 'pending',
      });

      toast('Quote Submitted', { message: 'Your proposal has been sent to the buyer.', variant: 'success' });
      setQuoteAmount('');
      setQuoteMessage('');
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeArea bg="$background">
      <AppHeader
        title="RFQ Marketplace"
        right={<Button size="$3" variant="ghost" icon={<Plus size={18} />} />}
      />
      <ScrollView p="$4">
        <YStack gap="$4">
          <SizableText size="$4" color="$color9">
            Source high-volume orders from businesses looking for suppliers.
          </SizableText>

          {isLoading ? (
            <YStack ai="center" jc="center" py="$10">
              <Spinner color="$color10" />
            </YStack>
          ) : (
            <YStack gap="$3">
              {rfqs?.map((rfq) => (
                <Card key={rfq.id} p="$4" br="$4" bg="white" elevation={2}>
                  <YStack gap="$3">
                    <XStack jc="space-between" ai="center">
                      <SizableText size="$5" fontWeight="700" color="$color11">{rfq.title}</SizableText>
                      <Badge variant="success">OPEN</Badge>
                    </XStack>
                    
                    <SizableText color="$color10" numberOfLines={2}>{rfq.description}</SizableText>
                    
                    <XStack gap="$4" ai="center">
                      <XStack ai="center" gap="$1">
                        <Clock size={14} color="$color9" />
                        <SizableText size="$2" color="$color9">New</SizableText>
                      </XStack>
                      <XStack ai="center" gap="$1">
                        <DollarSign size={14} color="$color9" />
                        <SizableText size="$2" color="$color9">Budget: UGX {Number(rfq.budget).toLocaleString()}</SizableText>
                      </XStack>
                    </XStack>

                    <BlinkDialog
                      trigger={<Button bg="$color10" color="white" mt="$2">Submit Quote</Button>}
                      title="Submit a Proposal"
                      description={`Send a quote for: ${rfq.title}`}
                      onConfirm={() => handleQuoteSubmit(rfq.id)}
                    >
                      <YStack gap="$4" py="$4">
                        <Input
                          label="Your Quote (UGX)"
                          placeholder="0.00"
                          keyboardType="numeric"
                          value={quoteAmount}
                          onChangeText={setQuoteAmount}
                        />
                        <Input
                          label="Message to Buyer"
                          placeholder="Tell them why you're the best fit..."
                          multiline
                          height={80}
                          value={quoteMessage}
                          onChangeText={setQuoteMessage}
                        />
                      </YStack>
                    </BlinkDialog>
                  </YStack>
                </Card>
              ))}
              {rfqs?.length === 0 && (
                <YStack ai="center" jc="center" py="$10">
                  <MessageSquare size={48} color="$color8" />
                  <SizableText mt="$2" color="$color9">No open RFQs at the moment.</SizableText>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
