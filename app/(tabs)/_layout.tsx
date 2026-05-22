import { Tabs } from 'expo-router';
import { LayoutDashboard, ShoppingBag, MessageSquare, Landmark, User, Home, Search, ShoppingCart, DollarSign, Briefcase } from '@blinkdotnew/mobile-ui';
import { useTheme } from '@blinkdotnew/mobile-ui';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color10?.val || '#0f766e',
        tabBarInactiveTintColor: theme.color8?.val || '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Source',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rfqs"
        options={{
          title: 'RFQs',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
