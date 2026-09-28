import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { media } from 'sanity-plugin-media'
import { API_VERSION, SINGLETONS } from './lib/constants'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'

const singletonTypes = new Set<string>(SINGLETONS)
const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'default',
  title: 'Dog Food 2 My Door',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'rthdhol7',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({ structure }), media(), visionTool({ defaultApiVersion: API_VERSION })],

  schema: {
    types: schemaTypes,
    // Singletons are opened from the structure only, never created from "New document".
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType))
  },

  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? actions.filter(({ action }) => action && singletonActions.has(action))
        : actions
  },

  form: {
    components: {
      // Native Portable Text tables (Studio ≥ 6.6), used by product nutrition/feeding tabs.
      portableText: {
        plugins: (props) =>
          props.renderDefault({
            ...props,
            plugins: { ...props.plugins, table: { enabled: true } }
          })
      }
    }
  }
})
