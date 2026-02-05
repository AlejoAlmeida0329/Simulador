import toast from 'react-hot-toast'

/**
 * Sistema de notificaciones unificado usando react-hot-toast
 *
 * @example
 * notify.success('Operación exitosa')
 * notify.error('Error al procesar')
 * notify.info('Información importante')
 * notify.loading('Procesando...')
 */
export const notify = {
  /**
   * Muestra notificación de éxito
   */
  success: (message: string) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    })
  },

  /**
   * Muestra notificación de error
   */
  error: (message: string) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    })
  },

  /**
   * Muestra notificación informativa
   */
  info: (message: string) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
    })
  },

  /**
   * Muestra notificación de carga
   */
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    })
  },

  /**
   * Cierra una notificación específica
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },

  /**
   * Cierra todas las notificaciones
   */
  dismissAll: () => {
    toast.dismiss()
  },
}
