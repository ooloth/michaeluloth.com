// see: https://cloudinary.com/documentation/node_integration#installation_and_setup

import { v2 as cloudinary } from 'cloudinary'
import { loadEnv } from 'vite'

const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = loadEnv(
  import.meta.env.MODE,
  process.cwd(),
  '',
)

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary
