import { supabase } from './supabase-client'

export interface UploadOptions {
    bucket?: string
    folder?: string
    maxSizeMB?: number
}

export async function uploadFileToSupabase(file: File, options: UploadOptions = {}): Promise<string> {
    const bucket = options.bucket || 'media'
    const folder = options.folder || 'misc'
    
    // Default max size: 20MB
    const maxBytes = (options.maxSizeMB || 20) * 1024 * 1024
    if (file.size > maxBytes) {
        throw new Error(`Kích thước file vượt quá giới hạn cho phép (${options.maxSizeMB || 20}MB)`)
    }

    // Clean file name to prevent encoding issues
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
    
    // Append timestamp to ensure uniqueness
    const fileName = `${Date.now()}-${safeName}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false // Don't mistakenly overwrite
        })

    if (error) {
        throw new Error(`Upload lỗi: ${error.message}`)
    }

    // Generate public URL
    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

    return publicUrlData.publicUrl
}
