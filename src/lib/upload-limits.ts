/**
 * Limite por ficheiro nos uploads admin (galeria, roupas).
 * HEIC/ProRAW/DNG podem ser grandes — 100 MB cobre a maioria dos casos no iPhone.
 */
export const MAX_ADMIN_IMAGE_UPLOAD_BYTES = 100 * 1024 * 1024;
