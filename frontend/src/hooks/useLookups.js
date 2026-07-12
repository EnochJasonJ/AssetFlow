// useLookups — fetch departments, categories, employees for dropdowns
// Used across multiple screens — call once per page, pass data down as props
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('departments').select('id, name').eq('status', 'Active').order('name')
      .then(({ data }) => { setDepartments(data ?? []); setLoading(false) })
  }, [])
  return { departments, loading }
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('asset_categories').select('id, name, custom_fields').order('name')
      .then(({ data }) => { setCategories(data ?? []); setLoading(false) })
  }, [])
  return { categories, loading }
}

export function useEmployees(roleFilter = null) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let q = supabase.from('employees').select('id, name, email, role, department_id, dept:department_id(name)').eq('status', 'Active').order('name')
    if (roleFilter) q = q.eq('role', roleFilter)
    q.then(({ data }) => { setEmployees(data ?? []); setLoading(false) })
  }, [roleFilter])
  return { employees, loading }
}
