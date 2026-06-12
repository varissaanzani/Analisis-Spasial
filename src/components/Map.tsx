import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSpatial, type SwimmingPool } from '../context/SpatialContext';

// Clean Leaflet marker override setup
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom swimming pool SVG pin icon generator
// Atlet = purple, Indoor Rekreasi = teal, Outdoor Rekreasi = cyan
const getPoolPinIcon = (pool: SwimmingPool, isSelected: boolean) => {
  let color = '#0891b2'; // default cyan (Rekreasi Outdoor)
  if (pool.kategori === 'Atlet') color = '#7c3aed'; // purple for athlete pools
  else if (pool.jenisKolam === 'Indoor') color = '#0e7490'; // deep teal for indoor

  if (pool.status === 'Renovasi') color = '#f59e0b'; // orange for renovation
  else if (pool.status === 'Tutup') color = '#64748b'; // slate/gray for closed

  if (isSelected) {
    color = '#db2777'; // Highlight selected pool with pink
  }

  const pulseStyle = isSelected ? `
    <div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 48px; border-radius: 50%; background-color: rgba(219, 39, 119, 0.15); animation: pulse 1.8s infinite; z-index: -1;"></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.3); opacity: 0; }
      }
    </style>
  ` : '';

  return L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 36px;">
        ${pulseStyle}
        <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.16));">
          <!-- Main Pin body -->
          <path d="M16 0C7.16 0 0 7.16 0 16C0 25.68 16 36 16 36C16 36 32 25.68 32 16C32 7.16 24.84 0 16 0Z" fill="${color}"/>
          <!-- White circle insert -->
          <circle cx="16" cy="15" r="7" fill="white"/>
          <!-- Wave graphic in pool color -->
          <path d="M12 14c0.8 0.6 1.4 0 2.2 0.3c0.8 0.3 1.2-0.3 2-0.1c0.8 0.2 1.4 0.6 2 0.1" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 17c0.8 0.6 1.4 0 2.2 0.3c0.8 0.3 1.2-0.3 2-0.1c0.8 0.2 1.4 0.6 2 0.1" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    className: 'custom-pool-pin',
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -32],
  });
};

