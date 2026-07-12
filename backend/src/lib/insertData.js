import { supabase } from "./supabase.js";

try {
    const {data,error} = await supabase.from('users').insert({
        "email": "example@email.com",
    })
    if(error) throw error;
    console.log(data);
} catch (error) {
    console.error(error)
}