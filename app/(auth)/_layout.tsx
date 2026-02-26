import { Tabs } from 'expo-router';

export default function AuthLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
            <Tabs.Screen
                name="login"
                options={{
                    href: null,
                    tabBarIcon: () => null,
                }}
            />
        </Tabs>
    );
}
