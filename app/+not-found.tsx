import { Link, Stack } from 'expo-router';
import { SizableText, YStack, Button, Container } from '@blinkdotnew/mobile-ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Container ai="center" jc="center" p="$4">
        <YStack ai="center" gap="$4">
          <SizableText size="$9" fontWeight="800">404</SizableText>
          <SizableText size="$5" ta="center">This screen doesn't exist.</SizableText>
          <Link href="/" asChild>
            <Button>Go to home screen!</Button>
          </Link>
        </YStack>
      </Container>
    </>
  );
}
