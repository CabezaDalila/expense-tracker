'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
      return
    }

    // Verificar si la app ya fue instalada anteriormente (iOS)
    if ((window.navigator as any).standalone === true) {
      setShowInstallButton(false)
      return
    }

    // Para navegadores que no soportan beforeinstallprompt, mostrar el botón manualmente
    // después de un pequeño delay para dar tiempo a que se cargue la página
    const timer = setTimeout(() => {
      // Solo mostrar si no es iOS (que maneja la instalación de forma diferente)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (!isIOS && !deferredPrompt) {
        setShowInstallButton(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA instalada')
        setShowInstallButton(false)
      }
      
      setDeferredPrompt(null)
    } else {
      // Instalación manual - mostrar instrucciones
      alert('Para instalar esta aplicación:\n\n' +
            'Chrome/Edge: Haz clic en el menú ⋮ → "Instalar [nombre de la app]"\n' +
            'Safari (iOS): Toca el botón Compartir → "Agregar a pantalla de inicio"\n' +
            'Firefox: Haz clic en el menú ⋯ → "Instalar"')
    }
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
  }

  if (!showInstallButton) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Instalar Control de Gastos
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Agrega la app a tu pantalla de inicio
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
