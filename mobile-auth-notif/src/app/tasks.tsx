import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { setupPushNotifications } from '../notifications';

const API_URL = 'http://192.168.110.48:3000';

type Task = {
  id: number;
  judul: string;
  deskripsi: string | null;
  status: string;
  deadline?: string | null;
  dibuat_pada?: string;
};

function formatDeadlineInput(value?: string | null): string {
  if (!value) return '';

  // Pertahankan waktu lokal dari database/API.
  // Jangan mengubah string waktu menjadi Date karena bisa bergeser zona waktu.
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/,
  );

  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return value;
}

function isValidDeadline(value: string): boolean {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/,
  );

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    month < 1 ||
    month > 12 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const completedTasks = tasks.filter(
    (task) => task.status === 'Selesai',
  ).length;

  const pendingTasks = tasks.length - completedTasks;
  const progress =
    tasks.length > 0 ? completedTasks / tasks.length : 0;

  const fetchTasks = useCallback(async () => {
    try {
      setErrorMessage('');

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        setErrorMessage(
          'Sesi login tidak ditemukan. Silakan login kembali.',
        );
        setTasks([]);
        return;
      }

      if (Platform.OS !== 'web') {
        try {
          await setupPushNotifications(token);
        } catch (notificationError) {
          console.error(
            'Setup push notification error:',
            notificationError,
          );
        }
      }

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal mengambil daftar tugas.',
        );
      }

      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data.tasks)
          ? data.tasks
          : Array.isArray(data.data)
            ? data.data
            : [];

      setTasks(taskList);
    } catch (error) {
      console.error('Fetch tasks error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Tidak dapat terhubung ke server.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks();
    }, [fetchTasks]),
  );

  // FITUR LOGOUT
  const handleLogout = () => {
    Alert.alert(
      'Logout ↪️',
      'Yakin ingin keluar dari akun?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('token');
              setTasks([]);
              router.replace('/');
            } catch (error) {
              Alert.alert(
                'Logout gagal',
                'Terjadi kesalahan saat keluar. Coba lagi.',
              );
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setEditingTask(null);
    setJudul('');
    setDeskripsi('');
    setDeadline('');
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setJudul(task.judul);
    setDeskripsi(task.deskripsi ?? '');
    setDeadline(formatDeadlineInput(task.deadline));
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    resetForm();
  };

  const saveTask = async () => {
    const cleanTitle = judul.trim();
    const cleanDescription = deskripsi.trim();
    const cleanDeadline = deadline.trim();

    if (!cleanTitle) {
      Alert.alert(
        'Judul belum diisi 🎀',
        'Masukkan judul tugas terlebih dahulu.',
      );
      return;
    }

    if (cleanDeadline && !isValidDeadline(cleanDeadline)) {
      Alert.alert(
        'Format deadline belum sesuai 📅',
        'Masukkan tanggal dan jam dengan format YYYY-MM-DD HH:mm, misalnya 2026-10-26 20:00.',
      );
      return;
    }

    const taskBeingEdited = editingTask;

    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        Alert.alert('Sesi berakhir', 'Silakan login kembali.');
        return;
      }

      const url = taskBeingEdited
        ? `${API_URL}/api/tasks/${taskBeingEdited.id}`
        : `${API_URL}/api/tasks`;

      // Kirim waktu sebagai string lokal.
      // Nilai kosong dikirim sebagai null untuk menghapus deadline.
      const deadlineValue = cleanDeadline
        ? `${cleanDeadline}:00`
        : null;

      const response = await fetch(url, {
        method: taskBeingEdited ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judul: cleanTitle,
          deskripsi: cleanDescription || null,
          deadline: deadlineValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Tugas gagal disimpan.');
      }

      if (taskBeingEdited) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskBeingEdited.id
              ? {
                  ...task,
                  judul: cleanTitle,
                  deskripsi: cleanDescription || null,
                  deadline: deadlineValue,
                }
              : task,
          ),
        );
      } else {
        await fetchTasks();
      }

      setModalVisible(false);
      resetForm();

      Alert.alert(
        'Berhasil 💗',
        taskBeingEdited
          ? 'Tugas berhasil diperbarui!'
          : 'Tugas baru berhasil ditambahkan!',
      );
    } catch (error) {
      console.error('Save task error:', error);

      Alert.alert(
        'Gagal menyimpan',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan tugas.',
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const oldStatus = task.status;
    const newStatus =
      oldStatus === 'Selesai' ? 'Belum dikerjakan' : 'Selesai';

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? { ...item, status: newStatus }
          : item,
      ),
    );

    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        throw new Error('Sesi login tidak ditemukan.');
      }

      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Status tugas gagal diperbarui.',
        );
      }
    } catch (error) {
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id
            ? { ...item, status: oldStatus }
            : item,
        ),
      );

      Alert.alert(
        'Gagal memperbarui status',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan.',
      );
    }
  };

  const deleteTask = (task: Task) => {
    Alert.alert(
      'Hapus tugas? 🥺',
      `Kamu yakin ingin menghapus "${task.judul}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');

              if (!token) {
                throw new Error('Sesi login tidak ditemukan.');
              }

              const response = await fetch(
                `${API_URL}/api/tasks/${task.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                },
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || 'Tugas gagal dihapus.',
                );
              }

              setTasks((currentTasks) =>
                currentTasks.filter((item) => item.id !== task.id),
              );

              Alert.alert('Berhasil 💗', 'Tugas berhasil dihapus.');
            } catch (error) {
              Alert.alert(
                'Gagal menghapus',
                error instanceof Error
                  ? error.message
                  : 'Terjadi kesalahan.',
              );
            }
          },
        },
      ],
    );
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isCompleted = item.status === 'Selesai';
    const formattedDeadline = formatDeadlineInput(item.deadline);

    return (
      <View
        style={[
          styles.taskCard,
          isCompleted && styles.completedCard,
        ]}
      >
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => toggleTaskStatus(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              isCompleted && styles.checkboxChecked,
            ]}
          >
            {isCompleted && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              isCompleted && styles.completedTitle,
            ]}
          >
            {item.judul}
          </Text>

          {!!item.deskripsi && (
            <Text style={styles.taskDescription}>
              {item.deskripsi}
            </Text>
          )}

          {!!formattedDeadline && (
            <Text style={styles.taskDescription}>
              📅 Deadline: {formattedDeadline}
            </Text>
          )}

          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? styles.statusCompleted
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCompleted
                  ? styles.statusCompletedText
                  : styles.statusPendingText,
              ]}
            >
              {isCompleted ? '✓ Selesai' : '♡ Belum dikerjakan'}
            </Text>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteTask(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hai, nda! 🎀</Text>
          <Text style={styles.headerSubtitle}>
            Yuk, selesaikan tugasmu hari ini.
          </Text>
        </View>

        <View style={styles.headerDecoration}>
          <Text style={styles.headerDecorationText}>♡</Text>
        </View>
      </View>

      {/* TOMBOL LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutButtonText}>↪ Logout</Text>
      </TouchableOpacity>

      <View style={styles.progressCard}>
        <View style={styles.progressHeading}>
          <View>
            <Text style={styles.progressTitle}>Your Progress ✨</Text>
            <Text style={styles.progressSubtitle}>
              Sedikit demi sedikit, jadi bukit!
            </Text>
          </View>

          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total tugas</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⏳</Text>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Belum selesai</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionTitle}>Daftar Tugas </Text>
          <Text style={styles.sectionSubtitle}>
            Semua rencana kecilmu ada di sini.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>＋ Tambah</Text>
        </TouchableOpacity>
      </View>

      {errorMessage !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              fetchTasks();
            }}
          >
            <Text style={styles.retryText}>Coba lagi ↻</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {!loading && (
        <>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyEmoji}>🎀</Text>
          </View>

          <Text style={styles.emptyTitle}>Belum ada tugas, nda!</Text>

          <Text style={styles.emptySubtitle}>
            Yuk, tambahkan tugas pertamamu.
            {'\n'}Kamu pasti bisa! 💗
          </Text>

          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyAddButtonText}>
              ＋ Buat tugas baru
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderListFooter = () => (
    <View style={styles.footerContainer}>
      {tasks.length > 0 && (
        <Text style={styles.footerText}>
          {pendingTasks === 0
            ? 'Yeay! Semua tugas selesai! 🎉💗'
            : 'Semangat menyelesaikan tugasmu! ✨'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      {loading ? (
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          showsVerticalScrollIndicator={false}
        >
          <ActivityIndicator size="large" color="#D85C91" />
          <Text style={styles.loadingText}>
            Menyiapkan tugasmu... 💗
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTask}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeadingText}>
                  <Text style={styles.modalTitle}>
                    {editingTask ? 'Edit Tugas ✎' : 'Tugas Baru 🎀'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Tulis rencanamu di sini, ya!
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Judul tugas</Text>

              <TextInput
                style={styles.input}
                placeholder="Contoh: Mengerjakan tugas kuliah"
                placeholderTextColor="#B99BA9"
                value={judul}
                onChangeText={setJudul}
                maxLength={150}
                editable={!saving}
                autoFocus
              />

              <Text style={styles.inputLabel}>
                Deskripsi <Text style={styles.optionalText}>(opsional)</Text>
              </Text>

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Tambahkan detail tugasmu..."
                placeholderTextColor="#B99BA9"
                value={deskripsi}
                onChangeText={setDeskripsi}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>
                Deadline <Text style={styles.optionalText}>(opsional)</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor="#B99BA9"
                value={deadline}
                onChangeText={setDeadline}
                maxLength={16}
                editable={!saving}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.deadlineHint}>
                Contoh: 2026-10-26 20:00
              </Text>

              <Text style={styles.deadlineHint}>
                Kosongkan jika tugas tidak memiliki deadline.
              </Text>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                ]}
                onPress={saveTask}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingTask
                      ? 'Simpan Perubahan 💗'
                      : 'Tambah Tugas ♡'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FA',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    flexGrow: 1,
  },

  loadingContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#B06C8A',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  greetingContainer: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    fontSize: 27,
    fontWeight: '800',
    color: '#873D60',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#A17C8D',
  },

  headerDecoration: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFE1ED',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  headerDecorationText: {
    fontSize: 32,
    lineHeight: 38,
    color: '#D85C91',
    textAlign: 'center',
    includeFontPadding: false,
  },

  logoutButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0C7D7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 16,
  },

  logoutButtonText: {
    color: '#C85A89',
    fontSize: 13,
    fontWeight: '700',
  },

  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F9E2EB',
    shadowColor: '#C66A91',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  progressHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#873D60',
  },

  progressSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#B08B9B',
  },

  progressPercent: {
    fontSize: 25,
    fontWeight: '800',
    color: '#D85C91',
  },

  progressTrack: {
    height: 9,
    borderRadius: 20,
    backgroundColor: '#FBE7EF',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 22,
  },

  progressFill: {
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E77EAA',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#873D60',
  },

  statLabel: {
    fontSize: 10,
    color: '#A17C8D',
    marginTop: 4,
    textAlign: 'center',
  },

  statDivider: {
    width: 1,
    height: 43,
    backgroundColor: '#F4E1E9',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#873D60',
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#A17C8D',
  },

  addButton: {
    backgroundColor: '#D85C91',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#D85C91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F7E4EC',
    shadowColor: '#C66A91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
  },

  completedCard: {
    backgroundColor: '#FFFBFD',
    borderColor: '#F5E8EE',
  },

  checkButton: {
    paddingTop: 2,
    paddingRight: 12,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.7,
    borderColor: '#E5A3BE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#D85C91',
    borderColor: '#D85C91',
  },

  checkmark: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  taskContent: {
    flex: 1,
    paddingRight: 5,
  },

  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#75435A',
    lineHeight: 21,
  },

  completedTitle: {
    color: '#B6A0AB',
    textDecorationLine: 'line-through',
  },

  taskDescription: {
    fontSize: 12,
    color: '#A18A95',
    lineHeight: 18,
    marginTop: 6,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },

  statusPending: {
    backgroundColor: '#FFF0F5',
  },

  statusCompleted: {
    backgroundColor: '#F1EAFB',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusPendingText: {
    color: '#CF6592',
  },

  statusCompletedText: {
    color: '#8B6AA8',
  },

  taskActions: {
    alignItems: 'center',
    marginLeft: 4,
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  editIcon: {
    fontSize: 19,
    color: '#C85A89',
    fontWeight: '700',
  },

  deleteButton: {
    backgroundColor: '#FFF1F0',
  },

  deleteIcon: {
    fontSize: 20,
    color: '#D97979',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  emptyIllustration: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: '#FFE7F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyEmoji: {
    fontSize: 43,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#873D60',
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 13,
    lineHeight: 21,
    color: '#A17C8D',
    textAlign: 'center',
    marginTop: 8,
  },

  emptyAddButton: {
    marginTop: 20,
    backgroundColor: '#D85C91',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  footerText: {
    fontSize: 12,
    color: '#D85C91',
    textAlign: 'center',
    fontWeight: '600',
  },

  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F7D8DC',
  },

  errorText: {
    color: '#B44B65',
    fontSize: 12,
    lineHeight: 18,
  },

  retryText: {
    marginTop: 9,
    color: '#D85C91',
    fontWeight: '800',
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(75, 35, 54, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  modalScroll: {
    width: '100%',
    flexGrow: 0,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 23,
    borderWidth: 1,
    borderColor: '#F8DCE7',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 23,
  },

  modalHeadingText: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#873D60',
  },

  modalSubtitle: {
    fontSize: 12,
    color: '#A17C8D',
    marginTop: 6,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 25,
    color: '#C85A89',
    lineHeight: 29,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#873D60',
    marginBottom: 9,
  },

  optionalText: {
    fontSize: 11,
    color: '#B99BA9',
    fontWeight: '400',
  },

  input: {
    borderWidth: 1,
    borderColor: '#F0D5E1',
    borderRadius: 14,
    backgroundColor: '#FFFAFC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 13,
    color: '#75435A',
    marginBottom: 19,
  },

  descriptionInput: {
    minHeight: 95,
    maxHeight: 150,
  },

  deadlineHint: {
    fontSize: 11,
    color: '#A17C8D',
    marginTop: -13,
    marginBottom: 15,
    lineHeight: 16,
  },

  saveButton: {
    backgroundColor: '#D85C91',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 3,
    shadowColor: '#D85C91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 5,
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A17C8D',
  },
});