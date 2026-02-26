import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CadetLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary, // Premium dark active state
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    height: 64, // Slightly taller for breathing room
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700', // Sharper typography
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="documents"
                options={{
                    title: 'Documents',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'Rank',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="trophy-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="announcements"
                options={{
                    title: 'Notice',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="megaphone-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="materials"
                options={{
                    title: 'Materials',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="folder-outline" size={size} color={color} />
                    ),
                }}
            />
            {/* Hidden screens — no tab bar entry */}
            <Tabs.Screen name="attendance-history" options={{ href: null }} />
            <Tabs.Screen name="change-password" options={{ href: null }} />
            <Tabs.Screen name="chat" options={{ href: null }} />
        </Tabs>
    );
}
