import React, { createContext, useContext, useState, useEffect } from 'react';
import * as turf from '@turf/turf';

export interface SwimmingPool {
  id: string;
  name: string;
  kategori: 'Rekreasi' | 'Atlet';
  jenisKolam: 'Indoor' | 'Outdoor';
  description: string;
  address: string;
  district: string;
  ticketPrice: string;     // string karena harga bervariasi (weekday/weekend, anak/dewasa)
  ticketPriceMin: number;  // untuk keperluan sorting numerik
  rating: number;
  openingHours: string;
  latitude: number;
  longitude: number;
  facilities: string[];
  status?: 'Buka' | 'Tutup' | 'Renovasi';
  imageUrl?: string;
}

interface SpatialContextType {
  pools: SwimmingPool[];
  filteredPools: SwimmingPool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedKategori: string;        // 'Semua' | 'Rekreasi' | 'Atlet'
  setSelectedKategori: (v: string) => void;
  selectedJenis: string;           // 'Semua' | 'Indoor' | 'Outdoor'
  setSelectedJenis: (v: string) => void;
  selectedPool: SwimmingPool | null;
  setSelectedPool: (pool: SwimmingPool | null) => void;
  userLocation: [number, number] | null;
  setUserLocation: (coords: [number, number] | null) => void;
  nearestPool: SwimmingPool | null;
  nearestDistance: number | null;
  nearestRouteGeoJson: any | null;
  findNearestPool: (lat: number, lng: number) => void;
  clearNearestAnalysis: () => void;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  activeTab: 'directory' | 'nearest' | 'detail';
  setActiveTab: (tab: 'directory' | 'nearest' | 'detail') => void;
  
  // CRUD
  addPool: (pool: Omit<SwimmingPool, 'id'>) => void;
  updatePool: (id: string, updated: Partial<SwimmingPool>) => void;
  deletePool: (id: string) => void;
  isSelectingLocation: boolean;
  setIsSelectingLocation: (val: boolean) => void;
  formCoords: [number, number] | null;
  setFormCoords: (coords: [number, number] | null) => void;

  // New user routing additions
  isSelectingUserLocation: boolean;
  setIsSelectingUserLocation: (val: boolean) => void;
  calculateRouteToPool: (pool: SwimmingPool, customCoords?: [number, number]) => void;
  routeDetails: RouteDetails | null;
  routeMode: 'driving' | 'walking';
  setRouteMode: (mode: 'driving' | 'walking') => void;
}

export interface RouteDetails {
  drivingDistance: number;
  drivingDuration: number;
  walkingDistance: number;
  walkingDuration: number;
}

const SpatialContext = createContext<SpatialContextType | undefined>(undefined);

const PADANG_CENTER: [number, number] = [-0.9305, 100.3598]; // sekitar GOR Agus Salim

