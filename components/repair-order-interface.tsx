'use client'

import React, { useState, useEffect, useCallback  } from 'react'
import { Phone,  MessageCircle, ArrowLeft, Send, AlertTriangle, CheckCircle, 
  Wrench, ClipboardList, Receipt, Lock,  Smartphone, MessageSquare, Edit3, Clock, RefreshCw, User, Loader2, 
  ChevronRight, Wifi, Radio, Camera, TouchpadIcon, Focus, Plug, Download, Sun, Mic } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import DeviceDetailsCard from './DeviceDetailsCard'



interface RepairOrderData {
  id: number
  product_name: string
  description: string
  state: 'draft' | 'confirmed' | 'ready' | 'under_repair' | 'test' | '2binvoiced' | 'done' | 'handover' | 'guarantee' | 'cancel'
  partner_name: string
  partner_phone: string
  user_id: string
  battery: number
  date_open: string | null
  passcode: string
  url: string
  progress_percentage: number
  total_amount: number
  currency: string
  faceid: string
  screen: string
  touch: string
  camera: string
  wifi: string
  pos_url: string
  signal: string
  powerstate: string
  charging: string
  camerafront: string
  truetone: string
  microphone: string
  device_details: {
    imei: string
    initial_battery: number
    storage: string
    color: string
    functions: string[]
    evaluation: {
      category: string
      score: number
    }[]
  }
  technician_messages: {
    id: number
    message: string
    timestamp: string
  }[]
}

const stateConfig = {
  draft: { label: 'Borrador', icon: AlertTriangle, color: 'bg-gray-200 text-gray-800' },
  confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'bg-blue-200 text-blue-800' },
  ready: { label: 'Listo', icon: CheckCircle, color: 'bg-green-200 text-green-800' },
  under_repair: { label: 'En Reparación', icon: Wrench, color: 'bg-yellow-200 text-yellow-800' },
  test: { label: 'En Pruebas', icon: ClipboardList, color: 'bg-blue-200 text-blue-800' },
  '2binvoiced': { label: 'Facturar', icon: Receipt, color: 'bg-blue-200 text-blue-800' },
  done: { label: 'Finalizado', icon: CheckCircle, color: 'bg-green-200 text-green-800' },
  handover: { label: 'Entregado', icon: Lock, color: 'bg-purple-200 text-purple-800' },
  guarantee: { label: 'Garantía', icon: CheckCircle, color: 'bg-indigo-200 text-indigo-800' },
  cancel: { label: 'Cancelado', icon: AlertTriangle, color: 'bg-red-200 text-red-800' },
}

const BatteryIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const color = percentage >= 80 ? "#10B981" : percentage >= 40 ? "#F59E0B" : "#EF4444"

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
        <motion.circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${percentage}, 100`}
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - percentage }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-sm font-medium text-gray-600">Batería</div>
        <div className="text-lg font-bold" style={{ color }}>{percentage}%</div>
      </div>
    </div>
  )
}



const AuthenticationPage: React.FC<{ onAuthenticate: (phone: string) => void }> = ({ onAuthenticate }) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeExpiration, setCodeExpiration] = useState<Date | null>(null)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const [isCodeExpired, setIsCodeExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds


  const MAX_VERIFICATION_ATTEMPTS = 3
  const CODE_EXPIRATION_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds

  const generateCode = useCallback(() => {
    return Math.floor(1000000 + Math.random() * 9000000).toString()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (codeExpiration) {
      timer = setInterval(() => {
        const now = new Date()
        const remaining = Math.max(0, Math.floor((codeExpiration.getTime() - now.getTime()) / 1000))
        setTimeRemaining(remaining)
        if (remaining === 0) {
          setIsCodeExpired(true)
          clearInterval(timer)
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [codeExpiration])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '')
    // Ensure the number starts with 1
    const formatted = cleaned.startsWith('1') ? cleaned : `1${cleaned}`
    // Limit to 11 digits (1 + 10 digit phone number)
    return formatted.slice(0, 11)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value)
    setPhone(formattedPhone)
  }


  const handleSendCode = async () => {
    if (phone.length !== 11) {
      setError('Por favor, introduce un número de teléfono válido de 10 dígitos (sin contar el 1 inicial).')
      setSuccess('')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')
    const newCode = generateCode()
    setGeneratedCode(newCode)
    const expirationTime = new Date(new Date().getTime() + CODE_EXPIRATION_TIME)
    setCodeExpiration(expirationTime)
    setIsCodeExpired(false)
    setVerificationAttempts(0)
    setTimeRemaining(300)
    try {
      const response = await fetch('https://test.ithesk.com/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone, 
          message: `Tu código de verificación es: ${newCode}`,
          url: '',
        }),
      })
      console.log('Código de verificación:', newCode)
      if (!response.ok) {
        throw new Error('Error al enviar el código de verificación')
        console.log(response)
      }
      const data = await response.json()
      console.log('data:', data)
      if (data.status === 'success') {
        setSuccess('Se ha enviado un código de verificación a tu número de WhatsApp.')
        console.log('fallo codigo :', newCode)
        setStep('code')
      } else {
        throw new Error(data.message || 'Error al enviar el código de verificación')
        console.log('Error al enviar el código de verificación:', data.message)
        
      }
    } catch (error) {
      console.error('Error:', error)
      setError('No se pudo enviar el código. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = () => {
    if (code.length !== 7) {
      setError('Por favor, introduce un código válido de 7 dígitos.')
      setSuccess('')
      return
    }
    if (isCodeExpired) {
      setError('El código ha expirado. Por favor, solicita un nuevo código.')
      setSuccess('')
      return
    }
    if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      setError('Has excedido el número máximo de intentos. Por favor, solicita un nuevo código.')
      setSuccess('')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    setTimeout(() => {
      if (code === generatedCode) {
        setSuccess('Código verificado correctamente.')
        onAuthenticate(phone)
      } else {
        const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - verificationAttempts - 1
        setError(`Código incorrecto. Te quedan ${remainingAttempts} ${remainingAttempts === 1 ? 'intento' : 'intentos'}.`)
        setCode('')
        setVerificationAttempts(prev => prev + 1)
      }
      setIsLoading(false)
    }, 1000)
  }

  const getInitials = (phoneNumber: string) => {
    return phoneNumber.slice(-2).toUpperCase()
  }

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded">
          <span className="font-bold text-lg">ITHESK</span>
        </div>
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Autenticación</CardTitle>
          <Avatar className="h-10 w-10 bg-blue-500 text-white">
            <AvatarFallback>
              {phone ? getInitials(phone) : <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardDescription>
          {step === 'phone' 
            ? 'Introduce tu número de teléfono para recibir un código de verificación por WhatsApp.'
            : 'Introduce el código de 7 dígitos que has recibido por WhatsApp.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="mb-4 bg-green-100 text-green-800 border-green-300">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {step === 'phone' ? (
          <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Phone className="text-gray-500" />
            <Input
              type="tel"
              placeholder="Ej: 16123456789"
              value={phone}
              onChange={handlePhoneChange}
              className="flex-1"
            />
          </div>
            <Button onClick={handleSendCode} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Enviando...' : 'Enviar código'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Código de 7 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={7}
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Tiempo restante: {formatTimeRemaining(timeRemaining)}
              </div>
              <div className="flex items-center">
                <RefreshCw className="mr-1 h-4 w-4" />
                Intentos restantes: {MAX_VERIFICATION_ATTEMPTS - verificationAttempts}
              </div>
            </div>
            <Progress value={(timeRemaining / 300) * 100} className="w-full" />
            <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading || isCodeExpired}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Verificar código'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('phone')
                setError('')
                setSuccess('')
                setVerificationAttempts(0)
                setIsCodeExpired(false)
              }} 
              className="w-full"
              disabled={isLoading}
            >
              Volver a introducir el número
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
    </div>
  )
}

const RepairOrdersList: React.FC<{ orders: RepairOrderData[], onSelectOrder: (order: RepairOrderData) => void }> = ({ orders, onSelectOrder }) => {
  const safeOrders = Array.isArray(orders) ? orders : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <Card className="backdrop-blur-md bg-white/30 shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold">Tus Reparaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ScrollArea className="h-[400px] w-full pr-4">
            {safeOrders.length === 0 ? (
              <p className="text-center text-gray-500">No hay órdenes de reparación disponibles.</p>
            ) : (
              safeOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ scale: 1.02 }}
                  className="mb-4 last:mb-0"
                >
                  <Card 
                    className="cursor-pointer hover:bg-blue-50 transition-all duration-300"
                    onClick={() => onSelectOrder(order)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-blue-800">{order.product_name}</h3>
                        <p className="text-sm text-gray-600">Orden #{order.id}</p>
                        <Badge className={`${stateConfig[order.state].color} mt-2`}>
                          {stateConfig[order.state].label}
                        </Badge>
                      </div>
                      <ChevronRight className="text-blue-500" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const MainPage: React.FC<{ data: RepairOrderData; setShowInvoice: (show: boolean) => void; setShowAuthorization: (show: boolean) => void }> = ({ data, setShowInvoice, setShowAuthorization }) => {
  const [showPhone, setShowPhone] = useState(false)
  const [message, setMessage] = useState('')
  const [showDeviceDetails, setShowDeviceDetails] = useState(false)



  const sendWhatsAppMessage = async () => {
    console.log('Enviando mensaje:', message)
    try {
      const response = await fetch('https://test.ithesk.com/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: data.partner_phone,
          message: message,
          mediaUrl: "",
        }),
        
      })
      if (response.ok) {
        alert('Mensaje enviado con éxito')
        console.log('Mensaje enviado con éxito')
        setMessage('')
      } else {
        console.error('Error:', response)
        alert('Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar el mensaje')
    }
  }

  const StateIcon = stateConfig[data.state].icon

  const deviceFunctions = [
    { name: 'Face ID', status: data.faceid, icon: <Smartphone size={20} /> },
    { name: 'Cargado', status: data.charging, icon: <Plug size={20} /> },
    { name: 'Camara Frontal', status: data.camerafront, icon: <Focus size={20} /> },
    { name: 'Wi-Fi', status: data.wifi, icon: <Wifi size={20} /> },
    { name: 'Señal', status: data.signal, icon: <Radio size={20} /> },
    { name: 'Cámara', status: data.camera, icon: <Camera size={20} /> },
    { name: 'Pantalla', status: data.screen, icon: <Smartphone size={20} /> },
    { name: 'Touch', status: data.touch, icon: <TouchpadIcon size={20} /> },
    { name: 'True Tone', status: data.truetone, icon: <Sun size={20} /> },
    { name: 'Micrófono', status: data.microphone, icon: <Mic size={20} /> },
  ]



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >

      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded">
                <span className="font-bold text-lg">ITHESK</span>
              </div>
      <Card className="backdrop-blur-md bg-white/30 shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-6">
          <div>
            <h2 className="text-2xl font-bold">Hola, {data.partner_name}</h2>
            <p className="text-sm  opacity-80">Orden #{data.id}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar onClick={() => setShowPhone(!showPhone)} className="cursor-pointer hover:ring-2 hover:ring-white transition-all duration-300 bg-white text-blue-500">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt={data.partner_name} />
                  <AvatarFallback>{data.partner_name[0]}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showPhone ? 'Ocultar teléfono' : 'Mostrar teléfono'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="space-y-6  p-6">
          <AnimatePresence>
            {showPhone && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/50 backdrop-blur-sm rounded-md p-2 text-center"
              >
                <p className="text-blue-800 font-semibold">{data.partner_phone}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/70 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowDeviceDetails(!showDeviceDetails)}
          >
            <div className="flex items-center">
              <Smartphone className="mr-3 text-blue-500" />
              <span className="text-blue-800 font-semibold">{data.product_name}</span>
            </div>
            <span className="text-blue-600">{data.description}</span>
          </motion.div>

          <AnimatePresence>
            {showDeviceDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/50 backdrop-blur-sm rounded-lg p-4 space-y-4"
              >
                <h3 className="font-semibold text-blue-800">Detalles del dispositivo</h3>
                <DeviceDetailsCard
                          // customerName="Pablo Holguín"
                          // orderNumber="3472"
                          powerstate={data.description}
                          deviceModel={data.product_name}
                          deviceStatus={data.powerstate}
                          imei={data.imei}
                          initialBattery={data.battery}
                          password={data.passcode}
                          functions={deviceFunctions}
                             />
                
                <div className="mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Evaluación del dispositivo</h4>
                    {data && data.device_details && data.device_details.evaluation ? (
                      data.device_details.evaluation.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        {/* Renderización de cada evaluación */}
                      </div>
                    ))
                  ) : (
                    <p>No hay evaluaciones disponibles.</p>
                   
                    
                  )}
                        
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <Badge 
              className={`${stateConfig[data.state].color} flex items-center gap-2 px-3 py-1 text-sm font-medium transition-all duration-300 hover:shadow-md`}
            >
              <StateIcon className="w-4 h-4" />
              {stateConfig[data.state].label}
            </Badge>
          </motion.div>
          
          <Card className="bg-white/50 backdrop-blur-sm hover:bg-white/60 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt={data.user_id} />
                    <AvatarFallback>{data.user_id[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-blue-800 font-medium">{data.user_id}</span>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors duration-300">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Enviar mensaje por WhatsApp</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Input
                          id="message"
                          placeholder="Escribe tu mensaje aquí"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Button onClick={sendWhatsAppMessage} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                          <Send className="mr-2 h-4 w-4" /> Enviar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors duration-300">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Mensajes del Técnico</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        {(data.technician_messages || []).map((msg) => (
                          <div key={msg.id} className="mb-4 last:mb-0">
                            <p className="text-sm text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                            <p className="text-blue-800">{msg.message}</p>
                          </div>
                        ))}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2 text-sm font-medium">
              <span className="text-blue-800">Progreso de la reparación</span>
              <span className="text-blue-600">{data.progress_percentage}%</span>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                <motion.div
                  style={{ width: `${data.progress_percentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progress_percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <motion.div
                className="absolute left-0 top-0 h-2 w-2 rounded-full bg-white shadow-md border-2 border-blue-500"
                style={{ left: `calc(${data.progress_percentage}% - 0.25rem)` }}
                initial={{ left: 0 }}
                animate={{ left: `calc(${data.progress_percentage}% - 0.25rem)` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <BatteryIndicator percentage={data.battery} />
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                onClick={() => setShowInvoice(true)}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Factura
              </Button>
              {data.pos_url && (
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                onClick={() => window.open(data.pos_url, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            )}
              <Button 
                variant="outline" 
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                onClick={() => setShowAuthorization(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Autorizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
    </motion.div>
  )
}

const InvoicePage: React.FC<{ orderData: RepairOrderData; onBack: () => void }> = ({ orderData, onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <Card className="backdrop-blur-md bg-white/30 shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-6">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20 transition-colors duration-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Factura</h2>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {[
            { label: "Número de orden", value: orderData.id },
            { label: "Cliente", value: orderData.partner_name },
            { label: "Producto", value: orderData.product_name },
            { label: "Descripción", value: orderData.description },
            { label: "Estado", value: stateConfig[orderData.state].label },
            { label: "Fecha de apertura", value: orderData.date_open ? new Date(orderData.date_open).toLocaleDateString() : 'N/A' },
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              className="flex justify-between bg-white/50 backdrop-blur-sm rounded-lg p-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="text-blue-800 font-medium">{item.label}:</span>
              <span className="text-blue-600">{item.value}</span>
            </motion.div>
          ))}
          <motion.div 
            className="flex justify-between font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <span>Total:</span>
            <span>{orderData.total_amount.toFixed(2)} {orderData.currency}</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const AuthorizationPage: React.FC<{ orderData: RepairOrderData; onBack: () => void; signature: string; setSignature: (signature: string) => void }> = ({ orderData, onBack, signature, setSignature }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#3b82f6'
      }
    }
  }, [])

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const point = getEventPoint(event)
    setLastPoint(point)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas || !lastPoint) return

    const currentPoint = getEventPoint(event)
    if (!currentPoint) return

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()

    setLastPoint(currentPoint)
  }

  const getEventPoint = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    let x, y
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left
      y = event.touches[0].clientY - rect.top
    } else {
      x = event.clientX - rect.left
      y = event.clientY - rect.top
    }
    return { x, y }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignature('')
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      setSignature(dataUrl)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md relative pb-16"
      
    >
      <Card className="backdrop-blur-md bg-white/30 shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-6">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20 transition-colors duration-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Autorización</h2>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-blue-800">
            Yo, {orderData.partner_name}, autorizo la reparación de mi dispositivo {orderData.product_name} con la descripción: {orderData.description}.
          </p>
          <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={350}
              height={200}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="bg-white w-full touch-none"
            />
          </div>
          <div className="flex justify-between">
            <Button onClick={clearSignature} variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-100">
              Borrar firma
            </Button>
            <Button onClick={saveSignature} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
              Guardar firma
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function RepairOrderInterfaceComponent() {
  const [showInvoice, setShowInvoice] = useState(false)
  const [showAuthorization, setShowAuthorization] = useState(false)
  const [signature, setSignature] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<RepairOrderData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [orders, setOrders] = useState<RepairOrderData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')

  const fetchOrders = async (phoneNumber: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('https://test.ithesk.com/api/get-repair-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber })
      })
      if (!response.ok) {
        throw new Error('Failed to fetch repair orders')
      }
      const data = await response.json()
      console.log('Repair orders:', data)
      setOrders(data.orders)
      console.log('Orders:', orders)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching repair orders:', err)
      setError('Failed to load repair orders. Please try again later.')
      setIsLoading(false)
    }
  }

  const handleAuthentication = async (phoneNumber: string) => {
    setPhone(phoneNumber)
    setIsAuthenticated(true)
    await fetchOrders(phoneNumber)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-blue-500">Cargando órdenes de reparación...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4 relative">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthenticationPage key="auth" onAuthenticate={handleAuthentication} />
        ) : showInvoice && selectedOrder ? (
          <InvoicePage key="invoice" orderData={selectedOrder} onBack={() => setShowInvoice(false)} />
        ) : showAuthorization && selectedOrder ? (
          <AuthorizationPage key="authorization" orderData={selectedOrder} onBack={() => setShowAuthorization(false)} signature={signature} setSignature={setSignature} />
        ) : selectedOrder ? (
          <MainPage 
            key="main" 
            data={selectedOrder} 
            setShowInvoice={setShowInvoice} 
            setShowAuthorization={setShowAuthorization} 
          />
        ) : (
          <RepairOrdersList 
            key="list" 
            orders={orders} 
            onSelectOrder={(order) => setSelectedOrder(order)} 
          />
        )}
      </AnimatePresence>
      {selectedOrder && isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4"
        >
          <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="bg-white text-blue-500 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </motion.div>
      )}
    </div>
  )
}