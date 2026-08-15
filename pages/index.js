import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('qrcode.react'), { ssr: false });

export const revalidate = 0;

let supabase = null;
let supabaseLoaded = false;

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
  const [loading, setLoading] = useState(false);

  // Refs para capturar valores directamente del DOM
  const technicianRef = useRef(null);
  const clientNameRef = useRef(null);
  const clientPhoneRef = useRef(null);
  const clientEmailRef = useRef(null);
  const deviceBrandRef = useRef(null);
  const deviceModelRef = useRef(null);
  const deviceImeiRef = useRef(null);
  const deviceConditionRef = useRef(null);
  const symptomsRef = useRef(null);
  const diagnosisRef = useRef(null);
  const pinRef = useRef(null);
  const supabaseRef = useRef(null);

  // Define loadOrders with useCallback
  const loadOrders = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase not initialized');
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(id,name,phone,email),
          device:devices(id,brand,model,imei,condition)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Supabase and load orders on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabaseLoaded) {
      supabaseLoaded = true;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          import('@supabase/ssr').then(({ createBrowserClient }) => {
            supabase = createBrowserClient(supabaseUrl, supabaseKey);
            loadOrders();
          }).catch(error => {
            console.error('Supabase import error:', error);
            setOrders([]);
          });
        } catch (error) {
          console.error('Supabase init error:', error);
          setOrders([]);
        }
      }
    }
  }, [loadOrders]);

  const handleLogin = () => {
    if (technician.trim()) {
      setScreen('dashboard');
    }
  };

  const startNewOrder = () => {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}`;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setCurrentOrder({
      id: orderNumber,
      technician: technician,
      timestamp: timestamp,
      client: { name: '', phone: '', email: '' },
      device: { brand: '', model: '', imei: '', condition: '' },
      photos: [],
      symptoms: '',
      pin: '',
      diagnosis: '',
      signature: null,
      status: 'pending',
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

  const captureSignature = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setLoading(true);
      try {
        if (!supabase) throw new Error('Supabase no está inicializado');

        const signature = canvas.toDataURL('image/png');

        // Use currentOrder directly - should be updated by form handlers
        const name = currentOrder.client?.name || '';
        const phone = currentOrder.client?.phone || '';
        const email = currentOrder.client?.email || '';
        const brand = currentOrder.device?.brand || '';
        const model = currentOrder.device?.model || '';
        const imei = currentOrder.device?.imei || '';
        const condition = currentOrder.device?.condition || '';

        if (!name || !phone) throw new Error('Cliente: nombre y teléfono son requeridos');
        if (!brand || !model) throw new Error('Dispositivo: marca y modelo son requeridos');

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert([{ name, phone, email: email || null }])
          .select();

        if (clientError) throw clientError;
        if (!clientData?.length) throw new Error('Error insertando cliente');
        const clientId = clientData[0].id;

        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .insert([{ brand, model, imei: imei || null, condition: condition || 'Desconocido' }])
          .select();

        if (deviceError) throw deviceError;
        if (!deviceData?.length) throw new Error('Error insertando dispositivo');
        const deviceId = deviceData[0].id;

        const orderData = {
          id: currentOrder.id,
          technician: currentOrder.technician,
          timestamp: currentOrder.timestamp,
          client_id: clientId,
          device_id: deviceId,
          photos: currentOrder.photos?.length ? currentOrder.photos : null,
          symptoms: currentOrder.symptoms || null,
          pin_encrypted: currentOrder.pin || null,
          signature: signature,
          status: 'completed'
        };

        const { error: orderError } = await supabase
          .from('orders')
          .insert([orderData]);

        if (orderError) throw orderError;
        console.log('Orden guardada:', currentOrder.id);

        if (email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, orderData })
            });
          } catch (emailError) {
            console.warn('Email send failed:', emailError);
          }
        }

        setScreen('dashboard');
        setCurrentOrder(null);
        setStep(0);
        await loadOrders();
      } catch (error) {
        console.error('Error saving order:', error);
        alert('Error guardando orden: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    if (!supabase) {
      console.warn('Supabase not initialized');
      setSearchResults([]);
      return;
    }

    try {
      const lowerQuery = query.toLowerCase();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(id,name,phone,email),
          device:devices(id,brand,model,imei,condition)
        `)
        .or(
          `id.ilike.%${query}%`
        );

      if (error) throw error;
      // Filter results on client side for client and device fields
      const filtered = (data || []).filter(order =>
        order.id.toLowerCase().includes(lowerQuery) ||
        (order.client?.phone && order.client.phone.includes(query)) ||
        (order.client?.name && order.client.name.toLowerCase().includes(lowerQuery)) ||
        (order.device?.imei && order.device.imei.includes(query))
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    }
  };

  const downloadPDF = (order) => {
    const content = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${order.id}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 850px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #0C1F3A 0%, #1a3a52 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 5px; font-weight: 600; }
          .header .subtitle { font-size: 13px; opacity: 0.9; }
          .order-number { background: rgba(0, 188, 212, 0.1); color: #00BCD4; padding: 8px 16px; display: inline-block; border-radius: 4px; font-weight: 600; margin-top: 15px; font-size: 14px; }

          .content { padding: 40px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { color: #0C1F3A; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #00BCD4; padding-bottom: 12px; margin-bottom: 15px; }

          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .info-item { }
          .info-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; }
          .info-value { font-size: 14px; color: #0C1F3A; font-weight: 500; word-break: break-word; }

          .full-width { grid-column: 1 / -1; }

          .symptoms-text { background: #f9f9f9; padding: 15px; border-left: 4px solid #00BCD4; font-size: 13px; line-height: 1.6; color: #333; white-space: pre-wrap; }

          .photos-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 15px; }
          .photo { width: 100%; height: 120px; object-fit: cover; border: 1px solid #e0e0e0; border-radius: 4px; }

          .conditions { background: #f0f8f9; padding: 20px; border-radius: 4px; border-left: 4px solid #00BCD4; }
          .conditions p { font-size: 12px; line-height: 1.7; color: #333; margin-bottom: 8px; }

          .signature-section { border-top: 2px solid #e0e0e0; padding-top: 30px; margin-top: 40px; }
          .signature-label { font-size: 12px; color: #999; text-align: center; margin-bottom: 20px; font-weight: 600; }
          .signature-img { max-width: 300px; height: auto; display: block; margin: 0 auto; border: 1px solid #ddd; padding: 8px; background: white; }

          .footer { background: #0C1F3A; color: white; padding: 25px 40px; font-size: 11px; line-height: 1.8; }
          .footer-item { margin-bottom: 8px; }
          .footer-brand { font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #00BCD4; }

          @media print {
            body { background: white; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RESGUARDO DE REPARACIÓN</h1>
            <p class="subtitle">AppExpert Gadgets Solutions</p>
            <div class="order-number">${order.id}</div>
          </div>

          <div class="content">
            <div class="section">
              <h2>Datos del cliente</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Nombre</div>
                  <div class="info-value">${order.client.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Teléfono</div>
                  <div class="info-value">${order.client.phone}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Información del dispositivo</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Marca</div>
                  <div class="info-value">${order.device.brand}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Modelo</div>
                  <div class="info-value">${order.device.model}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">IMEI</div>
                  <div class="info-value">${order.device.imei}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Estado</div>
                  <div class="info-value">${order.device.condition}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Síntomas reportados</h2>
              <div class="symptoms-text">${order.symptoms}</div>
            </div>

            ${order.photos.length > 0 ? `
            <div class="section">
              <h2>Fotografías del dispositivo</h2>
              <div class="photos-container">
                ${order.photos.map((photo) => `<img src="${photo}" class="photo" alt="Foto">`).join('')}
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2>Condiciones</h2>
              <div class="conditions">
                <p>✓ El cliente autoriza el diagnóstico y reparación del dispositivo.</p>
                <p>✓ Garantía de reparación: 30 días desde la entrega.</p>
                <p>✓ Equipos no reclamados en 30 días se considerarán abandonados.</p>
              </div>
            </div>

            ${order.signature ? `
            <div class="signature-section">
              <div class="signature-label">Firma del cliente</div>
              <img src="${order.signature}" class="signature-img" alt="Firma">
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="footer-brand">AppExpert Gadgets Solutions</div>
            <div class="footer-item">📍 C/ Jaime 24, Lucena (Córdoba)</div>
            <div class="footer-item">📱 664 03 00 87</div>
            <div class="footer-item" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; font-size: 10px;">
              Técnico: ${order.technician} | ${order.timestamp}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=900,height=1200');
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-cyan-600 px-8 py-12 text-center">
              <div className="inline-block bg-white rounded-full p-4 mb-4">
                <div className="text-3xl">🔧</div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">AppExpert</h1>
              <p className="text-cyan-100">Gestión de Reparaciones</p>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">👤 Nombre del Técnico</label>
                <input
                  ref={technicianRef}
                  type="text"
                  defaultValue={technician}
                  onKeyPress={(e) => e.key === 'Enter' && (setTechnician(technicianRef.current?.value || ''), handleLogin())}
                  placeholder="Ej: Juan García"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  const techValue = technicianRef.current?.value || '';
                  if (techValue.trim().length < 2) {
                    alert('Ingresa tu nombre (al menos 2 caracteres)');
                    return;
                  }
                  setTechnician(techValue);
                  setScreen('dashboard');
                }}
                className="w-full bg-gradient-to-r from-slate-900 to-cyan-600 hover:from-slate-800 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
              >
                🚀 Entrar al Sistema
              </button>
              <p className="text-center text-xs text-slate-500 mt-4">
                AppExpert Gadgets Solutions • Lucena, Córdoba
              </p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
              <div className="bg-white rounded-lg p-6 border border-slate-200 flex flex-col items-center justify-center">
                <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 pb-3 border-b border-cyan-500 w-full text-center">Código QR</h2>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <QRCode value={selectedOrder.id} size={120} level="H" includeMargin={true} />
                </div>
                <p className="text-xs text-slate-600 mt-4 text-center font-mono">{selectedOrder.id}</p>
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
                onClick={() => downloadPDF(selectedOrder)}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg transition"
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

  if (screen === 'order' && currentOrder) {
    if (step === 0) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 1 de 7: Datos del cliente</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Información del cliente</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre completo</label>
                  <input
                    ref={clientNameRef}
                    type="text"
                    defaultValue={currentOrder.client.name}
                    placeholder="ej: Juan García López"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                  <input
                    ref={clientPhoneRef}
                    type="tel"
                    defaultValue={currentOrder.client.phone}
                    placeholder="ej: 600 123 456"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email (opcional)</label>
                  <input
                    ref={clientEmailRef}
                    type="email"
                    defaultValue={currentOrder.client.email}
                    placeholder="ej: juan@email.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setScreen('dashboard')} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={() => {
                const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]');
                const name = inputs[0]?.value || '';
                const phone = inputs[1]?.value || '';
                const email = inputs[2]?.value || '';
                if (name && phone) {
                  setCurrentOrder({ ...currentOrder, client: { name, phone, email } });
                  setStep(1);
                } else {
                  alert('Completa nombre y teléfono');
                }
              }} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 2 de 7: Datos del dispositivo</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Información del dispositivo</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                  <select ref={deviceBrandRef} defaultValue={currentOrder.device.brand} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Selecciona marca</option>
                    <option>Apple iPhone</option>
                    <option>Samsung</option>
                    <option>Xiaomi</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Modelo</label>
                  <input ref={deviceModelRef} type="text" defaultValue={currentOrder.device.model} placeholder="ej: iPhone 15 Pro" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">IMEI / Nº serie</label>
                  <input ref={deviceImeiRef} type="text" defaultValue={currentOrder.device.imei} placeholder="ej: 356938815342816" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estado físico</label>
                  <select ref={deviceConditionRef} defaultValue={currentOrder.device.condition} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Selecciona estado</option>
                    <option>Impecable</option>
                    <option>Rayones superficiales</option>
                    <option>Grietas en pantalla</option>
                    <option>Daño estructural</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={() => {
                const selects = document.querySelectorAll('select');
                const inputs = document.querySelectorAll('input[type="text"]');
                const brand = selects[0]?.value || '';
                const model = inputs[0]?.value || '';
                const imei = inputs[1]?.value || '';
                const condition = selects[1]?.value || '';
                if (brand && model) {
                  setCurrentOrder({ ...currentOrder, device: { brand, model, imei, condition } });
                  setStep(2);
                } else {
                  alert('Completa marca y modelo');
                }
              }} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 3 de 7: Captura fotos</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Fotografías del dispositivo</h2>
              <p className="text-sm text-slate-600 mb-6">Captura: frente, trasera, laterales</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Subir foto</label>
                <input type="file" accept="image/*" onChange={handlePhotoCapture} multiple capture="environment" className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm" />
              </div>
              {currentOrder.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {currentOrder.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                      <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-4">{currentOrder.photos.length} foto(s) capturada(s)</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 4 de 7: Síntomas reportados</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">¿Qué problema tiene el dispositivo?</h2>
              <textarea value={currentOrder.symptoms} onChange={(e) => setCurrentOrder({ ...currentOrder, symptoms: e.target.value })} placeholder="Describe los síntomas..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans resize-none" rows={6} autoFocus />
              <p className="text-xs text-slate-500 mt-2">Describe los síntomas con detalle</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={() => { if (currentOrder.symptoms.trim()) setStep(4); else alert('Describe los síntomas'); }} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 5 de 7: Datos sensibles</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-900"><strong>⚠️ Datos sensibles:</strong> Se cifrarán automáticamente.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PIN de pantalla (opcional)</label>
                  <input type="password" value={currentOrder.pin} onChange={(e) => setCurrentOrder({ ...currentOrder, pin: e.target.value })} placeholder="Déjalo vacío si no conoces el PIN" maxLength={6} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono" autoFocus />
                  <p className="text-xs text-slate-500 mt-1">Este campo se cifrará en la base de datos</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={() => setStep(5)} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 6 de 7: Revisar</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Resumen de la orden</h2>
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Cliente</p>
                  <p className="font-medium text-slate-900">{currentOrder.client.name}</p>
                  <p className="text-sm text-slate-600">{currentOrder.client.phone}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Dispositivo</p>
                  <p className="font-medium text-slate-900">{currentOrder.device.brand} {currentOrder.device.model}</p>
                  <p className="text-sm text-slate-600">Estado: {currentOrder.device.condition}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Síntomas</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{currentOrder.symptoms}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={() => setStep(6)} className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">Siguiente: Firmar</button>
            </div>
          </main>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-slate-900">{currentOrder.id}</h1>
              <p className="text-sm text-slate-500">Paso 7 de 7: Firma del cliente</p>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Firma digital</h2>
              <p className="text-sm text-slate-600 mb-6">Firma en la zona gris con el dedo (o ratón)</p>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden mb-4 bg-gray-100">
                <canvas ref={canvasRef} width={500} height={250} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full touch-none cursor-crosshair block" style={{ display: 'block' }} />
              </div>
              <button onClick={clearSignature} className="w-full px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition mb-4">Borrar firma</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Atrás</button>
              <button onClick={captureSignature} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">Completar</button>
            </div>
          </main>
        </div>
      );
    }
  }

  return null;
}
