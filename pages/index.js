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
        if (name.length < 3) throw new Error('Nombre debe tener al menos 3 caracteres');
        if (!/^\d{9,15}$/.test(phone.replace(/[^\d]/g, ''))) throw new Error('Teléfono inválido (debe tener 9-15 dígitos)');
        if (!brand || !model) throw new Error('Dispositivo: marca y modelo son requeridos');
        if (brand.length < 2) throw new Error('Marca del dispositivo muy corta');
        if (model.length < 2) throw new Error('Modelo del dispositivo muy corto');

        let clientId;

        // Primero buscar si el cliente ya existe
        const { data: existingClients, error: searchError } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', phone);

        if (searchError) throw searchError;

        if (existingClients?.length > 0) {
          // Cliente ya existe - usar su ID
          clientId = existingClients[0].id;
        } else {
          // Cliente no existe - crear nuevo
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([{ name, phone, email: email || null }])
            .select();

          if (clientError) throw clientError;
          if (!clientData?.length) throw new Error('Error insertando cliente');
          clientId = clientData[0].id;
        }

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

        // WhatsApp deshabilitado temporalmente - se agregará con servicio de pago después
        // if (phone) {
        //   try {
        //     const cleanedPhone = phone.startsWith('+') ? phone : '+34' + phone.replace(/\D/g, '');
        //     console.log('📱 Enviando WhatsApp a:', cleanedPhone);
        //     // ... WhatsApp code commented out
        //   } catch (whatsappError) {
        //     console.error('❌ Error enviando WhatsApp:', whatsappError);
        //   }
        // }

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

  const handlePrintLabel = async (order) => {
    try {
      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: order })
      });

      if (!response.ok) throw new Error('Error generando etiqueta');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta_${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Print error:', error);
      alert('Error generando etiqueta: ' + error.message);
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
      <div className="app-container">
        <div className="login-screen">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-icon">🔧</div>
              <h1 className="login-title">AppExpert</h1>
              <p className="login-subtitle">Gestión de Reparaciones</p>
            </div>
            <div className="form-group">
              <label className="form-label">👤 Nombre del Técnico</label>
              <input
                ref={technicianRef}
                type="text"
                defaultValue={technician}
                onKeyPress={(e) => e.key === 'Enter' && (setTechnician(technicianRef.current?.value || ''), handleLogin())}
                placeholder="Ej: Juan García"
                className="form-input"
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
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              🚀 Entrar al Sistema
            </button>
            <p className="text-center text-muted" style={{ marginTop: '30px', fontSize: '12px' }}>
              AppExpert Gadgets Solutions • Lucena, Córdoba
            </p>
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
      <div className="app-container" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
        <div className="dashboard-container" style={{ paddingTop: '0', paddingBottom: '40px' }}>
          {/* Header */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '0', boxShadow: 'var(--shadow)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>AppExpert</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Hola, <strong>{technician}</strong></p>
            </div>
            <button
              onClick={() => {
                setTechnician('');
                setScreen('login');
              }}
              className="btn btn-secondary"
            >
              Salir
            </button>
          </div>

          {/* Acciones */}
          <div className="dashboard-actions" style={{ marginBottom: '32px', gap: '16px', display: 'flex' }}>
            <button
              onClick={startNewOrder}
              className="btn btn-primary"
              style={{ flex: 1, padding: '16px 24px', fontSize: '16px' }}
            >
              + Nueva orden
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="btn btn-accent"
              style={{ flex: 1, padding: '16px 24px', fontSize: '16px' }}
            >
              🔍 Buscar dispositivo
            </button>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="card" style={{ marginBottom: '32px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Buscar orden</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="IMEI, teléfono, nombre o número de orden..."
                className="form-input"
                autoFocus
                style={{ marginBottom: '16px' }}
              />
              {searchQuery && searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{searchResults.length} resultado(s)</p>
                  {searchResults.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <p style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '4px' }}>{order.id}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>{order.client.name} • {order.device.brand}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-3" style={{ marginBottom: '32px' }}>
            <div className="stat-box">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Total de Órdenes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="stat-label">Completadas</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{orders.filter(o => o.status !== 'completed').length}</div>
              <div className="stat-label">Pendientes</div>
            </div>
          </div>

          {/* Órdenes */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginBottom: '20px' }}>Órdenes ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '16px' }}>Sin órdenes aún. Crea la primera.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      onClick={() => setSelectedOrder(order)}
                      style={{ flex: 1 }}
                    >
                      <p style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '4px' }}>{order.id}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>{order.client.name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintLabel(order);
                      }}
                      className="btn btn-small"
                      style={{ marginLeft: '16px' }}
                    >
                      🖨️ Imprimir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'order' && currentOrder) {
    if (step === 0) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 1 de 7: Datos del cliente</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-20" style={{ marginBottom: '24px' }}>Información del cliente</h3>
              <div className="grid gap-20" style={{ gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input
                    ref={clientNameRef}
                    type="text"
                    defaultValue={currentOrder.client.name}
                    placeholder="ej: Juan García López"
                    className="form-input"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    ref={clientPhoneRef}
                    type="tel"
                    defaultValue={currentOrder.client.phone}
                    placeholder="ej: 600 123 456"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (opcional)</label>
                  <input
                    ref={clientEmailRef}
                    type="email"
                    defaultValue={currentOrder.client.email}
                    placeholder="ej: juan@email.com"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setScreen('dashboard')} className="btn btn-secondary">← Cancelar</button>
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
              }} className="btn btn-primary">Siguiente →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 2 de 7: Datos del dispositivo</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-20" style={{ marginBottom: '24px' }}>Información del dispositivo</h3>
              <div className="grid gap-20" style={{ gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <select ref={deviceBrandRef} defaultValue={currentOrder.device.brand} className="form-select">
                    <option value="">Selecciona marca</option>
                    <option>Apple iPhone</option>
                    <option>Samsung</option>
                    <option>Xiaomi</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input ref={deviceModelRef} type="text" defaultValue={currentOrder.device.model} placeholder="ej: iPhone 15 Pro" className="form-input" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">IMEI / Nº serie</label>
                  <input ref={deviceImeiRef} type="text" defaultValue={currentOrder.device.imei} placeholder="ej: 356938815342816" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado físico</label>
                  <select ref={deviceConditionRef} defaultValue={currentOrder.device.condition} className="form-select">
                    <option value="">Selecciona estado</option>
                    <option>Impecable</option>
                    <option>Rayones superficiales</option>
                    <option>Grietas en pantalla</option>
                    <option>Daño estructural</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(0)} className="btn btn-secondary">← Atrás</button>
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
              }} className="btn btn-primary">Siguiente →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 3 de 7: Captura fotos</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '8px' }}>Fotografías del dispositivo</h3>
              <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Captura: frente, trasera, laterales</p>
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Subir foto</label>
                <input type="file" accept="image/*" onChange={handlePhotoCapture} multiple capture="environment" className="form-input" style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer' }} />
              </div>
              {currentOrder.photos.length > 0 && (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {currentOrder.photos.map((photo, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={photo} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--error)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-muted" style={{ fontSize: '12px' }}>{currentOrder.photos.length} foto(s) capturada(s)</p>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">← Atrás</button>
              <button onClick={() => setStep(3)} className="btn btn-primary">Siguiente →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 4 de 7: Síntomas reportados</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-20" style={{ marginBottom: '24px' }}>¿Qué problema tiene el dispositivo?</h3>
              <div className="form-group">
                <textarea value={currentOrder.symptoms} onChange={(e) => setCurrentOrder({ ...currentOrder, symptoms: e.target.value })} placeholder="Describe los síntomas..." className="form-textarea" rows={6} autoFocus />
                <p className="text-muted" style={{ fontSize: '12px', marginTop: '8px' }}>Describe los síntomas con detalle</p>
              </div>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">← Atrás</button>
              <button onClick={() => { if (currentOrder.symptoms.trim()) setStep(4); else alert('Describe los síntomas'); }} className="btn btn-primary">Siguiente →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 5 de 7: Datos sensibles</p>
              </div>
            </div>

            <div className="card">
              <div style={{ backgroundColor: '#fff3e0', border: '1px solid #FFB74D', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#E65100' }}><strong>⚠️ Datos sensibles:</strong> Se cifrarán automáticamente.</p>
              </div>
              <div className="form-group">
                <label className="form-label">PIN de pantalla (opcional)</label>
                <input type="password" value={currentOrder.pin} onChange={(e) => setCurrentOrder({ ...currentOrder, pin: e.target.value })} placeholder="Déjalo vacío si no conoces el PIN" maxLength={6} className="form-input" autoFocus />
                <p className="text-muted" style={{ fontSize: '12px', marginTop: '8px' }}>Este campo se cifrará en la base de datos</p>
              </div>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(3)} className="btn btn-secondary">← Atrás</button>
              <button onClick={() => setStep(5)} className="btn btn-primary">Siguiente →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 6 de 7: Revisar</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-20" style={{ marginBottom: '24px' }}>Resumen de la orden</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Cliente</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>{currentOrder.client.name}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>{currentOrder.client.phone}</p>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Dispositivo</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>{currentOrder.device.brand} {currentOrder.device.model}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Estado: {currentOrder.device.condition}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Síntomas</p>
                  <p style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{currentOrder.symptoms}</p>
                </div>
              </div>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(4)} className="btn btn-secondary">← Atrás</button>
              <button onClick={() => setStep(6)} className="btn btn-primary">Siguiente: Firmar →</button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">{currentOrder.id}</h2>
                <p className="dashboard-subtitle">Paso 7 de 7: Firma del cliente</p>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title mb-20" style={{ marginBottom: '16px' }}>Firma digital</h3>
              <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>Firma en la zona gris con el dedo (o ratón)</p>
              <div style={{ border: '2px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', backgroundColor: '#f9f9f9' }}>
                <canvas ref={canvasRef} width={500} height={250} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ display: 'block', width: '100%', height: '250px', cursor: 'crosshair', touchAction: 'none' }} />
              </div>
              <button onClick={clearSignature} className="btn btn-secondary" style={{ width: '100%', marginBottom: '16px' }}>Borrar firma</button>
            </div>

            <div className="dashboard-actions" style={{ marginTop: '30px' }}>
              <button onClick={() => setStep(5)} className="btn btn-secondary">← Atrás</button>
              <button onClick={captureSignature} className="btn btn-accent">✓ Completar</button>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
