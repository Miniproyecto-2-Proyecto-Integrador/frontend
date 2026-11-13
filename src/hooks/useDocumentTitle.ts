import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { aplicarMetadatos } from '../services/metadatos'

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    aplicarMetadatos(pathname)
  }, [pathname])
}
