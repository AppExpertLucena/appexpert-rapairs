import React, { useState } from 'react';

export default function AppExpertRepairs() {
  const [technician, setTechnician] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AppExpert</h1>
            <p className="text-sm text-slate-500">Test Page</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Técnico</label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button className="w-full bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg">
              Entrar
            </button>
            <p className="text-sm text-slate-600">Technician: {technician}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
