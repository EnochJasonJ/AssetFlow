import { supabase } from "./supabase.js";

try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (error) {
        throw error
    }
    console.log(data)
} catch (error) {
    console.error(error)
}