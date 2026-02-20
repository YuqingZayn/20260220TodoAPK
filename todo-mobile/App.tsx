import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoginScreen } from './src/screens/LoginScreen';
import { TodoListScreen } from './src/screens/TodoListScreen';
import { storage } from './src/services/api';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const t = await storage.getToken();
    setToken(t);
    setLoading(false);
  };

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  if (loading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loading}>
          <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
          <Text>加载中...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!token) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <LoginScreen onLogin={handleLogin} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <TodoListScreen onLogout={handleLogout} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
});
