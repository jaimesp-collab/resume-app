import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnswersProvider, useAnswers } from '@/lib/AnswersContext';
import { colors } from '@/lib/theme';

function Routes() {
  const { loaded } = useAnswers();
  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AnswersProvider>
        <StatusBar style="dark" />
        <Routes />
      </AnswersProvider>
    </SafeAreaProvider>
  );
}
