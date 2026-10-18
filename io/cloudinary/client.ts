// see: https://cloudinary.com/documentation/node_integration#installation_and_setup

import { v2 as cloudinary } from 'cloudinary'
import { env } from '@/io/env/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
  // Keeps "api_key:api_secret" out of the errors the SDK raises, which default to including it.
  hide_sensitive: true,
})

export default cloudinary
export type CloudinaryClient = typeof cloudinary
