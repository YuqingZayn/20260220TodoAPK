import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar, Modal, Pressable, RefreshControl } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadTodos();

    // 前台每 10 秒自动同步一次（准实时）
    syncTimerRef.current = setInterval(() => {
      syncTodos();
    }, 10_000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, []);

  const loadTodos = async () => {
    try {
      const data = await todosApi.findAll();
      setTodos(data.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime(), updatedAt: new Date(t.updatedAt).getTime() })));
      setLastSync(Date.now());
    } catch {}
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

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await todosApi.delete(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      syncTodos();
    } catch {}
  };

  const handleAdd = async () => {
    if (!input.trim()) return;
    try {
      const t = await todosApi.create(input.trim(), priority);
      setTodos(prev => [{ ...t, createdAt: new Date(t.createdAt).getTime(), updatedAt: new Date(t.updatedAt).getTime() }, ...prev]);
      setInput('');
      syncTodos();
    } catch {}
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
    requestDelete(id);
  };

  const onPullToRefresh = async () => {
    setRefreshing(true);
    try {
      await syncTodos();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await storage.removeToken();
    onLogout?.();
  };

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteActionText}>🗑️</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id)}
      friction={2}
      rightThreshold={40}
    >
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
    </Swipeable>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullToRefresh} />}
        contentContainerStyle={styles.list} 
        ListEmptyComponent={<Text style={styles.empty}>暂无待办</Text>}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutBtnText}>退出登录</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={deleteId !== null}
        animationType="fade"
        onRequestClose={() => setDeleteId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteId(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>删除任务</Text>
            <Text style={styles.modalDesc}>确定删除这条待办吗？</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setDeleteId(null)} activeOpacity={0.8}>
                <Text style={styles.modalBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={confirmDelete} activeOpacity={0.8}>
                <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>删除</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f1f5f9' },
  modalBtnText: { color: '#1e293b', fontSize: 14, fontWeight: '600' },
  modalBtnDanger: { backgroundColor: '#fee2e2' },
  modalBtnDangerText: { color: '#b91c1c' },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '88%', // 稍微小于 item 高度，避免阴影重叠
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  deleteActionText: {
    fontSize: 24,
  },
});
