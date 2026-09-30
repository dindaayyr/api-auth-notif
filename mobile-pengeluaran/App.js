import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';

const API_URL = 'http://172.20.10.2:3000';

export default function App() {
  // ==================================================
  // STATE
  // ==================================================

  const [screen, setScreen] = useState('daftar');

  const [judul, setJudul] = useState('');
  const [nominal, setNominal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [dataPengeluaran, setDataPengeluaran] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState(false);

  // ==================================================
  // HELPER KATEGORI
  // ==================================================

  const kategoriKeTampilan = (nama) => {
    if (!nama) return 'Tanpa Kategori';

    const map = {
      Pendidikan: '📚 Pendidikan',
      Makanan: '🍲 Makanan',
      Transport: '🚗 Transport',
      Hiburan: '🎮 Hiburan',
    };

    return map[nama] || nama;
  };

  const tampilanKeKategoriId = (kategori) => {
    if (!kategori) return null;

    if (kategori.includes('Pendidikan')) return 1;
    if (kategori.includes('Makanan')) return 2;
    if (kategori.includes('Transport')) return 3;
    if (kategori.includes('Hiburan')) return 4;

    return null;
  };

  const formatNominal = (value) => {
    const angka = Number(value || 0);

    return `Rp ${angka.toLocaleString('id-ID')}`;
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '-';

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return String(tanggal);
    }

    const hari = String(date.getDate()).padStart(2, '0');
    const bulan = String(date.getMonth() + 1).padStart(2, '0');
    const tahun = date.getFullYear();

    return `${hari}/${bulan}/${tahun}`;
  };

  const ubahDataUntukTampilan = (data) => {
    return data.map((item) => ({
      ...item,
      nominal: formatNominal(item.nominal),
      kategori: kategoriKeTampilan(item.kategori),
      tanggal: formatTanggal(item.tanggal),
    }));
  };

  // ==================================================
  // GET DATA
  // ==================================================

  const ambilData = async () => {
    try {
      setLoading(true);
      setErrorApi(false);

      const response = await fetch(`${API_URL}/pengeluaran`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }

      const data = await response.json();

      setDataPengeluaran(data);
    } catch (error) {
      console.log('Gagal mengambil data:', error);
      setErrorApi(true);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD AWAL
  // ==================================================

  useEffect(() => {
    ambilData();
  }, []);

  // ==================================================
  // PROSES SIMPAN
  // 06 -> 07
  // ==================================================

  useEffect(() => {
    if (screen !== 'menyimpan') {
      return;
    }

    let dibatalkan = false;

    const simpanKeBackend = async () => {
      try {
        const idKategori = tampilanKeKategoriId(selectedCategory);

        const response = await fetch(`${API_URL}/pengeluaran`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            judul: judul.trim(),
            nominal: Number(nominal),
            id_kategori: idKategori,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.pesan || 'Gagal menyimpan data');
        }

        await ambilData();

        if (!dibatalkan) {
          setScreen('daftarBaru');
        }
      } catch (error) {
        console.log('Gagal menyimpan:', error);

        if (!dibatalkan) {
          setErrorApi(true);
          setScreen('gagalMemuat');
        }
      }
    };

    const timer = setTimeout(() => {
      simpanKeBackend();
    }, 1200);

    return () => {
      dibatalkan = true;
      clearTimeout(timer);
    };
  }, [screen]);

  // ==================================================
  // 01 - DAFTAR PENGELUARAN
  // ==================================================

  if (screen === 'daftar') {
    const tampilData = ubahDataUntukTampilan(dataPengeluaran);

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.daftarContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.daftarTitle}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.primaryButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  await ambilData();
                } catch (error) {
                  setScreen('gagalMemuat');
                }
              }}
            >
              <Text style={styles.primaryButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>

            <View style={styles.daftarList}>
              {loading && dataPengeluaran.length === 0 ? (
                <Text style={styles.detailText}>
                  Memuat data...
                </Text>
              ) : errorApi && dataPengeluaran.length === 0 ? (
                <Text style={styles.detailText}>
                  Gagal memuat data
                </Text>
              ) : (
                tampilData.map((item) => (
                  <View
                    key={item.id}
                    style={styles.expenseCard}
                  >
                    <Text style={styles.expenseTitle}>
                      {item.judul}
                    </Text>

                    <Text style={styles.expenseNominal}>
                      {item.nominal}
                    </Text>

                    <Text style={styles.expenseCategory}>
                      {item.kategori}
                    </Text>

                    <Text style={styles.expenseDate}>
                      {item.tanggal}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedExpense(item);

                        setJudul(item.judul);
                        setNominal(String(item.nominal).replace(/\D/g, ''));
                        setSelectedCategory(item.kategori);

                        setScreen('detail');
                      }}
                    >
                      <Text style={styles.detailText}>
                        Lihat detail
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 02 - TAMBAH KOSONG
  // ==================================================

  if (screen === 'tambahKosong') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.tambahContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tambahTitle}>
              Tambah Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => setScreen('daftar')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Judul
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan judul"
                placeholderTextColor="#64748B"
                value={judul}
                onChangeText={setJudul}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nominal Rupiah
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan nominal"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={nominal}
                onChangeText={setNominal}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Kategori Opsional
              </Text>

              <TouchableOpacity
                style={styles.categoryInput}
                activeOpacity={0.8}
                onPress={() => setScreen('kategori')}
              >
                <Text style={styles.categoryPlaceholder}>
                  {selectedCategory || 'Pilih kategori'}
                </Text>

                <Text style={styles.categoryArrow}>
                  &gt;
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>
                Tanggal otomatis dari server
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                if (
                  judul.trim() === '' ||
                  nominal.trim() === ''
                ) {
                  setScreen('errorValidasi');
                  return;
                }

                setScreen('menyimpan');
              }}
            >
              <Text style={styles.primaryButtonText}>
                Simpan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 03 - PILIH KATEGORI
  // ==================================================

  if (screen === 'kategori') {
    const categories = [
      {
        id: 'tanpa',
        text: 'Tanpa Kategori',
        emoji: '',
      },
      {
        id: 'pendidikan',
        text: 'Pendidikan',
        emoji: '📚',
      },
      {
        id: 'makanan',
        text: 'Makanan',
        emoji: '🍲',
      },
      {
        id: 'transport',
        text: 'Transport',
        emoji: '🚗',
      },
      {
        id: 'hiburan',
        text: 'Hiburan',
        emoji: '🎮',
      },
    ];

    const pilihKategori = (category) => {
      let kategoriDipilih;

      if (category.id === 'tanpa') {
        kategoriDipilih = 'Tanpa Kategori';
      } else {
        kategoriDipilih =
          `${category.emoji} ${category.text}`;
      }

      setSelectedCategory(kategoriDipilih);

      if (
        judul.trim() !== '' &&
        nominal.trim() !== ''
      ) {
        setScreen('tambahTerisi');
      } else {
        setScreen('tambahKosong');
      }
    };

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.kategoriContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.kategoriTitle}>
              Pilih Kategori
            </Text>

            {categories.map((category) => {
              const namaKategori =
                category.id === 'tanpa'
                  ? 'Tanpa Kategori'
                  : `${category.emoji} ${category.text}`;

              const isSelected =
                selectedCategory === namaKategori;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryOption}
                  activeOpacity={0.8}
                  onPress={() => pilihKategori(category)}
                >
                  <View style={styles.radioCircle}>
                    {isSelected && (
                      <View style={styles.radioDot} />
                    )}
                  </View>

                  <Text style={styles.categoryOptionText}>
                    {category.emoji
                      ? `${category.emoji} ${category.text}`
                      : category.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 04 - TAMBAH TERISI
  // ==================================================

  if (screen === 'tambahTerisi') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.tambahContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tambahTitle}>
              Tambah Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => setScreen('daftar')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Judul
              </Text>

              <TextInput
                style={styles.input}
                value={judul}
                onChangeText={setJudul}
                placeholder="Masukkan judul"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nominal Rupiah
              </Text>

              <TextInput
                style={styles.input}
                value={nominal}
                onChangeText={setNominal}
                placeholder="Masukkan nominal"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Kategori
              </Text>

              <TouchableOpacity
                style={styles.categoryInput}
                activeOpacity={0.8}
                onPress={() => setScreen('kategori')}
              >
                <Text style={styles.selectedCategory}>
                  {selectedCategory}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>
                Tanggal otomatis dari server
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                if (
                  judul.trim() === '' ||
                  nominal.trim() === ''
                ) {
                  setScreen('errorValidasi');
                  return;
                }

                setScreen('menyimpan');
              }}
            >
              <Text style={styles.primaryButtonText}>
                Simpan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 05 - ERROR VALIDASI
  // ==================================================

  if (screen === 'errorValidasi') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.errorContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tambahTitle}>
              Tambah Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => setScreen('tambahKosong')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.errorFirstGroup}>
              <Text style={styles.label}>
                Judul
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan judul"
                placeholderTextColor="#64748B"
                value={judul}
                onChangeText={setJudul}
              />

              <Text style={styles.errorText}>
                *Judul wajib diisi
              </Text>
            </View>

            <View style={styles.errorFormGroup}>
              <Text style={styles.label}>
                Nominal Rupiah
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan nominal"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={nominal}
                onChangeText={setNominal}
              />
            </View>

            <View style={styles.errorFormGroup}>
              <Text style={styles.label}>
                Kategori Opsional
              </Text>

              <TouchableOpacity
                style={styles.categoryInput}
                activeOpacity={0.8}
                onPress={() => setScreen('kategori')}
              >
                <Text style={styles.categoryPlaceholder}>
                  {selectedCategory || 'Pilih kategori'}
                </Text>

                <Text style={styles.categoryArrow}>
                  &gt;
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.errorDateGroup}>
              <Text style={styles.label}>
                Tanggal otomatis dari server
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                if (
                  judul.trim() === '' ||
                  nominal.trim() === ''
                ) {
                  setScreen('errorValidasi');
                  return;
                }

                setScreen('menyimpan');
              }}
            >
              <Text style={styles.primaryButtonText}>
                Simpan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 06 - MENYIMPAN
  // ==================================================

  if (screen === 'menyimpan') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.tambahContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tambahTitle}>
              Tambah Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => setScreen('tambahTerisi')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Judul
              </Text>

              <TextInput
                style={styles.input}
                value={judul}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nominal Rupiah
              </Text>

              <TextInput
                style={styles.input}
                value={nominal}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Kategori
              </Text>

              <View style={styles.categoryInput}>
                <Text style={styles.selectedCategory}>
                  {selectedCategory}
                </Text>
              </View>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>
                Tanggal otomatis dari server
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={1}
              disabled={true}
            >
              <Text style={styles.primaryButtonText}>
                ⌛ Menyimpan...
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 07 - DAFTAR BARU
  // ==================================================

  if (screen === 'daftarBaru') {
    const tampilData = ubahDataUntukTampilan(dataPengeluaran);

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.daftarContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.daftarTitle}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.primaryButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={ambilData}
            >
              <Text style={styles.primaryButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>

            <View style={styles.daftarList}>
              {tampilData.map((item) => (
                <View
                  key={item.id}
                  style={styles.expenseCard}
                >
                  <Text style={styles.expenseTitle}>
                    {item.judul}
                  </Text>

                  <Text style={styles.expenseNominal}>
                    {item.nominal}
                  </Text>

                  <Text style={styles.expenseCategory}>
                    {item.kategori}
                  </Text>

                  <Text style={styles.expenseDate}>
                    {item.tanggal}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedExpense(item);

                      setJudul(item.judul);
                      setNominal(
                        String(item.nominal).replace(/\D/g, '')
                      );
                      setSelectedCategory(item.kategori);

                      setScreen('detail');
                    }}
                  >
                    <Text style={styles.detailText}>
                      Lihat detail
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 08 - DETAIL
  // ==================================================

  if (screen === 'detail') {
    const item = selectedExpense;

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.detailPageTitle}>
              Detail Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.detailBackButton}
              activeOpacity={0.8}
              onPress={() => setScreen('daftarBaru')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.detailCard}>
              <Text style={styles.detailExpenseTitle}>
                {item?.judul || '-'}
              </Text>

              <Text style={styles.detailNominal}>
                {item
                  ? formatNominal(
                      String(item.nominal).replace(/\D/g, '')
                    )
                  : 'Rp 0'}
              </Text>

              <Text style={styles.detailInfo}>
                Tanggal : {item?.tanggal || '-'}
              </Text>

              <Text style={styles.detailInfo}>
                ID Kategori :{' '}
                {tampilanKeKategoriId(item?.kategori) || '-'}
              </Text>

              <Text style={styles.detailInfo}>
                Catatan :
              </Text>

              <Text style={styles.detailInfo}>
                Belum ada catatan
              </Text>
            </View>

            <Text style={styles.detailReadOnly}>
              Informasi detail hanya dibaca
            </Text>

            <TouchableOpacity
              style={styles.detailEditButton}
              activeOpacity={0.8}
              onPress={() => setScreen('ubah')}
            >
              <Text style={styles.primaryButtonText}>
                Ubah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={() => setScreen('konfirmasiHapus')}
            >
              <Text style={styles.primaryButtonText}>
                Hapus
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 09 - UBAH
  // ==================================================

  if (screen === 'ubah') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.ubahContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.ubahTitle}>
              Ubah Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.ubahBackButton}
              activeOpacity={0.8}
              onPress={() => setScreen('detail')}
            >
              <Text style={styles.primaryButtonText}>
                ← Kembali
              </Text>
            </TouchableOpacity>

            <View style={styles.ubahFormGroupFirst}>
              <Text style={styles.label}>
                Judul
              </Text>

              <TextInput
                style={styles.input}
                value={judul}
                onChangeText={setJudul}
              />
            </View>

            <View style={styles.ubahFormGroup}>
              <Text style={styles.label}>
                Nominal Rupiah
              </Text>

              <TextInput
                style={styles.input}
                value={nominal}
                onChangeText={setNominal}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.ubahFormGroup}>
              <Text style={styles.label}>
                Kategori
              </Text>

              <TouchableOpacity
                style={styles.categoryInput}
                activeOpacity={0.8}
                onPress={() => setScreen('kategori')}
              >
                <Text style={styles.selectedCategory}>
                  {selectedCategory}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.ubahSaveButton}
              activeOpacity={0.8}
              onPress={async () => {
                if (!selectedExpense) {
                  return;
                }

                try {
                  const idKategori =
                    tampilanKeKategoriId(selectedCategory);

                  const response = await fetch(
                    `${API_URL}/pengeluaran/${selectedExpense.id}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        judul: judul.trim(),
                        nominal: Number(nominal),
                        id_kategori: idKategori,
                      }),
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.pesan || 'Gagal mengubah data'
                    );
                  }

                  await ambilData();

                  setScreen('daftarSetelahDiubah');
                } catch (error) {
                  console.log('Gagal mengubah:', error);
                  setScreen('gagalMemuat');
                }
              }}
            >
              <Text style={styles.primaryButtonText}>
                Simpan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 10 - DAFTAR SETELAH DIUBAH
  // ==================================================

  if (screen === 'daftarSetelahDiubah') {
    const tampilData = ubahDataUntukTampilan(dataPengeluaran);

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.daftarDiubahContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.daftarDiubahTitle}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.daftarDiubahButton}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.primaryButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.daftarDiubahButton}
              activeOpacity={0.8}
              onPress={ambilData}
            >
              <Text style={styles.primaryButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>

            <View style={styles.daftarDiubahList}>
              {tampilData.map((item) => (
                <View
                  key={item.id}
                  style={styles.expenseCard}
                >
                  <Text style={styles.expenseTitle}>
                    {item.judul}
                  </Text>

                  <Text style={styles.expenseNominal}>
                    {item.nominal}
                  </Text>

                  <Text style={styles.expenseCategory}>
                    {item.kategori}
                  </Text>

                  <Text style={styles.expenseDate}>
                    {item.tanggal}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedExpense(item);
                      setJudul(item.judul);
                      setNominal(
                        String(item.nominal).replace(/\D/g, '')
                      );
                      setSelectedCategory(item.kategori);
                      setScreen('detail');
                    }}
                  >
                    <Text style={styles.detailText}>
                      Lihat detail
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 11 - KONFIRMASI HAPUS
  // ==================================================

  if (screen === 'konfirmasiHapus') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.konfirmasiContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.konfirmasiTitle}>
              Konfirmasi Hapus
            </Text>

            <View style={styles.konfirmasiCard}>
              <Text style={styles.konfirmasiQuestion}>
                Apakah kamu yakin ingin{'\n'}
                menghapus data ini?
              </Text>

              <Text style={styles.konfirmasiNama}>
                “{selectedExpense?.judul || '-'}”
              </Text>

              <Text style={styles.konfirmasiNominal}>
                {selectedExpense
                  ? formatNominal(
                      String(selectedExpense.nominal).replace(
                        /\D/g,
                        ''
                      )
                    )
                  : 'Rp 0'}
              </Text>
            </View>

            <View style={styles.konfirmasiButtons}>
              <TouchableOpacity
                style={styles.batalButton}
                activeOpacity={0.8}
                onPress={() => setScreen('detail')}
              >
                <Text style={styles.primaryButtonText}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hapusKonfirmasiButton}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!selectedExpense) {
                    return;
                  }

                  try {
                    const response = await fetch(
                      `${API_URL}/pengeluaran/${selectedExpense.id}`,
                      {
                        method: 'DELETE',
                      }
                    );

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(
                        data.pesan || 'Gagal menghapus data'
                      );
                    }

                    await ambilData();

                    setSelectedExpense(null);
                    setJudul('');
                    setNominal('');
                    setSelectedCategory('');

                    setScreen('daftarHapus');
                  } catch (error) {
                    console.log('Gagal menghapus:', error);
                    setScreen('gagalMemuat');
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 12 - DAFTAR SETELAH HAPUS
  // ==================================================

  if (screen === 'daftarHapus') {
    const tampilData = ubahDataUntukTampilan(dataPengeluaran);

    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.daftarHapusContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.daftarHapusTitle}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.daftarHapusButton}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.primaryButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.daftarHapusButton}
              activeOpacity={0.8}
              onPress={ambilData}
            >
              <Text style={styles.primaryButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>

            <View style={styles.daftarHapusList}>
              {tampilData.map((item) => (
                <View
                  key={item.id}
                  style={styles.daftarHapusCard}
                >
                  <Text style={styles.daftarHapusItemTitle}>
                    {item.judul}
                  </Text>

                  <Text style={styles.daftarHapusItemNominal}>
                    {item.nominal}
                  </Text>

                  <Text style={styles.daftarHapusItemCategory}>
                    {item.kategori}
                  </Text>

                  <Text style={styles.daftarHapusItemDate}>
                    {item.tanggal}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedExpense(item);
                      setJudul(item.judul);
                      setNominal(
                        String(item.nominal).replace(/\D/g, '')
                      );
                      setSelectedCategory(item.kategori);
                      setScreen('detail');
                    }}
                  >
                    <Text style={styles.daftarHapusDetail}>
                      Lihat detail
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 13 - DAFTAR KOSONG
  // ==================================================

  if (screen === 'daftarKosong') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <View style={styles.screen13Background}>
            <Text style={styles.screen13Title}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.screen13Button}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.screen13ButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.screen13Button}
              activeOpacity={0.8}
              onPress={() => setScreen('gagalMemuat')}
            >
              <Text style={styles.screen13ButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={styles.screen13Overlay}
            pointerEvents="box-none"
          >
            <View style={styles.screen13Card}>
              <Text style={styles.screen13Icon}>
                🧾
              </Text>

              <Text style={styles.screen13EmptyTitle}>
                Belum ada pengeluaran
              </Text>

              <Text style={styles.screen13Description}>
                Yuk mulai catat{'\n'}
                pengeluaranmu!
              </Text>

              <TouchableOpacity
                style={styles.screen13EmptyButton}
                activeOpacity={0.8}
                onPress={() => {
                  setJudul('');
                  setNominal('');
                  setSelectedCategory('');
                  setScreen('tambahKosong');
                }}
              >
                <Text style={styles.screen13EmptyButtonText}>
                  Klik Disini!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 14 - GAGAL MEMUAT
  // ==================================================

  if (screen === 'gagalMemuat') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <View style={styles.screen14Background}>
            <Text style={styles.screen14Title}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.screen14Button}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.screen14ButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.screen14Button}
              activeOpacity={0.8}
              onPress={() => setScreen('dataTidakAda')}
            >
              <Text style={styles.screen14ButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.screen14Overlay}>
            <View style={styles.screen14Card}>
              <Text style={styles.screen14Icon}>
                ⚠️
              </Text>

              <Text style={styles.screen14ErrorTitle}>
                Gagal memuat data pengeluaran
              </Text>

              <Text style={styles.screen14Description}>
                Coba periksa koneksi dan coba lagi.
              </Text>

              <TouchableOpacity
                style={styles.screen14RetryButton}
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    await ambilData();
                    setScreen('daftar');
                  } catch (error) {
                    setScreen('dataTidakAda');
                  }
                }}
              >
                <Text style={styles.screen14RetryButtonText}>
                  Coba Lagi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // 15 - DATA TIDAK ADA
  // ==================================================

  if (screen === 'dataTidakAda') {
    return (
      <SafeAreaView style={styles.appContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.page}>
          <View style={styles.screen15Background}>
            <Text style={styles.screen15Title}>
              Daftar Pengeluaran
            </Text>

            <TouchableOpacity
              style={styles.screen15Button}
              activeOpacity={0.8}
              onPress={() => {
                setJudul('');
                setNominal('');
                setSelectedCategory('');
                setScreen('tambahKosong');
              }}
            >
              <Text style={styles.screen15ButtonText}>
                + Tambah Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.screen15Button}
              activeOpacity={0.8}
              onPress={() => setScreen('gagalMemuat')}
            >
              <Text style={styles.screen15ButtonText}>
                Muat Ulang
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.screen15Overlay}>
            <View style={styles.screen15Card}>
              <Text style={styles.screen15Icon}>
                🔍
              </Text>

              <Text style={styles.screen15ErrorTitle}>
                Data tidak ditemukan
              </Text>

              <Text style={styles.screen15Description}>
                Data yang kamu cari tidak tersedia.
              </Text>

              <TouchableOpacity
                style={styles.screen15BackButton}
                activeOpacity={0.8}
                onPress={() => setScreen('daftar')}
              >
                <Text style={styles.screen15BackButtonText}>
                  Kembali
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  // ==================================================
  // UMUM
  // ==================================================

  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    position: 'relative',
  },

  // ==================================================
  // 01 & 07
  // ==================================================

  daftarContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 30,
  },

  daftarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  primaryButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  daftarList: {
    marginTop: -2,
  },

  expenseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginBottom: 7,
  },

  expenseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },

  expenseNominal: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2,
  },

  expenseCategory: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2,
  },

  expenseDate: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 4,
  },

  detailText: {
    fontSize: 12,
    color: '#0F172A',
  },

  // ==================================================
  // 02, 04 & 06
  // ==================================================

  tambahContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 40,
  },

  tambahTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  formGroup: {
    marginTop: 19,
  },

  label: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 5,
  },

  input: {
    height: 34,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0F172A',
  },

  categoryInput: {
    height: 34,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryPlaceholder: {
    fontSize: 12,
    color: '#64748B',
  },

  selectedCategory: {
    fontSize: 12,
    color: '#0F172A',
  },

  categoryArrow: {
    fontSize: 13,
    color: '#64748B',
  },

  dateGroup: {
    marginTop: 29,
    marginBottom: 21,
  },

  // ==================================================
  // 03
  // ==================================================

  kategoriContent: {
    paddingHorizontal: 8,
    paddingTop: 44,
    paddingBottom: 40,
  },

  kategoriTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  categoryOption: {
    height: 34,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  radioCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },

  categoryOptionText: {
    fontSize: 12,
    color: '#0F172A',
  },

  // ==================================================
  // 05
  // ==================================================

  errorContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 40,
  },

  errorFirstGroup: {
    marginTop: 0,
    marginBottom: 0,
  },

  errorFormGroup: {
    marginTop: 19,
  },

  errorText: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 4,
    marginLeft: 7,
  },

  errorDateGroup: {
    marginTop: 29,
    marginBottom: 21,
  },

  // ==================================================
  // 08
  // ==================================================

  detailContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 40,
  },

  detailPageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  detailBackButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 30,
  },

  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 21,
    paddingVertical: 10,
    marginBottom: 19,
  },

  detailExpenseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  detailNominal: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 10,
  },

  detailInfo: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 10,
  },

  detailReadOnly: {
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 4,
    marginBottom: 14,
  },

  detailEditButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  deleteButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#C91C1C',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  // ==================================================
  // 09
  // ==================================================

  ubahContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 40,
  },

  ubahTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  ubahBackButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 30,
  },

  ubahFormGroupFirst: {
    marginTop: 0,
  },

  ubahFormGroup: {
    marginTop: 19,
  },

  ubahSaveButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 67,
  },

  // ==================================================
  // 10
  // ==================================================

  daftarDiubahContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 30,
  },

  daftarDiubahTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  daftarDiubahButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  daftarDiubahList: {
    marginTop: -2,
  },

  // ==================================================
  // 11
  // ==================================================

  konfirmasiContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 40,
    flexGrow: 1,
  },

  konfirmasiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 36,
  },

  konfirmasiCard: {
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 22,
    alignItems: 'center',
  },

  konfirmasiQuestion: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 15,
  },

  konfirmasiNama: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 3,
  },

  konfirmasiNominal: {
    fontSize: 12,
    color: '#0F766E',
    textAlign: 'center',
  },

  konfirmasiButtons: {
    width: '95%',
    alignSelf: 'center',
    marginTop: 'auto',
    paddingTop: 110,
  },

  batalButton: {
    height: 30,
    width: '100%',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  hapusKonfirmasiButton: {
    height: 30,
    width: '100%',
    backgroundColor: '#C91C1C',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  // ==================================================
  // 12
  // ==================================================

  daftarHapusContent: {
    paddingHorizontal: 10,
    paddingTop: 45,
    paddingBottom: 30,
  },

  daftarHapusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  daftarHapusButton: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  daftarHapusList: {
    marginTop: 0,
  },

  daftarHapusCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginBottom: 7,
  },

  daftarHapusItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },

  daftarHapusItemNominal: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2,
  },

  daftarHapusItemCategory: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2,
  },

  daftarHapusItemDate: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 4,
  },

  daftarHapusDetail: {
    fontSize: 12,
    color: '#0F172A',
  },

  // ==================================================
  // 13
  // ==================================================

  screen13Background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 45,
  },

  screen13Title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  screen13Button: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  screen13ButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  screen13Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen13Card: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  screen13Icon: {
    fontSize: 35,
    marginBottom: 10,
  },

  screen13EmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  screen13Description: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },

  screen13EmptyButton: {
    height: 30,
    width: '80%',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen13EmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ==================================================
  // 14
  // ==================================================

  screen14Background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 45,
  },

  screen14Title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  screen14Button: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  screen14ButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  screen14Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen14Card: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  screen14Icon: {
    fontSize: 35,
    marginBottom: 10,
  },

  screen14ErrorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  screen14Description: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },

  screen14RetryButton: {
    height: 30,
    width: '80%',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen14RetryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ==================================================
  // 15
  // ==================================================

  screen15Background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 45,
  },

  screen15Title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  screen15Button: {
    height: 30,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  screen15ButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  screen15Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen15Card: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  screen15Icon: {
    fontSize: 35,
    marginBottom: 10,
  },

  screen15ErrorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  screen15Description: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },

  screen15BackButton: {
    height: 30,
    width: '80%',
    backgroundColor: '#0F766E',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  screen15BackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});