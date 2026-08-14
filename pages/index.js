import React, { useState, useRef, useEffect } from 'react';

export default function AppExpertRepairs() {
  const [screen, setScreen] = useState('login');
  const [technician, setTechnician] = useState('');
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [step, setStep] = useState(0);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('appexpert_orders');
    if (saved) setOrders(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('appexpert_orders', JSON.stringify(orders));
    }
  }, [orders]);

  const handleLogin = () => {
    if (technician.trim()) {
      setScreen('dashboard');
    }
  };

  const startNewOrder = () => {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}`;
    setCurrentOrder({
      id: orderNumber,
      technician: technician,
      timestamp: new Date().toLocaleString('es-ES'),
      client: { name: '', phone: '', email: '' },
      device: { brand: '', model: '', imei: '', condition: '' },
      photos: [],
      symptoms: '',
      pin: '',
      diagnosis: '',
      signature: null,
      status: 'completed',
    });
    setStep(0);
    setScreen('order');
  };

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentOrder((prev) => ({
          ...prev,
          photos: [...prev.photos, event.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setCurrentOrder((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0C1F3A';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      const completed = { ...currentOrder, signature, status: 'completed' };
      setOrders([...orders, completed]);
      setScreen('dashboard');
      setCurrentOrder(null);
      setStep(0);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = orders.filter(
      (order) =>
        order.device.imei.toLowerCase().includes(lowerQuery) ||
        order.client.phone.toLowerCase().includes(lowerQuery) ||
        order.client.name.toLowerCase().includes(lowerQuery) ||
        order.id.toLowerCase().includes(lowerQuery)
    );
    setSearchResults(results);
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">AppExpert</h1>
              <p className="text-sm text-slate-500">Gestión de Reparaciones</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Técnico</label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'dashboard') {
    if (selectedOrder) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{selectedOrder.id}</h1>
                <p className="text-sm text-slate-500">{selectedOrder.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                ← Volver
              </button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 pb-3 border-b border-cyan-500">Cliente</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Nombre</p>
                    <p className="text-slate-900 font-medium">{selectedOrder.client.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Teléfono</p>
                    <p className="text-slate-900 font-medium">{selectedOrder.client.phone}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 pb-3 border-b border-cyan-500">Dispositivo</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Modelo</p>
                    <p className="text-slate-900 font-medium">{selectedOrder.device.brand} {selectedOrder.device.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">IMEI</p>
                    <p className="text-slate-900 font-mono text-sm">{selectedOrder.device.imei}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
              >
                ← Volver
              </button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AppExpert</h1>
              <p className="text-sm text-slate-500">Hola, {technician}</p>
            </div>
            <button
              onClick={() => {
                setTechnician('');
                setScreen('login');
              }}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={startNewOrder}
              className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
            >
              + Nueva orden
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
            >
              🔍 Buscar dispositivo
            </button>
          </div>

          {showSearch && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Buscar orden</h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="IMEI, teléfono, nombre o número de orden..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
                autoFocus
              />

              {searchQuery && searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 font-medium">{searchResults.length} resultado(s)</p>
                  {searchResults.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      <p className="font-semibold text-slate-900">{order.id}</p>
                      <p className="text-sm text-slate-600 mt-1">{order.client.name} • {order.device.brand}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Órdenes ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-500">Sin órdenes aún. Crea la primera.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md cursor-pointer"
                  >
                    <p className="font-semibold text-slate-900">{order.id}</p>
                    <p className="text-sm text-slate-600 mt-1">{order.client.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
