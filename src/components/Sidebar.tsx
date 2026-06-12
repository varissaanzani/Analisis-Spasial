import React, { useState, useEffect } from 'react';
import { useSpatial } from '../context/SpatialContext';
import {
  Search, MapPin, Clock, Coins, Star,
  ArrowLeft, Check, Compass, Navigation,
  Dumbbell, Home, Plus, Trash2, Edit, X,
  Car, Footprints
} from 'lucide-react';

const IMAGE_PRESETS = [
  {
    name: 'Outdoor Pool',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Indoor Pool',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Waterpark',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mata Air',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
  }
];

const STANDARD_FACILITIES = [
  'Kolam Utama', 'Kolam Anak', 'Kamar Bilas', 'Kantin',
  'Seluncuran', 'Gazebo', 'WiFi', 'Loker', 'Shower Air Hangat'
];

export const Sidebar: React.FC = () => {
  const {
    filteredPools,
    searchQuery,
    setSearchQuery,
    selectedKategori,
    setSelectedKategori,
    selectedJenis,
    setSelectedJenis,
    selectedPool,
    setSelectedPool,
    userLocation,
    nearestPool,
    nearestDistance,
    clearNearestAnalysis,
    activeTab,
    setActiveTab,
    // CRUD
    pools,
    addPool,
    updatePool,
    deletePool,
    isSelectingLocation,
    setIsSelectingLocation,
    formCoords,
    setFormCoords,
    isSelectingUserLocation,
    setIsSelectingUserLocation,
    calculateRouteToPool,
    routeDetails,
    routeMode,
    setRouteMode
  } = useSpatial();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Keep track of broken image URLs to fallback gracefully
  const [imageErrorUrls, setImageErrorUrls] = useState<Record<string, boolean>>({});

  // Form Mode State
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formKategori, setFormKategori] = useState<'Rekreasi' | 'Atlet'>('Rekreasi');
  const [formJenis, setFormJenis] = useState<'Indoor' | 'Outdoor'>('Outdoor');
  const [formStatus, setFormStatus] = useState<'Buka' | 'Tutup' | 'Renovasi'>('Buka');
  const [formDescription, setFormDescription] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formTicketPrice, setFormTicketPrice] = useState('Hubungi lokasi');
  const [formTicketPriceMin, setFormTicketPriceMin] = useState(0);
  const [formRating, setFormRating] = useState(4.0);
  const [formOpeningHours, setFormOpeningHours] = useState('08:00 – 18:00 WIB');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isCompressing, setIsCompressing] = useState(false);
  const [formFacilities, setFormFacilities] = useState<string[]>([]);
  const [customFacility, setCustomFacility] = useState('');
  const [formLat, setFormLat] = useState<number>(-0.9305);
  const [formLng, setFormLng] = useState<number>(100.3598);

  // Sync picked coordinates to form state
  useEffect(() => {
    if (formCoords) {
      setFormLat(formCoords[0]);
      setFormLng(formCoords[1]);
    }
  }, [formCoords]);

  // Convert local file to compressed Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP, dll)');
      return;
    }
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setFormImageUrl(base64);
        setIsCompressing(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLocalSearch(q);
    setSearchQuery(q);
  };

  const handleBackToDirectory = () => {
    setSelectedPool(null);
    setActiveTab('directory');
  };

  const handleStartAddPool = () => {
    setFormMode('add');
    setFormName('');
    setFormKategori('Rekreasi');
    setFormJenis('Outdoor');
    setFormStatus('Buka');
    setFormDescription('');
    setFormAddress('');
    setFormDistrict('');
    setFormTicketPrice('Hubungi lokasi');
    setFormTicketPriceMin(0);
    setFormRating(4.0);
    setFormOpeningHours('08:00 – 18:00 WIB');
    setFormImageUrl('');
    setFormFacilities(['Kolam Utama', 'Kamar Bilas']);
    setFormLat(-0.9305);
    setFormLng(100.3598);
    setFormCoords(null);
    setIsSelectingLocation(false);
  };

  const handleStartEditPool = () => {
    if (!selectedPool) return;
    setFormMode('edit');
    setFormName(selectedPool.name);
    setFormKategori(selectedPool.kategori);
    setFormJenis(selectedPool.jenisKolam);
    setFormStatus(selectedPool.status || 'Buka');
    setFormDescription(selectedPool.description);
    setFormAddress(selectedPool.address);
    setFormDistrict(selectedPool.district);
    setFormTicketPrice(selectedPool.ticketPrice);
    setFormTicketPriceMin(selectedPool.ticketPriceMin);
    setFormRating(selectedPool.rating);
    setFormOpeningHours(selectedPool.openingHours);
    setFormImageUrl(selectedPool.imageUrl || '');
    setFormFacilities(selectedPool.facilities);
    setFormLat(selectedPool.latitude);
    setFormLng(selectedPool.longitude);
    setFormCoords([selectedPool.latitude, selectedPool.longitude]);
    setIsSelectingLocation(false);
  };

  const handleDeletePool = () => {
    if (!selectedPool) return;
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus "${selectedPool.name}"? Data ini akan terhapus secara permanen.`);
    if (confirmed) {
      deletePool(selectedPool.id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert('Nama kolam renang harus diisi!');
      return;
    }
    if (!formAddress.trim()) {
      alert('Alamat harus diisi!');
      return;
    }
    if (!formDistrict.trim()) {
      alert('Kecamatan harus diisi!');
      return;
    }

    const poolData = {
      name: formName,
      kategori: formKategori,
      jenisKolam: formJenis,
      status: formStatus,
      description: formDescription,
      address: formAddress,
      district: formDistrict,
      ticketPrice: formTicketPrice || 'Hubungi lokasi',
      ticketPriceMin: Number(formTicketPriceMin) || 0,
      rating: Number(formRating) || 4.0,
      openingHours: formOpeningHours || '08:00 – 18:00 WIB',
      latitude: Number(formLat) || -0.9305,
      longitude: Number(formLng) || 100.3598,
      facilities: formFacilities,
      imageUrl: formImageUrl || undefined
    };

    if (formMode === 'add') {
      addPool(poolData);
      setFormMode(null);
      setActiveTab('directory');
    } else if (formMode === 'edit' && selectedPool) {
      updatePool(selectedPool.id, poolData);
      setFormMode(null);
      setActiveTab('detail');
    }
  };

  const renderForm = () => {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ display: 'flex', alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.78rem', borderRadius: '20px' }}
          onClick={() => {
            setFormMode(null);
            setIsSelectingLocation(false);
            setFormCoords(null);
          }}
        >
          <ArrowLeft size={13} /> Batal
        </button>

        <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          {formMode === 'add' ? 'Tambah Kolam Baru' : 'Edit Kolam Renang'}
        </h2>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Nama */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nama Kolam Renang *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Contoh: Kolam Renang Teratai"
              style={{
                width: '100%', padding: '10px 12px', marginTop: '4px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
              }}
            />
          </div>

          {/* Kategori, Jenis, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kategori
              </label>
              <select
                value={formKategori}
                onChange={e => setFormKategori(e.target.value as any)}
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              >
                <option value="Rekreasi">Rekreasi</option>
                <option value="Atlet">Atlet</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jenis Kolam
              </label>
              <select
                value={formJenis}
                onChange={e => setFormJenis(e.target.value as any)}
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              >
                <option value="Outdoor">Outdoor</option>
                <option value="Indoor">Indoor</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status Operasional
            </label>
            <select
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as any)}
              style={{
                width: '100%', padding: '10px 12px', marginTop: '4px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
              }}
            >
              <option value="Buka">Buka</option>
              <option value="Tutup">Tutup</option>
              <option value="Renovasi">Renovasi</option>
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deskripsi
            </label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Deskripsi singkat mengenai kolam renang..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', marginTop: '4px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem', fontFamily: 'var(--font-sans)', resize: 'vertical'
              }}
            />
          </div>

          {/* Alamat & Kecamatan */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alamat Lengkap *
            </label>
            <input
              type="text"
              required
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="Contoh: Jl. Ganting No. 12, Padang Timur"
              style={{
                width: '100%', padding: '10px 12px', marginTop: '4px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kecamatan *
            </label>
            <input
              type="text"
              required
              value={formDistrict}
              onChange={e => setFormDistrict(e.target.value)}
              placeholder="Contoh: Padang Timur"
              style={{
                width: '100%', padding: '10px 12px', marginTop: '4px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
              }}
            />
          </div>

          {/* Jam Buka & Harga Tiket */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jam Buka
              </label>
              <input
                type="text"
                value={formOpeningHours}
                onChange={e => setFormOpeningHours(e.target.value)}
                placeholder="08:00 – 18:00 WIB"
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Harga Tiket (Teks)
              </label>
              <input
                type="text"
                value={formTicketPrice}
                onChange={e => setFormTicketPrice(e.target.value)}
                placeholder="Rp 15.000"
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Harga Tiket Min (Angka)
              </label>
              <input
                type="number"
                value={formTicketPriceMin}
                onChange={e => setFormTicketPriceMin(Number(e.target.value))}
                placeholder="15000"
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rating (0 - 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formRating}
                onChange={e => setFormRating(Number(e.target.value))}
                placeholder="4.5"
                style={{
                  width: '100%', padding: '10px 12px', marginTop: '4px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                }}
              />
            </div>
          </div>

          {/* Peta/Koordinat Picker */}
          <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Koordinat Lokasi Peta *
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latitude</span>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={formLat}
                  onChange={e => setFormLat(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.78rem'
                  }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Longitude</span>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={formLng}
                  onChange={e => setFormLng(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.78rem'
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              className={`btn ${isSelectingLocation ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', gap: '6px', marginTop: '8px', fontSize: '0.78rem', padding: '8px' }}
              onClick={() => {
                setIsSelectingLocation(!isSelectingLocation);
                clearNearestAnalysis();
              }}
            >
              <MapPin size={13} />
              {isSelectingLocation ? 'Mendengarkan Klik Peta...' : 'Pilih Lokasi dari Peta'}
            </button>
          </div>

          {/* Foto – Tab Upload / URL */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {/* Tab Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
              {(['upload', 'url'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setImageTab(tab)}
                  style={{
                    flex: 1, padding: '8px', fontSize: '0.75rem', fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: imageTab === tab ? 'var(--bg-accent-light)' : 'var(--bg-tertiary)',
                    color: imageTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottom: imageTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  }}
                >
                  {tab === 'upload' ? '📁 Upload dari Perangkat' : '🔗 Link URL'}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Preview (shared between tabs) */}
              {formImageUrl && (
                <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }} />
                  <button
                    type="button"
                    onClick={() => setFormImageUrl('')}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: '22px', height: '22px', cursor: 'pointer', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                  <span style={{
                    position: 'absolute', bottom: '5px', left: '8px',
                    fontSize: '0.62rem', color: 'white', fontWeight: 600
                  }}>Preview Foto</span>
                </div>
              )}

              {imageTab === 'upload' ? (
                <div>
                  {/* Drop zone / file picker */}
                  <label
                    htmlFor="pool-img-upload"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', padding: '20px 12px',
                      border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', background: 'var(--bg-tertiary)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    {isCompressing ? (
                      <>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mengompres gambar...</span>
                      </>
                    ) : (
                      <>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Klik untuk pilih foto</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP – maks 10MB</span>
                      </>
                    )}
                  </label>
                  <input
                    id="pool-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                    Foto akan dikompres otomatis &amp; disimpan di perangkat ini
                  </div>

                  {/* Preset grid */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Atau pilih foto preset:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                      {IMAGE_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormImageUrl(preset.url)}
                          style={{
                            height: '42px', borderRadius: 'var(--radius-sm)',
                            backgroundImage: `url(${preset.url})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            cursor: 'pointer',
                            border: formImageUrl === preset.url ? '2.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            opacity: formImageUrl === preset.url ? 1 : 0.65,
                            transition: 'all 0.2s', overflow: 'hidden',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                          }}
                          title={preset.name}
                        >
                          <span style={{ fontSize: '0.5rem', color: 'white', background: 'rgba(0,0,0,0.6)', width: '100%', textAlign: 'center', padding: '1px 0' }}>
                            {preset.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Direct Image URL
                  </label>
                  <input
                    type="text"
                    value={formImageUrl.startsWith('data:') ? '' : formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/kolam.jpg"
                    style={{
                      width: '100%', padding: '10px 12px', marginTop: '4px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)', fontSize: '0.825rem'
                    }}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: 1.5 }}>
                    ⚠️ Gunakan link langsung ke file gambar (berakhiran .jpg, .png, .webp).<br />
                    Klik kanan foto → <strong>Salin alamat gambar</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fasilitas */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fasilitas Tersedia
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
              {STANDARD_FACILITIES.map(fac => {
                const isChecked = formFacilities.includes(fac);
                return (
                  <label key={fac} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setFormFacilities(prev => prev.filter(f => f !== fac));
                        } else {
                          setFormFacilities(prev => [...prev, fac]);
                        }
                      }}
                    />
                    {fac}
                  </label>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Fasilitas lainnya..."
                value={customFacility}
                onChange={e => setCustomFacility(e.target.value)}
                style={{
                  flex: 1, padding: '6px 10px', fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => {
                  if (customFacility.trim() && !formFacilities.includes(customFacility.trim())) {
                    setFormFacilities(prev => [...prev, customFacility.trim()]);
                    setCustomFacility('');
                  }
                }}
              >
                Tambah
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {formFacilities.map(fac => (
                <span key={fac} className="facility-tag" style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {fac}
                  <X size={10} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setFormFacilities(prev => prev.filter(f => f !== fac))} />
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', gap: '8px', padding: '12px' }}
          >
            {formMode === 'add' ? 'Simpan Titik Kolam Baru' : 'Simpan Perubahan Data'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="sidebar-container">
      {/* ── HEADER ── */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            width: '40px', height: '40px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(8,145,178,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6c.6.5 1.2 1 2.5 1C6 7 7 5 9 5c2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
              <path d="M2 12c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
              <path d="M2 18c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>AquaMap</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Direktori Kolam Renang Kota Padang
            </p>
          </div>
        </div>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-primary)',
          background: 'var(--bg-accent-light)', padding: '3px 8px',
          border: '1px solid rgba(8,145,178,0.2)', borderRadius: '20px',
        }}>{pools.length} Lokasi</span>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ padding: '0 24px 12px 24px' }}>
        <div style={{
          display: 'flex', gap: '4px',
          backgroundColor: 'var(--bg-primary)', padding: '3px',
          borderRadius: '10px', border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            title="Direktori"
            aria-pressed={activeTab === 'directory' || activeTab === 'detail'}
            className={`tab-btn ${activeTab === 'directory' || activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => { setSelectedPool(null); setActiveTab('directory'); }}
          >Direktori</button>
          <button
            type="button"
            title="Cari Terdekat"
            aria-pressed={activeTab === 'nearest'}
            className={`tab-btn ${activeTab === 'nearest' ? 'active' : ''}`}
            onClick={() => setActiveTab('nearest')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Compass size={13} /> Cari Terdekat
            </div>
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="sidebar-content">
        {formMode ? (
          renderForm()
        ) : (
          <>
            {/* ════ DIRECTORY ════ */}
        {activeTab === 'directory' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Search bar */}
            <div className="search-wrapper">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama, lokasi, fasilitas..."
                value={localSearch}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {/* Filter row 1 – Kategori Penggunaan */}
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Tipe Penggunaan
              </p>
              <div className="filter-pills-container">
                {['Semua', 'Rekreasi', 'Atlet'].map(k => (
                  <button
                    key={k}
                    onClick={() => setSelectedKategori(k)}
                    className={`pill-btn ${selectedKategori === k ? 'active' : ''}`}
                  >
                    {k === 'Atlet' && <Dumbbell size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter row 2 – Indoor / Outdoor */}
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Jenis Kolam
              </p>
              <div className="filter-pills-container">
                {['Semua', 'Indoor', 'Outdoor'].map(j => (
                  <button
                    key={j}
                    onClick={() => setSelectedJenis(j)}
                    className={`pill-btn ${selectedJenis === j ? 'active' : ''}`}
                  >
                    {j === 'Indoor' && <Home size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Pool Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', gap: '8px', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}
              onClick={handleStartAddPool}
            >
              <Plus size={16} /> Tambah Titik Kolam Baru
            </button>

            {/* Result count */}
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Menampilkan <strong style={{ color: 'var(--accent-primary)' }}>{filteredPools.length}</strong> dari {pools.length} lokasi
            </p>

            {/* Pool list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredPools.length > 0 ? filteredPools.map(pool => (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={`pool-card ${selectedPool?.id === pool.id ? 'active' : ''}`}
                >
                  {/* Color top-bar by category */}
                  <div style={{
                    height: '4px', borderRadius: '4px 4px 0 0',
                    margin: '-16px -16px 10px -16px',
                    background: pool.kategori === 'Atlet'
                      ? 'linear-gradient(90deg,#7c3aed,#6d28d9)'
                      : pool.jenisKolam === 'Indoor'
                        ? 'linear-gradient(90deg,#0e7490,#0891b2)'
                        : 'linear-gradient(90deg,#0891b2,#06b6d4)',
                  }} />

                  {/* Name + Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.3, flex: 1, paddingRight: '8px' }}>
                      {pool.name}
                    </h3>
                    <span className="badge badge-rating" style={{ flexShrink: 0, gap: '3px', display: 'flex', alignItems: 'center' }}>
                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                      {pool.rating}
                    </span>
                  </div>

                  {/* Location */}
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                    <MapPin size={11} color="var(--text-muted)" />
                    {pool.district}
                  </p>

                  {/* Badge row */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span className="badge" style={{
                      fontSize: '0.62rem', padding: '2px 8px',
                      background: pool.kategori === 'Atlet' ? '#f5f3ff' : 'var(--bg-accent-light)',
                      color: pool.kategori === 'Atlet' ? '#6d28d9' : 'var(--accent-primary)',
                      border: `1px solid ${pool.kategori === 'Atlet' ? '#ddd6fe' : 'rgba(8,145,178,0.2)'}`,
                    }}>
                      {pool.kategori}
                    </span>
                    <span className="badge" style={{
                      fontSize: '0.62rem', padding: '2px 8px',
                      background: pool.jenisKolam === 'Indoor' ? '#fef3c7' : '#ecfdf5',
                      color: pool.jenisKolam === 'Indoor' ? '#92400e' : '#065f46',
                      border: `1px solid ${pool.jenisKolam === 'Indoor' ? '#fde68a' : '#a7f3d0'}`,
                    }}>
                      {pool.jenisKolam}
                    </span>
                    <span className="badge" style={{
                      fontSize: '0.62rem', padding: '2px 8px',
                      background: pool.status === 'Tutup' ? '#f1f5f9' : pool.status === 'Renovasi' ? '#fffbeb' : '#ecfdf5',
                      color: pool.status === 'Tutup' ? '#475569' : pool.status === 'Renovasi' ? '#b45309' : '#065f46',
                      border: `1px solid ${pool.status === 'Tutup' ? '#cbd5e1' : pool.status === 'Renovasi' ? '#fde68a' : '#a7f3d0'}`,
                    }}>
                      {pool.status || 'Buka'}
                    </span>
                  </div>

                  {/* Price footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tiket masuk</span>
                    <strong style={{
                      fontSize: '0.8rem', color: pool.ticketPriceMin > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                    }}>
                      {pool.ticketPriceMin > 0 ? `Rp ${pool.ticketPriceMin.toLocaleString('id-ID')}+` : '—'}
                    </strong>
                  </div>
                </div>
              )) : (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  color: 'var(--text-muted)', border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                }}>
                  Tidak ada kolam renang yang sesuai filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ DETAIL INSPECTOR ════ */}
        {activeTab === 'detail' && selectedPool && (
          <div className="detail-view-container">
            <button
              className="btn btn-secondary"
              onClick={handleBackToDirectory}
              style={{ display: 'flex', alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.78rem', borderRadius: '20px' }}
            >
              <ArrowLeft size={13} /> Kembali
            </button>

            {/* Photo / Image Banner with Wave Fallback */}
            {selectedPool.imageUrl && !imageErrorUrls[selectedPool.imageUrl] ? (
              <div style={{
                width: '100%',
                height: '140px',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img
                  src={selectedPool.imageUrl}
                  alt={selectedPool.name}
                  onError={() => {
                    if (selectedPool.imageUrl) {
                      setImageErrorUrls(prev => ({ ...prev, [selectedPool.imageUrl!]: true }));
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '40px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)'
                }} />
              </div>
            ) : (
              <div className="pool-visual-placeholder" style={{ height: '100px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C6 7 7 5 9 5c2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
                  <path d="M2 18c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 5 2 2.5 0 3.7-1.5 5-2"/>
                </svg>
              </div>
            )}

            {/* Color Banner */}
            <div style={{
              height: '6px', borderRadius: 'var(--radius-sm)',
              background: selectedPool.status === 'Tutup'
                ? '#64748b'
                : selectedPool.status === 'Renovasi'
                  ? '#f59e0b'
                  : selectedPool.kategori === 'Atlet'
                    ? 'linear-gradient(90deg,#7c3aed,#06b6d4)'
                    : 'linear-gradient(90deg,#0891b2,#06b6d4)',
            }} />

            {/* Name & Badges */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.3 }}>
                  {selectedPool.name}
                </h2>
                <span className="badge badge-rating" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  {selectedPool.rating}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span className="badge" style={{
                  fontSize: '0.65rem',
                  background: selectedPool.kategori === 'Atlet' ? '#f5f3ff' : 'var(--bg-accent-light)',
                  color: selectedPool.kategori === 'Atlet' ? '#6d28d9' : 'var(--accent-primary)',
                  border: `1px solid ${selectedPool.kategori === 'Atlet' ? '#ddd6fe' : 'rgba(8,145,178,0.2)'}`,
                }}>
                  {selectedPool.kategori === 'Atlet' && <Dumbbell size={9} style={{ display: 'inline', marginRight: '3px' }} />}
                  {selectedPool.kategori}
                </span>
                <span className="badge" style={{
                  fontSize: '0.65rem',
                  background: selectedPool.jenisKolam === 'Indoor' ? '#fef3c7' : '#ecfdf5',
                  color: selectedPool.jenisKolam === 'Indoor' ? '#92400e' : '#065f46',
                  border: `1px solid ${selectedPool.jenisKolam === 'Indoor' ? '#fde68a' : '#a7f3d0'}`,
                }}>
                  {selectedPool.jenisKolam === 'Indoor' && <Home size={9} style={{ display: 'inline', marginRight: '3px' }} />}
                  {selectedPool.jenisKolam}
                </span>
                <span className="badge" style={{
                  fontSize: '0.65rem',
                  background: selectedPool.status === 'Tutup' ? '#f1f5f9' : selectedPool.status === 'Renovasi' ? '#fffbeb' : '#ecfdf5',
                  color: selectedPool.status === 'Tutup' ? '#475569' : selectedPool.status === 'Renovasi' ? '#b45309' : '#065f46',
                  border: `1px solid ${selectedPool.status === 'Tutup' ? '#cbd5e1' : selectedPool.status === 'Renovasi' ? '#fde68a' : '#a7f3d0'}`,
                }}>
                  {selectedPool.status || 'Buka'}
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <MapPin size={13} color="var(--text-muted)" />
                {selectedPool.address}
              </p>
            </div>

            {/* Rute & Jarak Card */}
            <div style={{ 
              padding: '14px', 
              background: userLocation ? 'var(--bg-accent-light)' : 'var(--bg-secondary)', 
              border: userLocation ? '1px solid rgba(8, 145, 178, 0.3)' : '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {userLocation && routeDetails ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      📍 Rute ke Lokasi Aktif
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pilih rute untuk peta
                    </span>
                  </div>

                  {/* Dual Route Options (Google Maps style) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
                    {/* Driving / Kendaraan */}
                    <div 
                      onClick={() => setRouteMode('driving')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: routeMode === 'driving' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: routeMode === 'driving' ? 'rgba(8,145,178,0.08)' : 'var(--bg-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Car size={16} color={routeMode === 'driving' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Berkendara</span>
                      </div>
                      <div style={{ fontSize: '0.78rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{routeDetails.drivingDistance} km</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({routeDetails.drivingDuration >= 60 
                            ? `${Math.floor(routeDetails.drivingDuration / 60)} jam ${routeDetails.drivingDuration % 60} mnt` 
                            : `${routeDetails.drivingDuration} mnt`})
                        </span>
                      </div>
                    </div>

                    {/* Walking / Jalan Kaki */}
                    <div 
                      onClick={() => setRouteMode('walking')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: routeMode === 'walking' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: routeMode === 'walking' ? 'rgba(8,145,178,0.08)' : 'var(--bg-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Footprints size={16} color={routeMode === 'walking' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Jalan Kaki</span>
                      </div>
                      <div style={{ fontSize: '0.78rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{routeDetails.walkingDistance} km</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({routeDetails.walkingDuration >= 60 
                            ? `${Math.floor(routeDetails.walkingDuration / 60)} jam ${routeDetails.walkingDuration % 60} mnt` 
                            : `${routeDetails.walkingDuration} mnt`})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                    * Rute dan estimasi waktu berkendara/berjalan kaki diambil langsung dari peta jalan OSRM.
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                      onClick={() => calculateRouteToPool(selectedPool)}
                    >
                      Perbarui GPS
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                      onClick={clearNearestAnalysis}
                    >
                      Hapus Rute
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    🚗 Rute & Jarak Spasial
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Hitung rute jalan raya dan jarak ke kolam renang ini via Kendaraan atau Jalan Kaki.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ flex: 1, fontSize: '0.75rem', padding: '8px', gap: '4px', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                      onClick={() => calculateRouteToPool(selectedPool)}
                    >
                      <Navigation size={12} /> Gunakan GPS
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, fontSize: '0.75rem', padding: '8px', gap: '4px', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        setIsSelectingUserLocation(!isSelectingUserLocation);
                        setIsSelectingLocation(false);
                      }}
                    >
                      <MapPin size={12} />
                      {isSelectingUserLocation ? 'Klik Peta...' : 'Pilih di Peta'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{
              fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55,
              backgroundColor: 'var(--bg-tertiary)', padding: '12px',
              borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-secondary)',
            }}>
              {selectedPool.description}
            </p>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: <Clock size={14} />, label: 'Jam Buka', value: selectedPool.openingHours },
                { icon: <Coins size={14} />, label: 'Tiket Masuk', value: selectedPool.ticketPrice, highlight: true },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {item.icon}
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</span>
                  </div>
                  <strong style={{ fontSize: '0.78rem', color: item.highlight ? 'var(--accent-primary)' : 'var(--text-primary)', lineHeight: 1.3, display: 'block' }}>
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>

            {/* Coordinates */}
            <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.65rem', textTransform: 'uppercase' }}>Koordinat GPS</strong>
              <code style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                {selectedPool.latitude.toFixed(7)}, {selectedPool.longitude.toFixed(7)}
              </code>
            </div>

            {/* Facilities */}
            <div>
              <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em', fontWeight: 700 }}>
                Fasilitas Tersedia
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPool.facilities.map((fac, idx) => (
                  <span key={idx} className="facility-tag">
                    <Check size={11} color="var(--accent-primary)" style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }} />
                    {fac}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, gap: '6px', fontSize: '0.8rem', padding: '8px' }}
                onClick={handleStartEditPool}
              >
                <Edit size={14} /> Edit Data
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, gap: '6px', fontSize: '0.8rem', padding: '8px' }}
                onClick={handleDeletePool}
              >
                <Trash2 size={14} /> Hapus Kolam
              </button>
            </div>
          </div>
        )}

        {/* ════ CARI TERDEKAT ════ */}
        {activeTab === 'nearest' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{
              background: 'var(--bg-accent-light)', border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 'var(--radius-md)', padding: '14px',
            }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Navigation size={15} /> Mode Cari Terdekat
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Pastikan Tab ini aktif, lalu klik titik mana saja di peta Kota Padang. Sistem akan otomatis menghitung dan menampilkan kolam renang terdekat dari 46 lokasi terdaftar.
              </p>
            </div>

            {userLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                    Titik Kueri Anda
                  </div>
                  <code style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                  </code>
                </div>

                {nearestPool && (
                  <div style={{
                    border: '1px solid #a7f3d0', background: '#f0fdf4',
                    borderRadius: 'var(--radius-md)', padding: '14px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    borderLeft: '4px solid var(--success)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Kolam Terdekat</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--success)' }}>± {nearestDistance} km</strong>
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3 }}>
                      {nearestPool.name}
                    </h4>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      {nearestPool.kategori} · {nearestPool.jenisKolam} · {nearestPool.district}
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedPool(nearestPool)}
                      style={{ fontSize: '0.76rem', padding: '7px 12px' }}
                    >
                      Lihat Detail Kolam
                    </button>
                  </div>
                )}

                <button className="btn btn-danger" onClick={clearNearestAnalysis}>
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '48px 16px',
                color: 'var(--text-muted)', border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: '10px',
              }}>
                <MapPin size={28} style={{ opacity: 0.35 }} />
                <span style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Belum ada titik yang dipilih.<br />Klik sembarang titik di peta.
                </span>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="sidebar-footer">
        <span>AquaMap Padang © 2026</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          {pools.length} Lokasi Aktif
        </span>
      </div>
    </div>
  );
};
