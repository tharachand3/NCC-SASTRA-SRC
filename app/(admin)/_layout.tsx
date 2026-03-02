import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdminLayout() {
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
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cadets"
                options={{
                    title: 'Cadets',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkbox-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="documents"
                options={{
                    title: 'Docs',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="documents-outline" size={size} color={color} />
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
            {/* Hidden screens — not shown in tab bar */}
            <Tabs.Screen name="add-cadet" options={{ href: null }} />
            <Tabs.Screen name="cadet-detail" options={{ href: null }} />
            <Tabs.Screen name="edit-cadet" options={{ href: null }} />
            <Tabs.Screen name="alumni" options={{ href: null }} />
            <Tabs.Screen name="add-announcement" options={{ href: null }} />
            <Tabs.Screen name="attendance-history" options={{ href: null }} />
            <Tabs.Screen name="attendance-detail" options={{ href: null }} />
            <Tabs.Screen name="add-admin" options={{ href: null }} />
        </Tabs>
    );
}
