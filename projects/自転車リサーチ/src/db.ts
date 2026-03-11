import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export interface BikeData {
    url: string;
    title: string;
    price_eur: number;
    reason: string;
}

/**
 * Checks if a bike URL exists in the DB, and if not, inserts it.
 * @returns true if the bike is newly inserted (should trigger notification)
 */
export async function insertBikeIfNew(bike: BikeData): Promise<boolean> {
    if (!supabaseUrl || !supabaseKey) {
        console.log('[DEBUG] Supabase credentials not found. Pretending bike is new:', bike.title);
        return true;
    }

    // Check if URL already exists
    const { data: existing, error: checkError } = await supabase
        .from('processed_bikes')
        .select('id')
        .eq('url', bike.url)
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error checking existing bike:', checkError);
        return false;
    }

    if (existing) {
        console.log(`[DB] Bike already processed: ${bike.url}`);
        return false;
    }

    // Insert new bike
    const { error: insertError } = await supabase
        .from('processed_bikes')
        .insert([{
            url: bike.url,
            title: bike.title,
            price: bike.price_eur,
            reason: bike.reason
        }]);

    if (insertError) {
        console.error('Error inserting bike:', insertError);
        return false;
    }

    console.log(`[DB] Successfully saved new bike: ${bike.title}`);
    return true;
}
