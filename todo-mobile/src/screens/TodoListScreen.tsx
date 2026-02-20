import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { todosApi, storage, type Todo } from '../services/api';

interface Props {
  onLogout?: () => void;
}

const PRIORITY_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#3b82f6', 4: '#94a3b8' };

export function TodoListScreen({ onLogout }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState(3);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => { loadTodos(); }, []);

  const loadTodos = async () => {
    try {
      const data = await todosApi.findAll();
      setTodos(data.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime(), updatedAt: new Date(t.updatedAt).getTime() })));
      setLastSync(Date.now());
    } catch { Alert.alert('错误', '加载失败'); }
    finally { setLoading(false); }
  };

  const syncTodos = async () => {
    try {
      const changes = await todosApi.sync(lastSync);
      if (changes.length) {
        setTodos(prev => {
          const map = new Map(prev.map(t => [t.id, t]));
          changes.forEach(c => {
            if (c._action === 'create' || c._action === 'update') map.set(c.id, { ...c, createdAt: new Date(c.createdAt).getTime(), updatedAt: new Date(c.updatedAt).getTime() });
            else if (c._action === 'delete') map.delete(c.id);
          });
          return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        });
      }
    } catch {}
    setLastSync(Date.now());
  };

  const handleAdd = async () => {
    if (!input.trim()) return;
    try {
      const t = await todosApi.create(input.trim(), priority);
      setTodos(prev => [{ ...t, createdAt: new Date(t.createdAt).getTime(), updatedAt: new Date(t.updatedAt).getTime() }, ...prev]);
      setInput('');
      syncTodos();
    } catch { Alert.alert('错误', '添加失败'); }
  };

  const handleToggle = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    try {
      await todosApi.update(id, { completed: !todo.completed });
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      syncTodos();
    } catch {}
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除', '确定删除？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try { await todosApi.delete(id); setTodos(prev => prev.filter(t => t.id !== id)); syncTodos(); } catch {}
      }}
    ]);
  };

  const handleLogout = async () => {
    await storage.removeToken();
    onLogout?.();
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={[styles.item, { borderLeftColor: PRIORITY_COLORS[item.priority] }]}
      onPress={() => handleToggle(item.id)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, item.completed && styles.completed]}>{item.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
          <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" style={styles.loader} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}><Text style={styles.titleIconText}>✓</Text></View>
          <Text style={styles.title}>待办事项</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.addTodo}>
          <View style={styles.addRow}>
            <TextInput 
              style={styles.input} 
              placeholder="添加新待办..." 
              value={input} 
              onChangeText={setInput} 
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.prioritySelector}>
            <Text style={styles.priorityLabel}>优先级</Text>
            {[1,2,3,4].map(p => (
              <TouchableOpacity 
                key={p} 
                style={[styles.priorityBtn, { borderColor: PRIORITY_COLORS[p] }, priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityBtnText, priority === p && { color: '#fff' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList 
        data={todos} 
        keyExtractor={i => i.id} 
        renderItem={renderItem} 
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.list} 
        ListEmptyComponent={<Text style={styles.empty}>暂无待办</Text>}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutBtnText}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0 },
  loader: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  titleIconText: { color: '#fff', fontSize: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#6366f1' },
  logout: { color: '#ef4444', fontSize: 16 },
  card: { paddingHorizontal: 24, paddingBottom: 16 },
  addTodo: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  addRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  input: { flex: 1, padding: 14, fontSize: 16, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#fff' },
  addBtn: { width: 52, height: 52, backgroundColor: '#6366f1', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24 },
  prioritySelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityLabel: { fontSize: 14, color: '#64748b', marginRight: 8 },
  priorityBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  priorityBtnText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 16, color: '#1e293b', marginBottom: 4 },
  completed: { textDecorationLine: 'line-through', color: '#94a3b8' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  itemDate: { fontSize: 12, color: '#94a3b8' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  checkboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkmark: { color: '#fff', fontSize: 14 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 16 },
  footer: { padding: 16, paddingBottom: 32 },
  logoutBtn: { paddingVertical: 12, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  logoutBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
});
