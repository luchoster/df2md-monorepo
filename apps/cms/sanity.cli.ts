import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'rthdhol7',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production'
  },
  deployment: {
    appId: 'e9c00dkuh4asoe2fwbums9wa',
    autoUpdates: true
  },
  typegen: {
    path: '../web/{app,components,lib,sanity}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true
  }
})