// ============================================================
// DATABASE 46 KOLAM RENANG KOTA PADANG
// Koordinat diparse dari data spreadsheet pengguna.
// Format asli pakai titik ribuan → dikonversi ke desimal presisi.
// ============================================================
const POOLS_DATA: SwimmingPool[] = [
  {
    id: 'pool-01-palapa',
    name: 'Kolam Renang Palapa',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang umum dengan tarif terjangkau. Populer untuk kursus renang anak-anak dan rekreasi keluarga.',
    address: 'Jl. Palapa Raya, Padang',
    district: 'Padang Barat',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.0,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8141770,
    longitude: 100.3198673,
    facilities: ['Kolam Utama', 'Kolam Anak', 'Kamar Bilas', 'Kantin'],
  },
  {
    id: 'pool-02-gsports',
    name: 'Swimming Pool G Sports',
    kategori: 'Atlet',
    jenisKolam: 'Indoor',
    description: 'Kolam renang semi-indoor premium di pusat kebugaran G Sports Center. Perawatan air ketat dengan standar kolam atlet.',
    address: 'G Sports Center, Gunung Pangilun, Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.6,
    openingHours: '06:00 – 21:00 WIB',
    latitude: -0.9112124,
    longitude: 100.3636889,
    facilities: ['Kolam Indoor 25m', 'Loker', 'Shower Air Panas', 'Cafe & Gym'],
  },
  {
    id: 'pool-03-ibis',
    name: 'Kolam Renang Hotel Ibis',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang modern Hotel Ibis Padang dengan pemandangan kota dan tiupan angin laut yang menyegarkan.',
    address: 'Hotel Ibis Padang, Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.5,
    openingHours: '06:00 – 19:00 WIB',
    latitude: -0.9301768,
    longitude: 100.3627643,
    facilities: ['Outdoor Pool', 'Sunset View', 'Shower Air Hangat', 'Hotel Restoran'],
  },
  {
    id: 'pool-04-araurestobar',
    name: 'Arau Cafe And Resto',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang santai terintegrasi kafe dan restoran di kawasan bersejarah Muaro Padang. Digemari anak muda.',
    address: 'Kawasan Muaro, Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.3,
    openingHours: '09:00 – 21:00 WIB',
    latitude: -0.9639552,
    longitude: 100.3602165,
    facilities: ['Poolside Cafe', 'Live Music', 'WiFi', 'Kamar Ganti'],
  },
  {
    id: 'pool-05-uluaia',
    name: 'Kolam Renang Uluaia',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang berlatar perbukitan Limau Manis dengan air sejuk alami mengalir dari pegunungan.',
    address: 'Kawasan Limau Manis, Pauh',
    district: 'Pauh',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.3,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -0.8000314,
    longitude: 100.4152771,
    facilities: ['Kolam Air Dingin', 'Seluncuran', 'Gazebo Bambu', 'Kantin'],
  },
  {
    id: 'pool-06-bidanem',
    name: 'Bidan Em',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang rumahan yang ramah bayi dan balita. Tersedia pendampingan khusus untuk anak belajar mengapung.',
    address: 'Padang Timur',
    district: 'Padang Timur',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.2,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9236394,
    longitude: 100.4589680,
    facilities: ['Kolam Balita', 'Pendampingan', 'Shower Hangat'],
  },
  {
    id: 'pool-07-familyceria',
    name: 'Kolam Renang Family Ceria',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang keluarga yang ramah kantong, lengkap dengan permainan air untuk anak usia TK dan SD.',
    address: 'Nanggalo, Padang',
    district: 'Nanggalo',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8772470,
    longitude: 100.3650230,
    facilities: ['Kolam Anak', 'Seluncuran', 'Gazebo', 'Kantin'],
  },
  {
    id: 'pool-08-tanahsirah',
    name: 'Pemandian Tanah Sirah',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian air sungai alami yang jernih di Tanah Sirah, dikelilingi pepohonan rindang dan bebatuan kali.',
    address: 'Tanah Sirah, Lubuk Begalung',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.2,
    openingHours: '06:00 – 18:00 WIB',
    latitude: -1.0041317,
    longitude: 100.4182323,
    facilities: ['Sungai Alami', 'Sewa Ban', 'Warung Tradisional'],
  },
  {
    id: 'pool-09-alghij',
    name: 'Pemandian Al-ghij Puncak Lalang',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian alam di lereng Lubuk Kilangan dengan air pegunungan sangat dingin dan menyegarkan.',
    address: 'Puncak Lalang, Lubuk Kilangan',
    district: 'Lubuk Kilangan',
    ticketPrice: 'Anak: Rp 5.000 | Dewasa: Rp 10.000',
    ticketPriceMin: 5000,
    rating: 4.4,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.8825711,
    longitude: 100.4361558,
    facilities: ['Kolam Air Gunung', 'Bebatuan Alami', 'Warung Tradisional'],
  },
  {
    id: 'pool-10-delima',
    name: 'Kolam Renang Delima',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang semi-privat yang asri di kawasan Lubuk Begalung, cocok untuk keluarga yang ingin privasi lebih.',
    address: 'Lubuk Begalung, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9851842,
    longitude: 100.4019052,
    facilities: ['Private Pool', 'Kamar Bilas', 'Area Istirahat'],
  },
  {
    id: 'pool-11-andetiss',
    name: 'Andetiss',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang populer di Pauh, banyak dikunjungi mahasiswa UNAND dan warga sekitar untuk olahraga sore.',
    address: 'Limau Manis, Pauh',
    district: 'Pauh',
    ticketPrice: 'Rp 25.000',
    ticketPriceMin: 25000,
    rating: 4.2,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9249051,
    longitude: 100.4382267,
    facilities: ['Kolam Dewasa 1.6m', 'Kamar Bilas', 'Parkir Aman'],
  },
  {
    id: 'pool-12-keluarga',
    name: 'Kolam Pemandian Keluarga',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam pemandian keluarga berskala rumahan yang tenang dan nyaman, ideal untuk kunjungan privat rombongan kecil.',
    address: 'Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8973993,
    longitude: 100.4036004,
    facilities: ['Private Pool', 'Gazebo', 'Dapur Bersama', 'Kamar Ganti'],
  },
  {
    id: 'pool-13-faiq',
    name: 'Faiq Swimming Pool',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang dengan instruktur bersertifikat, sangat cocok untuk program belajar renang anak-anak sekolah dasar.',
    address: 'Koto Tangah',
    district: 'Koto Tangah',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.2,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9115229,
    longitude: 100.4803745,
    facilities: ['Kolam Kursus', 'Instruktur Renang', 'Kamar Mandi Bersih', 'Ruang Tunggu'],
  },
  {
    id: 'pool-14-arauminpark',
    name: 'Arau Mini Park',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Taman bermain air mini di kawasan Padang Barat, lengkap dengan mandi busa pada akhir pekan.',
    address: 'Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.3,
    openingHours: '09:00 – 18:00 WIB',
    latitude: -0.9637494,
    longitude: 100.3604504,
    facilities: ['Mandi Busa (Weekend)', 'Mini Slide', 'Taman Bermain', 'Kantin'],
  },
  {
    id: 'pool-15-imelda',
    name: 'Kolam Renang Imelda',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang resort di Limau Manis yang dikelilingi perbukitan hijau. Udara sejuk dan suasana resort yang eksklusif.',
    address: 'Limau Manis, Pauh',
    district: 'Pauh',
    ticketPrice: 'Rp 35.000',
    ticketPriceMin: 35000,
    rating: 4.5,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.9399444,
    longitude: 100.4654344,
    facilities: ['Resort Pool', 'Kids Playground', 'Shower Air Hangat', 'Restoran'],
  },
  {
    id: 'pool-16-jahayunajalu',
    name: 'Kolam Renang Jahayu Najalu',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang asri di tenggara Padang dengan pohon kelapa yang meneduhkan di sekeliling area kolam.',
    address: 'Lubuk Begalung, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.3,
    openingHours: '08:30 – 17:30 WIB',
    latitude: -1.0043289,
    longitude: 100.4182954,
    facilities: ['Kolam Bermain', 'Kamar Bilas', 'Penyewaan Ban', 'Kantin'],
  },
  {
    id: 'pool-17-singkarak',
    name: 'Singkarak Swimming Pool',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang umum di Padang Selatan yang ramah anak dengan kolam latihan kedalaman bervariasi.',
    address: 'Padang Selatan',
    district: 'Padang Selatan',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.0,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9467053,
    longitude: 100.3592860,
    facilities: ['Kolam Latihan', 'Kolam Anak', 'Kamar Ganti', 'Warung Kopi'],
  },
  {
    id: 'pool-18-pakbadoel',
    name: 'Kolam Pemandian Pak Badoel',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian lokal Lubuk Begalung dengan aliran air alami yang dijaga keasriannya oleh warga setempat.',
    address: 'Lubuk Begalung, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '07:30 – 18:00 WIB',
    latitude: -0.9891402,
    longitude: 100.4044301,
    facilities: ['Bathing Spring', 'Kamar Mandi Sederhana', 'Warung'],
  },
  {
    id: 'pool-19-fuzzion',
    name: 'Fuzzion Pool Centre',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Fasilitas kolam renang modern dengan lounge kafe terintegrasi di Padang Selatan. Standar filter air tinggi.',
    address: 'Padang Selatan',
    district: 'Padang Selatan',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.4,
    openingHours: '08:00 – 21:00 WIB',
    latitude: -0.9485900,
    longitude: 100.3550100,
    facilities: ['Filter Air Canggih', 'Lounge Kafe', 'Outdoor Seats', 'Loker'],
  },
  {
    id: 'pool-20-wirabraja',
    name: 'Kolam Renang Wirabraja',
    kategori: 'Atlet',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang milik TNI-AD yang terbuka untuk umum. Terkenal bersih, tertib, dan ideal untuk latihan atlet renang.',
    address: 'Ganting, Padang Timur',
    district: 'Padang Timur',
    ticketPrice: 'Senin–Jumat: Rp 15.000 | Sabtu–Minggu: Rp 18.000',
    ticketPriceMin: 15000,
    rating: 4.4,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -0.9510104,
    longitude: 100.3699086,
    facilities: ['Kolam Dewasa 50m', 'Kolam Anak', 'Kamar Bilas', 'Kantin', 'Parkir Luas'],
  },
  {
    id: 'pool-21-silo',
    name: 'Kolam Renang Silo',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang warga di Koto Tangah dengan air sumur pegunungan yang jernih dan sejuk.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Rp 5.000',
    ticketPriceMin: 5000,
    rating: 3.9,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -0.9602260,
    longitude: 100.4760862,
    facilities: ['Kolam Kedalaman Bervariasi', 'Warung', 'Kamar Bilas'],
  },
  {
    id: 'pool-22-pandanwangi',
    name: 'Kolam Renang Pawang (Pandan Wangi)',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang anak-anak dengan ornamen patung lumba-lumba dan pancuran air yang menjadi ikon kawasan.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Rp 10.000',
    ticketPriceMin: 10000,
    rating: 4.0,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9492341,
    longitude: 100.4572269,
    facilities: ['Pancuran Patung', 'Kolam Dangkal', 'Sewa Ban', 'Kantin'],
  },
  {
    id: 'pool-23-lubuakkudo',
    name: 'Lubuak Kudo',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian lubuk sungai alam dengan spot lompat dari bebatuan tebing. Airnya sangat jernih dan dalam.',
    address: 'Kuranji, Padang',
    district: 'Kuranji',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.6,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.8645917,
    longitude: 100.4292333,
    facilities: ['Spot Lompat Tebing', 'Air Jernih Alami', 'Warung Kopi'],
  },
  {
    id: 'pool-24-alinafiqaz',
    name: 'Kolam Renang Alinafiqaz',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang hemat di Koto Tangah, favorit warga sekitar dan pelajar untuk rekreasi sore hari.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8989400,
    longitude: 100.4095898,
    facilities: ['Kolam Latihan', 'Gazebo Sewa', 'Toko Perlengkapan Renang'],
  },
  {
    id: 'pool-25-jahayunajalu2',
    name: 'Pemandian Jahayu Najalu',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian pancuran bambu alami di Lubuk Begalung dengan nuansa relaksasi pijat air yang menenangkan.',
    address: 'Lubuk Begalung, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.2,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -1.0042783,
    longitude: 100.4182972,
    facilities: ['Pancuran Bambu', 'Terapi Air', 'Gazebo', 'Kantin'],
  },
  {
    id: 'pool-26-kasang',
    name: 'Kolam Renang Alami Nagari Kasang',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian irigasi persawahan berlantai pasir kerikil sungai alami di batas Kota Padang–Pariaman.',
    address: 'Kasang, Koto Tangah',
    district: 'Koto Tangah',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.3,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.7861043,
    longitude: 100.3505701,
    facilities: ['Pasir Kerikil Alami', 'Aliran Sungai Segar', 'Kantin Ikan Bakar'],
  },
  {
    id: 'pool-27-pangeranbeach',
    name: 'Pangeran Beach Hotel',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang outdoor premium hotel legendaris Pangeran Beach Padang, tepat di samping Pantai Samudra Hindia.',
    address: 'Jl. Ir. H. Juanda, Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.6,
    openingHours: '06:00 – 20:00 WIB',
    latitude: -0.9238422,
    longitude: 100.3499734,
    facilities: ['Sea Breeze Pool', 'Poolside Lounge', 'Shower', 'Fitness Center'],
  },
  {
    id: 'pool-28-adzkia',
    name: 'Kolam Renang Adzkia',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang di kompleks pendidikan Adzkia Kuranji, dibuka untuk umum secara berkala di luar jam sekolah.',
    address: 'Kuranji, Padang',
    district: 'Kuranji',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.0,
    openingHours: '08:00 – 17:00 WIB',
    latitude: -0.9196274,
    longitude: 100.3933428,
    facilities: ['Kolam Latihan', 'Kamar Bilas Standar', 'Parkir'],
  },
  {
    id: 'pool-29-radisa',
    name: 'Radisa Swimming Pool & Cafe',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Perpaduan kolam renang santai dan kafe estetik di Padang Utara. Sangat cocok untuk keluarga muda yang aktif.',
    address: 'Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Selasa–Jumat: Rp 10.000 | Sabtu–Minggu: Rp 14.000',
    ticketPriceMin: 10000,
    rating: 4.3,
    openingHours: '09:00 – 20:00 WIB',
    latitude: -0.9253497,
    longitude: 100.3728503,
    facilities: ['Outdoor Cafe', 'Menu Makanan', 'WiFi', 'Shower'],
  },
  {
    id: 'pool-30-grandsari',
    name: 'Fun Pool Grand Sari Hotel',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang hotel di pusat Kota Padang dengan suasana tenang dan rindang sangat cocok untuk bersantai.',
    address: 'Jl. Jend. Sudirman, Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Rp 40.000 – Rp 55.000',
    ticketPriceMin: 40000,
    rating: 4.2,
    openingHours: '07:00 – 19:00 WIB',
    latitude: -0.9549312,
    longitude: 100.3678885,
    facilities: ['Poolside Lounge', 'Hotel Resto', 'Shower', 'Handuk'],
  },
  {
    id: 'pool-31-abg',
    name: 'Kolam Renang ABG',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Destinasi wisata air alam di perbukitan Koto Tangah. Air kolam berasal dari mata air pegunungan alami yang dingin.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Rp 25.000',
    ticketPriceMin: 25000,
    rating: 4.5,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -0.8271774,
    longitude: 100.3962117,
    facilities: ['Air Mata Air Alami', 'Slide Anak', 'Gazebo', 'Kantin Tradisional'],
  },
  {
    id: 'pool-32-wiratirta',
    name: 'Kolam Renang Wira Tirta Pagambiran',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang di kawasan Pagambiran, ramai dikunjungi anak-anak sekitar di sore hari.',
    address: 'Pagambiran, Lubuk Begalung',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 3.9,
    openingHours: '08:00 – 17:30 WIB',
    latitude: -0.9804416,
    longitude: 100.4084712,
    facilities: ['Kolam Bermain', 'Kamar Ganti', 'Warung Ringan'],
  },
  {
    id: 'pool-33-hayyantirta',
    name: 'Kolam Renang Muslim Muslimah Indoor Hayyan Tirta',
    kategori: 'Rekreasi',
    jenisKolam: 'Indoor',
    description: 'Kolam renang syariah berkonsep indoor dengan pemisahan waktu dan area khusus pria dan wanita, menjamin privasi.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Weekday Dewasa: Rp 20.000, Anak: Rp 15.000 | Weekend Dewasa: Rp 25.000, Anak: Rp 20.000',
    ticketPriceMin: 15000,
    rating: 4.4,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8542717,
    longitude: 100.3648013,
    facilities: ['Kolam Syariah Indoor', 'Area Privat Pria & Wanita', 'Kamar Ganti', 'Kantin Halal'],
  },
  {
    id: 'pool-34-amerta',
    name: 'Amerta Swimming Pool',
    kategori: 'Rekreasi',
    jenisKolam: 'Indoor',
    description: 'Kolam renang indoor di Padang Selatan, bebas dari sengatan matahari dengan air yang terjaga kebersihannya sepanjang hari.',
    address: 'Padang Selatan',
    district: 'Padang Selatan',
    ticketPrice: 'Weekday Dewasa: Rp 50.000, Anak: Rp 30.000 | Weekend Dewasa: Rp 60.000, Anak: Rp 35.000',
    ticketPriceMin: 30000,
    rating: 4.3,
    openingHours: '08:00 – 19:00 WIB',
    latitude: -0.9585801,
    longitude: 100.3549528,
    facilities: ['Indoor Pool Bersih', 'Shower & Bilas Sabun', 'WiFi', 'AC'],
  },
  {
    id: 'pool-35-teratai',
    name: 'Kolam Renang Teratai',
    kategori: 'Atlet',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang standar olimpiade milik Pemerintah Kota Padang di GOR H. Agus Salim. Tempat latihan atlet renang daerah.',
    address: 'GOR H. Agus Salim, Rimbo Kaluang, Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Senin–Jumat: Rp 10.000 | Sabtu–Minggu: Rp 12.000',
    ticketPriceMin: 10000,
    rating: 4.2,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.9305979,
    longitude: 100.3597607,
    facilities: ['Kolam Olimpiade 50m', 'Kolam Anak', 'Tribun', 'Kamar Bilas', 'Kantin'],
  },
  {
    id: 'pool-36-unp',
    name: 'Grand Swimming Pool Indoor UNP',
    kategori: 'Atlet',
    jenisKolam: 'Indoor',
    description: 'Fasilitas kolam renang indoor bertaraf olimpiade nasional milik Universitas Negeri Padang. Higienis dan berstandar tinggi.',
    address: 'Kampus UNP Air Tawar, Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.6,
    openingHours: '08:00 – 17:00 WIB',
    latitude: -0.8987186,
    longitude: 100.3476573,
    facilities: ['Kolam Indoor 50m', 'Tribun Penonton', 'Kamar Bilas Modern', 'Ruang Ganti'],
  },
  {
    id: 'pool-37-puncaklalang',
    name: 'Kolam Renang Puncak Lalang',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam pemandian buatan berair sejuk di kawasan perkebunan kelapa perbukitan Koto Tangah.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.8825606,
    longitude: 100.4361523,
    facilities: ['Kolam Keluarga', 'Gazebo Kayu', 'Kebun Kelapa'],
  },
  {
    id: 'pool-38-lumbalumba',
    name: 'Kolam Renang Lumba Lumba',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang di Lubuk Begalung yang melayani program terapi air untuk lansia dan pasca-stroke.',
    address: 'Lubuk Begalung, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.2,
    openingHours: '06:00 – 18:00 WIB',
    latitude: -0.9689576,
    longitude: 100.4021344,
    facilities: ['Kolam Terapi Hangat', 'Shower Difabel', 'Loker'],
  },
  {
    id: 'pool-39-wanaraja',
    name: 'Wanaraja Pool & Spa',
    kategori: 'Rekreasi',
    jenisKolam: 'Indoor',
    description: 'Kombinasi kolam renang dan pusat spa tradisional Minang di kawasan Padang Barat. Sangat cocok untuk relaksasi total.',
    address: 'Padang Barat',
    district: 'Padang Barat',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.5,
    openingHours: '08:00 – 20:00 WIB',
    latitude: -0.9158863,
    longitude: 100.3552445,
    facilities: ['Spa Room', 'Swimming Pool', 'Pijat Tradisional', 'Shower Hangat'],
  },
  {
    id: 'pool-40-raisyah',
    name: 'Kolam Renang Raisyah',
    kategori: 'Rekreasi',
    jenisKolam: 'Indoor',
    description: 'Kolam renang semi-privat bernuansa kebun asri di Nanggalo, ideal untuk acara keluarga atau arisan.',
    address: 'Nanggalo, Padang',
    district: 'Nanggalo',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '08:30 – 18:00 WIB',
    latitude: -0.8780546,
    longitude: 100.3803217,
    facilities: ['Garden Pool', 'Kolam Teduh', 'BBQ Area', 'Kamar Ganti'],
  },
  {
    id: 'pool-41-campusbri',
    name: 'Kolam Renang Campus BRI',
    kategori: 'Atlet',
    jenisKolam: 'Indoor',
    description: 'Kolam renang di kompleks Diklat BRI Padang. Pengawasan ketat dan kebersihan air sangat tinggi sesuai standar pelatihan.',
    address: 'Jl. Lapai, Padang Utara',
    district: 'Padang Utara',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.4,
    openingHours: '07:00 – 17:30 WIB',
    latitude: -0.9281563,
    longitude: 100.4311390,
    facilities: ['Kolam Olahraga', 'Lifeguard', 'Shower Bilas', 'Loker'],
  },
  {
    id: 'pool-42-tepshung',
    name: 'Kolam Renang Tep Shung',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang legendaris dikelola warga keturunan Tionghoa Padang di dekat kawasan Pecinan bersejarah.',
    address: 'Koto Tangah, Padang',
    district: 'Koto Tangah',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.0,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9600015,
    longitude: 100.4190399,
    facilities: ['Kolam Latihan', 'Kamar Bilas', 'Warung Tradisional'],
  },
  {
    id: 'pool-43-mataair',
    name: 'Kolam Renang Mata Air',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Pemandian kolam semen tua berair jernih di kawasan Bukit Mata Air Padang Selatan.',
    address: 'Padang Selatan',
    district: 'Padang Selatan',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.1,
    openingHours: '07:00 – 18:00 WIB',
    latitude: -0.9730867,
    longitude: 100.3844782,
    facilities: ['Kolam Air Alami', 'Kamar Ganti', 'Warung Rujak'],
  },
  {
    id: 'pool-44-arauwaterpark',
    name: 'ARAU WATER PARK',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Taman rekreasi air keluarga terbesar di tepian Sungai Batang Arau. Lengkap dengan seluncuran dan area bermain air anak.',
    address: 'Pemancungan, Padang Selatan',
    district: 'Padang Selatan',
    ticketPrice: 'Rp 35.000',
    ticketPriceMin: 35000,
    rating: 4.4,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9573186,
    longitude: 100.3595772,
    facilities: ['Seluncuran Spiral', 'Ember Tumpah', 'Kolam Arus', 'Gazebo', 'Panggung Hiburan'],
  },
  {
    id: 'pool-45-akhelva',
    name: 'AKHELVA HOUSE WaterPark Dan Wisata Alam',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Destinasi wisata keluarga dengan kolam renang dikombinasikan taman asri, kolam ikan, dan wisata alam.',
    address: 'Lubuk Begalung / Koto Tangah, Padang',
    district: 'Lubuk Begalung',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.4,
    openingHours: '08:00 – 18:00 WIB',
    latitude: -0.9367820,
    longitude: 100.4736823,
    facilities: ['Water Playground', 'Taman Bunga', 'Gazebo Teduh', 'Kolam Ikan', 'Kantin'],
  },
  {
    id: 'pool-46-faharfiq',
    name: 'Kolam Renang Faharfiq Zwembad',
    kategori: 'Rekreasi',
    jenisKolam: 'Outdoor',
    description: 'Kolam renang bernuansa klasik Eropa di Padang. Dilengkapi sistem pemanas air dan fasilitas kamar mandi yang bersih.',
    address: 'Padang, Sumatera Barat',
    district: 'Padang',
    ticketPrice: 'Hubungi lokasi',
    ticketPriceMin: 0,
    rating: 4.4,
    openingHours: '06:00 – 19:00 WIB',
    latitude: -0.9392783,
    longitude: 100.4682755,
    facilities: ['Pemanas Air', 'Kamar Mandi Eropa', 'Ruang Santai', 'WiFi'],
  },
];

