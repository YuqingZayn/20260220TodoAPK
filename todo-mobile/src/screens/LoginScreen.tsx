import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, storage } from '../services/api';

const REMEMBER_EMAIL_KEY = 'remember_email';
const REMEMBER_PASSWORD_KEY = 'remember_password';

interface Props { onLogin: (token: string) => void; }

export function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
      const savedPassword = await AsyncStorage.getItem(REMEMBER_PASSWORD_KEY);
      if (savedEmail) { setEmail(savedEmail); setRememberEmail(true); }
      if (savedPassword) { setPassword(savedPassword); setRememberPassword(true); }
    } catch {}
  };

  const handleSendCode = async () => {
    if (!email) { Alert.alert('提示', '请输入邮箱'); return; }
    setLoading(true);
    try {
      await authApi.sendCode(email);
      setCountdown(60);
      const timer = setInterval(() => setCountdown(c => { if (c <= 1) clearInterval(timer); return c - 1; }), 1000);
      Alert.alert('成功', '验证码已发送到您的邮箱');
    } catch (e: any) { Alert.alert('错误', e.response?.data?.error?.message || '发送失败'); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('提示', '请输入邮箱和密码'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const token = res.data?.access_token || res.access_token;
      if (token) {
        if (rememberEmail) await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email);
        else await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
        if (rememberPassword) await AsyncStorage.setItem(REMEMBER_PASSWORD_KEY, password);
        else await AsyncStorage.removeItem(REMEMBER_PASSWORD_KEY);
        await storage.setToken(token);
        onLogin(token);
      } else { Alert.alert('错误', '登录失败'); }
    } catch (e: any) { Alert.alert('错误', e.response?.data?.error?.message || '网络错误'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!email || !code || !newPassword) { Alert.alert('提示', '请填写完整'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      Alert.alert('成功', '密码重置成功，请登录');
      setMode('login');
      setPassword(newPassword);
    } catch (e: any) { Alert.alert('错误', e.response?.data?.error?.message || '重置失败'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleIcon}><Text style={styles.titleIconText}>✓</Text></View>
          <Text style={styles.title}>{mode === 'login' ? '待办事项' : '找回密码'}</Text>
          <Text style={styles.subtitle}>{mode === 'login' ? '登录后同步待办' : '重置您的密码'}</Text>
        </View>
        
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="邮箱地址" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" />
          
          {mode === 'login' ? (
            <>
              <TextInput style={styles.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#94a3b8" />
              
              <View style={styles.options}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>记住账号</Text>
                  <Switch value={rememberEmail} onValueChange={setRememberEmail} trackColor={{ true: '#6366f1' }} />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>记住密码</Text>
                  <Switch value={rememberPassword} onValueChange={setRememberPassword} trackColor={{ true: '#6366f1' }} />
                </View>
              </View>
              
              <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>登 录</Text>}
              </TouchableOpacity>
              
              <View style={styles.links}>
                <TouchableOpacity onPress={() => setMode('forgot')}><Text style={styles.linkText}>忘记密码？</Text></TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.codeRow}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="验证码" value={code} onChangeText={setCode} placeholderTextColor="#94a3b8" />
                <TouchableOpacity style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]} onPress={handleSendCode} disabled={countdown > 0}>
                  <Text style={styles.codeBtnText}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput style={styles.input} placeholder="新密码" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor="#94a3b8" />
              
              <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>重置密码</Text>}
              </TouchableOpacity>
              
              <View style={styles.links}>
                <TouchableOpacity onPress={() => setMode('login')}><Text style={styles.linkText}>记起密码？立即登录</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  titleIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  titleIconText: { color: '#fff', fontSize: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#6366f1', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b' },
  form: {},
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, borderWidth: 2, borderColor: '#e2e8f0', color: '#1e293b' },
  options: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 14, color: '#64748b', marginRight: 8 },
  btn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  links: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkText: { color: '#6366f1', fontSize: 14 },
  codeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  codeBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  codeBtnDisabled: { backgroundColor: '#ccc' },
  codeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