// SVG Icon for user clicked query center
const queryCrosshairIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.15); border: 2.5px dashed #ef4444; animation: rotateDashed 12s infinite linear;"></div>
      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
    </div>
    <style>
      @keyframes rotateDashed {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `,
  className: 'custom-query-crosshair',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map Viewport center controller
const MapController: React.FC = () => {
  const { mapCenter, mapZoom } = useSpatial();
  const map = useMap();

  useEffect(() => {
    map.setView(mapCenter, mapZoom, { animate: true, duration: 1.0 });
  }, [mapCenter, mapZoom, map]);

  return null;
};

// Map click event observer for finding nearest pool or picking coordinates
const MapEventsHandler: React.FC = () => {
  const { 
    activeTab, 
    findNearestPool, 
    isSelectingLocation, 
    setIsSelectingLocation, 
    setFormCoords,
    isSelectingUserLocation,
    setIsSelectingUserLocation,
    selectedPool,
    setUserLocation,
    calculateRouteToPool
  } = useSpatial();

  useMapEvents({
    click(e) {
      if (isSelectingLocation) {
        setFormCoords([e.latlng.lat, e.latlng.lng]);
        setIsSelectingLocation(false);
      } else if (isSelectingUserLocation) {
        if (selectedPool) {
          calculateRouteToPool(selectedPool, [e.latlng.lat, e.latlng.lng]);
        } else {
          setUserLocation([e.latlng.lat, e.latlng.lng]);
        }
        setIsSelectingUserLocation(false);
      } else if (activeTab === 'nearest') {
        findNearestPool(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
};

export const Map: React.FC = () => {
  const {
    filteredPools,
    selectedPool,
    setSelectedPool,
    userLocation,
    nearestRouteGeoJson,
    activeTab,
    isSelectingLocation,
    formCoords,
    isSelectingUserLocation
  } = useSpatial();

  // Custom pool popup layout
  const handleMarkerClick = (pool: SwimmingPool) => {
    setSelectedPool(pool);
  };

  return (
    <div className="map-viewport">
      <MapContainer
        center={[-0.9471, 100.4172]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* We use CartoDB Positron Light tiles as default for a clean, non-AI corporate/consumer aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController />
        <MapEventsHandler />

        {/* Swimming Pools Markers */}
        {filteredPools.map((pool) => {
          const isSelected = selectedPool?.id === pool.id;
          return (
            <Marker
              key={pool.id}
              position={[pool.latitude, pool.longitude]}
              icon={getPoolPinIcon(pool, isSelected)}
              eventHandlers={{
                click: () => handleMarkerClick(pool),
              }}
            >
              <Popup closeButton={false}>
                <div style={{ padding: '0px', width: '220px' }}>
                  {/* Decorative card top bar colored by status/kategori */}
                  <div style={{
                    height: '5px',
                    background: pool.status === 'Tutup'
                      ? '#64748b'
                      : pool.status === 'Renovasi'
                        ? '#f59e0b'
                        : pool.kategori === 'Atlet'
                          ? 'linear-gradient(90deg,#7c3aed,#6d28d9)'
                          : pool.jenisKolam === 'Indoor'
                            ? 'linear-gradient(90deg,#0e7490,#0891b2)'
                            : 'linear-gradient(90deg,#0891b2,#06b6d4)'
                  }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.58rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: 700,
                        background: pool.kategori === 'Atlet' ? '#f5f3ff' : 'var(--bg-accent-light)',
                        color: pool.kategori === 'Atlet' ? '#6d28d9' : 'var(--accent-primary)',
                        border: `1px solid ${pool.kategori === 'Atlet' ? '#ddd6fe' : 'rgba(8,145,178,0.2)'}`,
                      }}>
                        {pool.kategori}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: 700,
                        background: pool.jenisKolam === 'Indoor' ? '#fef3c7' : '#ecfdf5',
                        color: pool.jenisKolam === 'Indoor' ? '#92400e' : '#065f46',
                        border: `1px solid ${pool.jenisKolam === 'Indoor' ? '#fde68a' : '#a7f3d0'}`,
                      }}>
                        {pool.jenisKolam}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: 700,
                        background: pool.status === 'Tutup' ? '#f1f5f9' : pool.status === 'Renovasi' ? '#fffbeb' : '#ecfdf5',
                        color: pool.status === 'Tutup' ? '#475569' : pool.status === 'Renovasi' ? '#b45309' : '#065f46',
                        border: `1px solid ${pool.status === 'Tutup' ? '#cbd5e1' : pool.status === 'Renovasi' ? '#fde68a' : '#a7f3d0'}`,
                      }}>
                        {pool.status || 'Buka'}
                      </span>
                    </div>
                    <h4 style={{ margin: '2px 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {pool.name}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      📍 {pool.district}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {pool.ticketPriceMin > 0 ? `Rp ${pool.ticketPriceMin.toLocaleString('id-ID')}+` : '—'}
                      </span>
                      <span className="badge badge-rating" style={{ margin: 0, padding: '2px 6px' }}>
                        ⭐ {pool.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User Search Query Location */}
        {userLocation && (
          <Marker position={userLocation} icon={queryCrosshairIcon} />
        )}

        {/* Interactive Coordinates Picker Target Marker */}
        {formCoords && (
          <Marker
            position={formCoords}
            icon={L.divIcon({
              html: `
                <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.15); border: 2.5px dashed #10b981; animation: rotateDashed 6s infinite linear;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
                </div>
              `,
              className: 'custom-form-coords',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          />
        )}

        {/* Nearest Pool routing line */}
        {nearestRouteGeoJson && (
          <GeoJSON
            key={JSON.stringify(nearestRouteGeoJson)}
            data={nearestRouteGeoJson}
            style={() => ({
              color: '#0891b2',
              weight: 3.5,
              opacity: 0.85,
              dashArray: '8, 8',
              lineCap: 'round',
            })}
          />
        )}
      </MapContainer>

      {/* Floating search status info box */}
      {activeTab === 'nearest' && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: 'white',
            backdropFilter: 'blur(8px)',
            padding: '10px 18px',
            borderRadius: '20px',
            fontSize: '0.775rem',
            fontWeight: 600,
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'ping 1s infinite' }}></div>
          Mode Cari Terdekat Aktif
        </div>
      )}

      {/* Floating coordinates picker info box */}
      {isSelectingLocation && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            backdropFilter: 'blur(8px)',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '0.825rem',
            fontWeight: 600,
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ffffff', animation: 'ping 1s infinite' }}></div>
          Klik pada peta untuk menentukan koordinat kolam!
        </div>
      )}

      {/* Floating coordinates picker info box for user location */}
      {isSelectingUserLocation && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(8, 145, 178, 0.95)',
            color: 'white',
            backdropFilter: 'blur(8px)',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '0.825rem',
            fontWeight: 600,
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ffffff', animation: 'ping 1s infinite' }}></div>
          Klik pada peta untuk menetapkan lokasi Anda saat ini!
        </div>
      )}
    </div>
  );
};
