"use client";

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface FreepikItem {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  license: string;
}

interface AIItem {
  id: string;
  base64: string;
  seed: string;
}

interface SelectedItem {
  id: string;
  source: 'freepik' | 'ai';
  data: FreepikItem | AIItem;
}

// Helper to create a download link for binary data
function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Compute cropping area in pixel coordinates from react-easy-crop state
function getCroppedAreaPixels(crop: { x: number; y: number }, zoom: number, aspect: number, mediaSize: { width: number; height: number }): Area {
  // This helper replicates logic from react-easy-crop docs. It converts a
  // percentage based crop into pixel values given the underlying image size.
  const { width: mediaWidth, height: mediaHeight } = mediaSize;
  const cropX = crop.x;
  const cropY = crop.y;
  const croppedAreaPx = {
    x: Math.max(0, (mediaWidth * (0.5 - cropX / 100) - (mediaWidth / zoom) / 2)),
    y: Math.max(0, (mediaHeight * (0.5 - cropY / 100) - (mediaHeight / zoom) / 2)),
    width: mediaWidth / zoom,
    height: mediaHeight / zoom,
  } as Area;
  return croppedAreaPx;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [safeSearch, setSafeSearch] = useState(true);
  const [license, setLicense] = useState<'free' | 'all'>('free');
  const [loading, setLoading] = useState(false);
  const [freepik, setFreepik] = useState<FreepikItem[]>([]);
  const [ai, setAI] = useState<AIItem[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [aspect, setAspect] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  // Cropping state per selected image
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Trigger generation of results
  const handleGenerate = async () => {
  if (!prompt.trim()) return;
  setLoading(true);
  setSelected([]);
  try {
    // Build query string with advanced options
    const params = new URLSearchParams();
    params.set('q', prompt);
    if (!safeSearch) params.set('safe', 'false');
    if (license === 'all') params.set('license', 'all');
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setFreepik(data.freepik || []);
    setAI(data.ai || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
  };

  // Toggle selection of a result
  const toggleSelect = (item: FreepikItem | AIItem, source: 'freepik' | 'ai') => {
    const id = (item as any).id;
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists) {
        // Deselect
        return prev.filter((p) => p.id !== id);
      } else {
        return [...prev, { id, source, data: item }];
      }
    });
    // Reset crop state when selecting a new item
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setActiveId(id);
  };

  // When crop complete, store the area for later use
  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  // Download selected images in the chosen format
  const handleDownload = async (format: 'jpeg' | 'png') => {
    for (const item of selected) {
      const src = item.source === 'freepik'
        ? (item.data as FreepikItem).thumbnail
        : `data:image/png;base64,${(item.data as AIItem).base64}`;
      // Determine target size based on aspect ratio
      let width = 1024;
      let height = 1024;
      if (aspect === '16:9') {
        width = 1820;
        height = 1024;
      } else if (aspect === '9:16') {
        width = 1024;
        height = 1820;
      }
      // Build request body
      const body = {
        image: src,
        width,
        height,
        fit,
        format,
      } as any;
      if (croppedArea && activeId === item.id) {
        body.crop = croppedArea;
      }
      try {
        const resp = await fetch('/api/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const blob = await resp.blob();
        downloadBlob(blob, `${item.id}.${format === 'jpeg' ? 'jpg' : 'png'}`);
      } catch (err) {
        console.error('Download error', err);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Prompt2Visuals</h1>
          <div className="flex space-x-3 text-sm">
            {/* API status indicators: simple colored dots based on whether we fetched data */}
            <div className="flex items-center space-x-1">
              <span className={`inline-block h-2 w-2 rounded-full ${freepik.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="hidden sm:inline">Freepik</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`inline-block h-2 w-2 rounded-full ${ai.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="hidden sm:inline">AI</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
        {/* Prompt Bar */}
        <div className="bg-white shadow p-4 rounded-md mb-6">
          <textarea
            className="w-full border rounded-md p-3 mb-3 resize-none h-24"
            placeholder="Describe the image you want..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={() => setAdvanced(!advanced)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {advanced ? 'Hide advanced' : 'Advanced options'}
            </button>
          </div>
          {advanced && (
            <div className="mt-3 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={safeSearch}
                  onChange={(e) => setSafeSearch(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Safe search</span>
              </label>
              <label className="flex items-center space-x-2">
                <span>Licence:</span>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value as 'free' | 'all')}
                  className="border rounded-md px-2 py-1"
                >
                  <option value="free">Free only</option>
                  <option value="all">All</option>
                </select>
              </label>
            </div>
          )}
        </div>
        {/* Results */}
        {freepik.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Freepik Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {freepik.map((item) => (
                <div
                  key={item.id}
                  className={`relative border rounded-md overflow-hidden cursor-pointer ${selected.some((s) => s.id === item.id) ? 'ring-4 ring-blue-500' : ''}`}
                  onClick={() => toggleSelect(item, 'freepik')}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-xs">
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className="text-gray-500 truncate">{item.author}</div>
                    <div className="text-gray-400">{item.license}</div>
                  </div>
                  {selected.some((s) => s.id === item.id) && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Selected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {ai.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">AI Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ai.map((item) => (
                <div
                  key={item.id}
                  className={`relative border rounded-md overflow-hidden cursor-pointer ${selected.some((s) => s.id === item.id) ? 'ring-4 ring-blue-500' : ''}`}
                  onClick={() => toggleSelect(item, 'ai')}
                >
                  <img
                    src={`data:image/png;base64,${item.base64}`}
                    alt="AI result"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-xs">
                    <div className="font-semibold truncate">AI Image</div>
                    <div className="text-gray-500 truncate">Seed: {item.seed || 'N/A'}</div>
                  </div>
                  {selected.some((s) => s.id === item.id) && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Selected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection Drawer */}
        {selected.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium mb-2">Selected images: {selected.length}</h3>
                {/* Show cropping preview for the active image (first selected or clicked) */}
                {selected.length > 0 && (
                  <div className="relative w-full h-64 bg-gray-200">
                    <Cropper
                      image={(() => {
                        const item = selected.find((it) => it.id === activeId) || selected[0];
                        return item.source === 'freepik'
                          ? (item.data as FreepikItem).thumbnail
                          : `data:image/png;base64,${(item.data as AIItem).base64}`;
                      })()}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect === '1:1' ? 1 : aspect === '16:9' ? 16 / 9 : 9 / 16}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2 md:space-y-4 md:w-60">
                <div className="flex space-x-2">
                  {(['1:1', '9:16', '16:9'] as const).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setAspect(ar)}
                      className={`flex-1 px-2 py-1 border rounded ${aspect === ar ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2 text-sm">
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="fit"
                      value="cover"
                      checked={fit === 'cover'}
                      onChange={() => setFit('cover')}
                    />
                    <span>Cover</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="fit"
                      value="contain"
                      checked={fit === 'contain'}
                      onChange={() => setFit('contain')}
                    />
                    <span>Fit</span>
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload('jpeg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
                  >
                    Download JPG
                  </button>
                  <button
                    onClick={() => handleDownload('png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
                  >
                    Download PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Attribution footer */}
      <footer className="bg-white border-t p-4 text-xs text-gray-500 text-center">
        {freepik.length > 0 && (
          <p>
            Freepik assets are subject to their respective licences. Please provide
            attribution when required. See Freepik licence information on each
            item for details.
          </p>
        )}
      </footer>
    </div>
  );
}
