import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useToast } from '../components/ToastProvider';
import { useSession } from '../context/SessionProvider';
import {
  createAdminStreamEntry,
  createAdminTheater,
  deleteAdminStreamEntry,
  deleteAdminTheater,
  subscribeToAdminStreamEntries,
  subscribeToAdminTheaters,
  updateAdminStreamEntry,
  updateAdminTheater,
} from '../services/adminCatalog';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';

const INITIAL_STREAM_FORM = {
  title: '',
  description: '',
  year: '',
  duration: '',
  genre: '',
  language: '',
  region: '',
  format: '',
  mood: '',
  badge: '',
  videoId: '',
};

const INITIAL_THEATER_FORM = {
  state: '',
  city: '',
  name: '',
  area: '',
  formats: '',
  showtimes: '',
  experience: '',
  luxePrice: '',
  primePrice: '',
  classicPrice: '',
};

const AdminPanelScreen = ({ navigation }) => {
  const { isAdmin, profile, loading } = useSession();
  const { showToast } = useToast();
  const [streamEntries, setStreamEntries] = useState([]);
  const [theaterEntries, setTheaterEntries] = useState([]);
  const [streamForm, setStreamForm] = useState(INITIAL_STREAM_FORM);
  const [theaterForm, setTheaterForm] = useState(INITIAL_THEATER_FORM);
  const [editingStreamId, setEditingStreamId] = useState(null);
  const [editingTheaterId, setEditingTheaterId] = useState(null);
  const [streamSearch, setStreamSearch] = useState('');
  const [theaterSearch, setTheaterSearch] = useState('');
  const [savingStream, setSavingStream] = useState(false);
  const [savingTheater, setSavingTheater] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      return () => {};
    }

    const unsubscribeStream = subscribeToAdminStreamEntries(
      setStreamEntries,
      (error) => console.error('Unable to load admin stream entries:', error),
    );
    const unsubscribeTheaters = subscribeToAdminTheaters(
      setTheaterEntries,
      (error) => console.error('Unable to load admin theaters:', error),
    );

    return () => {
      unsubscribeStream();
      unsubscribeTheaters();
    };
  }, [isAdmin]);

  const filteredStreamEntries = useMemo(() => {
    const normalizedQuery = streamSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return streamEntries;
    }

    return streamEntries.filter((entry) =>
      [entry.title, entry.genre, entry.language, entry.badge]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [streamEntries, streamSearch]);

  const filteredTheaterEntries = useMemo(() => {
    const normalizedQuery = theaterSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return theaterEntries;
    }

    return theaterEntries.filter((entry) =>
      [entry.name, entry.city, entry.state, entry.area]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [theaterEntries, theaterSearch]);

  const resetStreamForm = () => {
    setStreamForm(INITIAL_STREAM_FORM);
    setEditingStreamId(null);
  };

  const resetTheaterForm = () => {
    setTheaterForm(INITIAL_THEATER_FORM);
    setEditingTheaterId(null);
  };

  const handleSaveStream = async () => {
    if (!streamForm.title.trim() || !streamForm.videoId.trim()) {
      showToast('Stream title and YouTube link or video ID are required.', { type: 'error' });
      return;
    }

    setSavingStream(true);

    try {
      if (editingStreamId) {
        await updateAdminStreamEntry(editingStreamId, streamForm);
        showToast('Stream item updated.', { type: 'success' });
      } else {
        await createAdminStreamEntry(streamForm);
        showToast('Stream item added.', { type: 'success' });
      }
      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      resetStreamForm();
    } catch (error) {
      console.error('Unable to save stream entry:', error);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Unable to save stream content right now.', { type: 'error' });
    } finally {
      setSavingStream(false);
    }
  };

  const handleSaveTheater = async () => {
    if (!theaterForm.state.trim() || !theaterForm.city.trim() || !theaterForm.name.trim()) {
      showToast('State, city, and theatre name are required.', { type: 'error' });
      return;
    }

    setSavingTheater(true);

    try {
      if (editingTheaterId) {
        await updateAdminTheater(editingTheaterId, theaterForm);
        showToast('Theatre updated.', { type: 'success' });
      } else {
        await createAdminTheater(theaterForm);
        showToast('Theatre added.', { type: 'success' });
      }
      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      resetTheaterForm();
    } catch (error) {
      console.error('Unable to save theater entry:', error);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Unable to save theatre details right now.', { type: 'error' });
    } finally {
      setSavingTheater(false);
    }
  };

  const startEditStream = (entry) => {
    setEditingStreamId(entry.id);
    setStreamForm({
      title: entry.title || '',
      description: entry.description || '',
      year: entry.year ? String(entry.year) : '',
      duration: entry.duration || '',
      genre: entry.genre || '',
      language: entry.language || '',
      region: entry.region || '',
      format: entry.format || '',
      mood: entry.mood || '',
      badge: entry.badge || '',
      videoId: entry.videoId || '',
    });
  };

  const startEditTheater = (entry) => {
    setEditingTheaterId(entry.id);
    setTheaterForm({
      state: entry.state || '',
      city: entry.city || '',
      name: entry.name || '',
      area: entry.area || '',
      formats: (entry.formats || []).join(', '),
      showtimes: (entry.showtimes || []).join(', '),
      experience: entry.experience || '',
      luxePrice: entry.seatPricing?.Luxe ? String(entry.seatPricing.Luxe) : '',
      primePrice: entry.seatPricing?.Prime ? String(entry.seatPricing.Prime) : '',
      classicPrice: entry.seatPricing?.Classic ? String(entry.seatPricing.Classic) : '',
    });
  };

  const handleDeleteStream = async (id) => {
    try {
      await deleteAdminStreamEntry(id);
      if (editingStreamId === id) {
        resetStreamForm();
      }
      showToast('Stream item deleted.', { type: 'success' });
    } catch (error) {
      console.error('Unable to delete stream entry:', error);
      showToast('Unable to delete this stream item.', { type: 'error' });
    }
  };

  const handleDeleteTheater = async (id) => {
    try {
      await deleteAdminTheater(id);
      if (editingTheaterId === id) {
        resetTheaterForm();
      }
      showToast('Theatre deleted.', { type: 'success' });
    } catch (error) {
      console.error('Unable to delete theater:', error);
      showToast('Unable to delete this theatre.', { type: 'error' });
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      return;
    }

    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Unable to sign out:', error);
      showToast('Unable to sign out right now.', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.centerText}>Loading admin controls...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="shield-outline" size={54} color="#E50914" />
        <Text style={styles.centerTitle}>Admin Only</Text>
        <Text style={styles.centerText}>
          This panel is available only for accounts marked as admin in Firebase.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Admin Mode</Text>
            <Text style={styles.title}>Control Room</Text>
            <Text style={styles.subtitle}>
              Signed in as {profile?.email || 'admin'}.
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{streamEntries.length}</Text>
            <Text style={styles.metricLabel}>Custom stream titles</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{theaterEntries.length}</Text>
            <Text style={styles.metricLabel}>Custom theatres</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Manage Stream</Text>
              <Text style={styles.sectionText}>
                Add or tune YouTube-backed titles shown in the Stream tab.
              </Text>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetStreamForm}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {[
              ['Title', 'title'],
              ['Description', 'description'],
              ['Year', 'year'],
              ['Duration', 'duration'],
              ['Genre', 'genre'],
              ['Language', 'language'],
              ['Region', 'region'],
              ['Format', 'format'],
              ['Mood', 'mood'],
              ['Badge', 'badge'],
              ['YouTube Link or ID', 'videoId'],
            ].map(([label, key]) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={[styles.input, key === 'description' && styles.inputLarge]}
                  value={streamForm[key]}
                  onChangeText={(value) => setStreamForm((current) => ({ ...current, [key]: value }))}
                  placeholder={label}
                  placeholderTextColor="#6D6D72"
                  multiline={key === 'description'}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveStream} disabled={savingStream}>
              <Text style={styles.primaryButtonText}>
                {savingStream ? 'Saving...' : editingStreamId ? 'Update Stream Item' : 'Add Stream Item'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8C8C91" />
            <TextInput
              style={styles.searchInput}
              value={streamSearch}
              onChangeText={setStreamSearch}
              placeholder="Search stream titles"
              placeholderTextColor="#6D6D72"
            />
          </View>

          {filteredStreamEntries.map((entry) => (
            <View key={entry.id} style={styles.listCard}>
              <View style={styles.listCardTop}>
                <View style={styles.listCopy}>
                  <Text style={styles.listTitle}>{entry.title}</Text>
                  <Text style={styles.listMeta}>
                    {entry.language} • {entry.genre} • {entry.badge}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => startEditStream(entry)}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButtonDanger} onPress={() => handleDeleteStream(entry.id)}>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Manage Theatres</Text>
              <Text style={styles.sectionText}>
                Add city listings, timings, and seat prices for booking.
              </Text>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetTheaterForm}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {[
              ['State', 'state'],
              ['City', 'city'],
              ['Theatre Name', 'name'],
              ['Area', 'area'],
              ['Formats (comma separated)', 'formats'],
              ['Showtimes (comma separated)', 'showtimes'],
              ['Experience', 'experience'],
              ['Luxe Price', 'luxePrice'],
              ['Prime Price', 'primePrice'],
              ['Classic Price', 'classicPrice'],
            ].map(([label, key]) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={theaterForm[key]}
                  onChangeText={(value) => setTheaterForm((current) => ({ ...current, [key]: value }))}
                  placeholder={label}
                  placeholderTextColor="#6D6D72"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTheater} disabled={savingTheater}>
              <Text style={styles.primaryButtonText}>
                {savingTheater ? 'Saving...' : editingTheaterId ? 'Update Theatre' : 'Add Theatre'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8C8C91" />
            <TextInput
              style={styles.searchInput}
              value={theaterSearch}
              onChangeText={setTheaterSearch}
              placeholder="Search theatres"
              placeholderTextColor="#6D6D72"
            />
          </View>

          {filteredTheaterEntries.map((entry) => (
            <View key={entry.id} style={styles.listCard}>
              <View style={styles.listCardTop}>
                <View style={styles.listCopy}>
                  <Text style={styles.listTitle}>{entry.name}</Text>
                  <Text style={styles.listMeta}>
                    {entry.city}, {entry.state}
                  </Text>
                  <Text style={styles.listMeta}>
                    {(entry.formats || []).join(' • ')}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => startEditTheater(entry)}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButtonDanger} onPress={() => handleDeleteTheater(entry.id)}>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  eyebrow: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: '#B3B3B8',
    marginTop: 6,
  },
  logoutButton: {
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#121214',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#A6A6AB',
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionText: {
    color: '#A6A6AB',
    marginTop: 6,
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#121214',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0B0B0D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputLarge: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#E50914',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  searchBox: {
    marginTop: 14,
    backgroundColor: '#121214',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  listCard: {
    backgroundColor: '#121214',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  listCopy: {
    flex: 1,
  },
  listTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  listMeta: {
    color: '#A6A6AB',
    marginTop: 5,
    lineHeight: 18,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E1E22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#411215',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  centerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  centerText: {
    color: '#B3B3B8',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default AdminPanelScreen;
