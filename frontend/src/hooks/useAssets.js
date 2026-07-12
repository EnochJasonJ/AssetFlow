// useAssets — fetch and filter assets, used by Devipriya (Screen 4) and others
import { useState, useEffect, useCallback } from 'react'
import { assetService } from '../services/assetService'

export function useAssets(initialFilters = {}) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: d, error: e } = await assetService.getAll(filters)
    setData(d ?? [])
    setError(e)
    setLoading(false)
  }, [filters])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch, setFilters, filters }
}

// useAsset — fetch a single asset by ID with full history
export function useAsset(id) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: d, error: e } = await assetService.getById(id)
    setData(d)
    setError(e)
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}
