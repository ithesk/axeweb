import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Smartphone } from 'lucide-react'

interface DeviceFunction {
  name: string
  status: boolean
  icon: React.ReactNode
}

interface DeviceDetailsProps {
  customerName?: string
  orderNumber: string
  deviceModel: string
  deviceStatus: string
  imei: string
  initialBattery: string
  password: string
  powerstate: string
  functions?: DeviceFunction[]
}

export default function DeviceDetailsCard({
  customerName = '',
  deviceModel,
  deviceStatus,
  imei,
  initialBattery,
  password,
  functions = []
}: DeviceDetailsProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }




  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
    

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Smartphone className="mr-2" />
            {deviceModel}
            <Badge variant="outline" className="ml-2 text-sm">{deviceStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong className="font-medium">IMEI:</strong> {imei}</p>
            <p><strong className="font-medium">Batería inicial:</strong> {initialBattery}</p>
            <p><strong className="font-medium">Contraseña:</strong> {password}</p>
            <p><strong className="font-medium">Estado Dispositivo:</strong> {deviceStatus}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Funciones del dispositivo</CardTitle>
        </CardHeader>
        <CardContent>
          {functions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {functions.map((func, index) => (
                <div key={index} className="flex items-center p-3 border rounded-md bg-gray-50">
                  <div className="mr-3 text-gray-500">{func.icon}</div>
                  <span className="flex-grow font-medium truncate">{func.name}</span>
                  {func.status ? (
                    <CheckCircle2 className="text-green-500 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="text-red-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay información de funciones disponible.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}