export const SpatialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pools, setPools] = useState<SwimmingPool[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [filteredPools, setFilteredPools] = useState<SwimmingPool[]>(pools);
  const [selectedPool, setSelectedPool] = useState<SwimmingPool | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearestPool, setNearestPool] = useState<SwimmingPool | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const [nearestRouteGeoJson, setNearestRouteGeoJson] = useState<any>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>(PADANG_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<'directory' | 'nearest' | 'detail'>('directory');

  // Interactive location picker states
  const [isSelectingLocation, setIsSelectingLocation] = useState<boolean>(false);
  const [formCoords, setFormCoords] = useState<[number, number] | null>(null);
  const [isSelectingUserLocation, setIsSelectingUserLocation] = useState<boolean>(false);

  // Dual routing states
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [routeMode, setRouteModeState] = useState<'driving' | 'walking'>('driving');
  const [drivingGeometry, setDrivingGeometry] = useState<any | null>(null);
  const [walkingGeometry, setWalkingGeometry] = useState<any | null>(null);

  const setRouteMode = (mode: 'driving' | 'walking') => {
    setRouteModeState(mode);
    if (routeDetails) {
      if (mode === 'driving') {
        setNearestDistance(routeDetails.drivingDistance);
        if (drivingGeometry) setNearestRouteGeoJson(drivingGeometry);
      } else {
        setNearestDistance(routeDetails.walkingDistance);
        if (walkingGeometry) setNearestRouteGeoJson(walkingGeometry);
      }
    }
  };

  // Fetch pools from backend on mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pools');
        if (!response.ok) throw new Error('Failed to fetch from backend');
        const data = await response.json();
        setPools(data);
      } catch (err) {
        console.error('Failed to load pools from backend API, using local fallback:', err);
        const saved = localStorage.getItem('aqua_pools');
        setPools(saved ? JSON.parse(saved) : POOLS_DATA);
      }
    };
    fetchPools();
  }, []);

  // Sync to localStorage as backup/cache
  useEffect(() => {
    if (pools.length > 0) {
      localStorage.setItem('aqua_pools', JSON.stringify(pools));
    }
  }, [pools]);

  useEffect(() => {
    let result = pools;

    if (selectedKategori !== 'Semua') {
      result = result.filter(p => p.kategori === selectedKategori);
    }
    if (selectedJenis !== 'Semua') {
      result = result.filter(p => p.jenisKolam === selectedJenis);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.facilities.some(f => f.toLowerCase().includes(q))
      );
    }

    setFilteredPools(result);
  }, [pools, searchQuery, selectedKategori, selectedJenis]);

  const handleSelectPool = async (pool: SwimmingPool | null) => {
    setSelectedPool(pool);
    if (pool) {
      setMapCenter([pool.latitude, pool.longitude]);
      setMapZoom(15);
      setActiveTab('detail');
      
      // Auto-calculate route if userLocation is already set
      if (userLocation) {
        const [userLat, userLng] = userLocation;
        try {
          // Fetch driving route from German OSM routing (routed-car)
          const drivingUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${userLng},${userLat};${pool.longitude},${pool.latitude}?overview=full&geometries=geojson`;
          const drivingRes = await fetch(drivingUrl);
          if (!drivingRes.ok) throw new Error('Driving fetch error');
          const drivingData = await drivingRes.json();
          
          // Fetch walking route from German OSM routing (routed-foot)
          const walkingUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${userLng},${userLat};${pool.longitude},${pool.latitude}?overview=full&geometries=geojson`;
          const walkingRes = await fetch(walkingUrl);
          if (!walkingRes.ok) throw new Error('Walking fetch error');
          const walkingData = await walkingRes.json();
          
          if (drivingData.routes && drivingData.routes.length > 0 && walkingData.routes && walkingData.routes.length > 0) {
            const drivingRoute = drivingData.routes[0];
            const walkingRoute = walkingData.routes[0];
            
            const details: RouteDetails = {
              drivingDistance: parseFloat((drivingRoute.distance / 1000).toFixed(2)),
              drivingDuration: Math.round(drivingRoute.duration / 60),
              walkingDistance: parseFloat((walkingRoute.distance / 1000).toFixed(2)),
              walkingDuration: Math.round(walkingRoute.duration / 60)
            };
            
            setRouteDetails(details);
            setDrivingGeometry(drivingRoute.geometry);
            setWalkingGeometry(walkingRoute.geometry);
            
            if (routeMode === 'driving') {
              setNearestDistance(details.drivingDistance);
              setNearestRouteGeoJson(drivingRoute.geometry);
            } else {
              setNearestDistance(details.walkingDistance);
              setNearestRouteGeoJson(walkingRoute.geometry);
            }
            return;
          }
          throw new Error('No routes found');
        } catch (err) {
          console.warn('OSRM routing failed on selectPool, using straight line fallback:', err);
          const dist = turf.distance(
            turf.point([userLng, userLat]),
            turf.point([pool.longitude, pool.latitude]),
            { units: 'kilometers' }
          );
          const fallbackDist = parseFloat(dist.toFixed(2));
          const details: RouteDetails = {
            drivingDistance: fallbackDist,
            drivingDuration: Math.round((fallbackDist / 40) * 60),
            walkingDistance: fallbackDist,
            walkingDuration: Math.round((fallbackDist / 5) * 60)
          };
          setRouteDetails(details);
          const lineGeom = turf.lineString([[userLng, userLat], [pool.longitude, pool.latitude]]).geometry;
          setDrivingGeometry(lineGeom);
          setWalkingGeometry(lineGeom);
          
          setNearestDistance(fallbackDist);
          setNearestRouteGeoJson(lineGeom);
        }
      }
    } else {
      clearNearestAnalysis();
    }
  };

  const calculateRouteToPool = (pool: SwimmingPool, customCoords?: [number, number]) => {
    const performRouting = async (lat: number, lng: number) => {
      setUserLocation([lat, lng]);
      
      try {
        // Fetch driving route from German OSM routing (routed-car)
        const drivingUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng},${lat};${pool.longitude},${pool.latitude}?overview=full&geometries=geojson`;
        const drivingRes = await fetch(drivingUrl);
        if (!drivingRes.ok) throw new Error('Driving fetch error');
        const drivingData = await drivingRes.json();
        
        // Fetch walking route from German OSM routing (routed-foot)
        const walkingUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${lng},${lat};${pool.longitude},${pool.latitude}?overview=full&geometries=geojson`;
        const walkingRes = await fetch(walkingUrl);
        if (!walkingRes.ok) throw new Error('Walking fetch error');
        const walkingData = await walkingRes.json();
        
        if (drivingData.routes && drivingData.routes.length > 0 && walkingData.routes && walkingData.routes.length > 0) {
          const drivingRoute = drivingData.routes[0];
          const walkingRoute = walkingData.routes[0];
          
          const details: RouteDetails = {
            drivingDistance: parseFloat((drivingRoute.distance / 1000).toFixed(2)),
            drivingDuration: Math.round(drivingRoute.duration / 60),
            walkingDistance: parseFloat((walkingRoute.distance / 1000).toFixed(2)),
            walkingDuration: Math.round(walkingRoute.duration / 60)
          };
          
          setRouteDetails(details);
          setDrivingGeometry(drivingRoute.geometry);
          setWalkingGeometry(walkingRoute.geometry);
          
          if (routeMode === 'driving') {
            setNearestDistance(details.drivingDistance);
            setNearestRouteGeoJson(drivingRoute.geometry);
          } else {
            setNearestDistance(details.walkingDistance);
            setNearestRouteGeoJson(walkingRoute.geometry);
          }
          
          // Fit map bounds to show both points
          const avgLat = (lat + pool.latitude) / 2;
          const avgLng = (lng + pool.longitude) / 2;
          setMapCenter([avgLat, avgLng]);
          setMapZoom(13);
          return;
        }
        throw new Error('No OSRM routes found');
      } catch (err) {
        console.warn('OSRM routing failed, using straight line fallback:', err);
        const dist = turf.distance(
          turf.point([lng, lat]),
          turf.point([pool.longitude, pool.latitude]),
          { units: 'kilometers' }
        );
        const fallbackDist = parseFloat(dist.toFixed(2));
        
        const details: RouteDetails = {
          drivingDistance: fallbackDist,
          drivingDuration: Math.round((fallbackDist / 40) * 60),
          walkingDistance: fallbackDist,
          walkingDuration: Math.round((fallbackDist / 5) * 60)
        };
        
        setRouteDetails(details);
        const lineGeom = turf.lineString([[lng, lat], [pool.longitude, pool.latitude]]).geometry;
        setDrivingGeometry(lineGeom);
        setWalkingGeometry(lineGeom);
        
        setNearestDistance(fallbackDist);
        setNearestRouteGeoJson(lineGeom);
        
        // Zoom map to cover both points
        const avgLat = (lat + pool.latitude) / 2;
        const avgLng = (lng + pool.longitude) / 2;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(13);
      }
    };

    if (customCoords) {
      performRouting(customCoords[0], customCoords[1]);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performRouting(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Gagal mendapatkan lokasi GPS. Silakan klik tombol "Pilih di Peta" untuk menentukan lokasi Anda secara manual.');
        }
      );
    } else {
      alert('Browser Anda tidak mendukung Geolocation.');
    }
  };

  const addPool = async (poolData: Omit<SwimmingPool, 'id'>) => {
    const tempId = `pool-${Date.now()}`;
    const newPoolTemp: SwimmingPool = {
      ...poolData,
      id: tempId
    };

    try {
      const response = await fetch('http://localhost:5000/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPoolTemp),
      });
      if (!response.ok) throw new Error('Failed to add pool to backend');
      const savedPool = await response.json();
      setPools(prev => [savedPool, ...prev]);
    } catch (err) {
      console.error('Error syncing addPool to backend:', err);
      // Fallback local update
      setPools(prev => [newPoolTemp, ...prev]);
    }
  };

  const updatePool = async (id: string, updated: Partial<SwimmingPool>) => {
    // Optimistic local update
    setPools(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    if (selectedPool?.id === id) {
      setSelectedPool(prev => prev ? { ...prev, ...updated } : null);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/pools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updated),
      });
      if (!response.ok) throw new Error('Failed to update pool in backend');
      const savedPool = await response.json();
      // Sync local state with exact database output
      setPools(prev => prev.map(p => p.id === id ? savedPool : p));
    } catch (err) {
      console.error('Error syncing updatePool to backend:', err);
    }
  };

  const deletePool = async (id: string) => {
    // Optimistic local delete
    setPools(prev => prev.filter(p => p.id !== id));
    if (selectedPool?.id === id) {
      setSelectedPool(null);
      setActiveTab('directory');
    }

    try {
      const response = await fetch(`http://localhost:5000/api/pools/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete pool from backend');
    } catch (err) {
      console.error('Error syncing deletePool to backend:', err);
    }
  };

  const findNearestPool = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    const clickedPoint = turf.point([lng, lat]);
    let closestPool: SwimmingPool | null = null;
    let minDistance = Infinity;

    pools.forEach(pool => {
      // Exclude pools that are closed
      if (pool.status === 'Tutup') return;
      const dist = turf.distance(clickedPoint, turf.point([pool.longitude, pool.latitude]), { units: 'kilometers' });
      if (dist < minDistance) { minDistance = dist; closestPool = pool; }
    });

    if (closestPool) {
      setNearestPool(closestPool);
      
      const getRoadRoute = async (targetPool: SwimmingPool) => {
        try {
          const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng},${lat};${targetPool.longitude},${targetPool.latitude}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('OSRM API error');
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setNearestDistance(parseFloat((route.distance / 1000).toFixed(2)));
            setNearestRouteGeoJson(route.geometry);
            return;
          }
          throw new Error('No OSRM routes found');
        } catch (err) {
          console.warn('OSRM routing failed on findNearestPool, using straight line fallback:', err);
          setNearestDistance(parseFloat(minDistance.toFixed(2)));
          setNearestRouteGeoJson(
            turf.lineString([[lng, lat], [targetPool.longitude, targetPool.latitude]])
          );
        }
      };

      getRoadRoute(closestPool);
      
      setActiveTab('nearest');
      const avgLat = (lat + (closestPool as SwimmingPool).latitude) / 2;
      const avgLng = (lng + (closestPool as SwimmingPool).longitude) / 2;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(13);
    }
  };

  const clearNearestAnalysis = () => {
    setUserLocation(null); setNearestPool(null); setNearestDistance(null);
    setNearestRouteGeoJson(null); setActiveTab('directory');
    setRouteDetails(null);
    setDrivingGeometry(null);
    setWalkingGeometry(null);
  };

  return (
    <SpatialContext.Provider value={{
      pools, filteredPools, searchQuery, setSearchQuery,
      selectedKategori, setSelectedKategori, selectedJenis, setSelectedJenis,
      selectedPool, setSelectedPool: handleSelectPool,
      userLocation, setUserLocation,
      nearestPool, nearestDistance, nearestRouteGeoJson,
      findNearestPool, clearNearestAnalysis,
      mapCenter, setMapCenter, mapZoom, setMapZoom, activeTab, setActiveTab,
      addPool, updatePool, deletePool,
      isSelectingLocation, setIsSelectingLocation,
      formCoords, setFormCoords,
      isSelectingUserLocation, setIsSelectingUserLocation,
      calculateRouteToPool,
      routeDetails,
      routeMode,
      setRouteMode
    }}>
      {children}
    </SpatialContext.Provider>
  );
};

export const useSpatial = () => {
  const ctx = useContext(SpatialContext);
  if (!ctx) throw new Error('useSpatial must be used within a SpatialProvider');
  return ctx;
};
