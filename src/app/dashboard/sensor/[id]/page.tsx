'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Wifi, WifiOff, Thermometer, Droplets, Activity, Zap, Weight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useESP32Data } from '@/hooks/useESP32';

export default function SensorDetailsPage() {
  const params = useParams();
  const id = decodeURIComponent(params?.id as string);
  const { devices } = useESP32Data();

  const device = React.useMemo(() => devices.find(d => d.deviceId === id), [devices, id]);

  if (!device) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/sensor" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sensors
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-700">
          Sensor not found.
        </div>
      </div>
    );
  }

  const StatusIcon = device.isOnline ? Wifi : WifiOff;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sensor Details</h1>
          <p className="text-gray-600 mt-1">ID: {device.deviceId}</p>
        </div>
        <Link href="/dashboard/sensor" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sensors
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`h-5 w-5 ${device.isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <div className="text-gray-900 font-medium">ESP32 {device.deviceId}</div>
              <div className="text-sm text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> Zone {device.deviceId} - Manufacturing
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${device.isOnline ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
            {device.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {device.data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Data</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-gray-800">{device.data.sensors.bme680.temperature_c.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-gray-800">{device.data.sensors.bme680.humidity_pct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-gray-800">Gas: {device.data.sensors.bme680.gas_kohm.toFixed(1)}kΩ</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-800">EMG: {device.data.sensors.emg.raw}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Weight className="h-5 w-5 mr-2 text-indigo-600" />
                Load Sensor
              </h2>
              {device.data.sensors.loadcell.overweight ? (
                <span className="flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Overweight
                </span>
              ) : (
                <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" /> Normal
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-end justify-between mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  {(device.data.sensors.loadcell.weight_g / 1000).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 ml-1">kg</span>
                </span>
                <span className="text-xs text-gray-600">{device.data.sensors.loadcell.weight_g.toFixed(0)}g</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                    device.data.sensors.loadcell.overweight 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (device.data.sensors.loadcell.weight_g / 25000) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0 kg</span>
                <span className="font-medium">Max: 25 kg</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


