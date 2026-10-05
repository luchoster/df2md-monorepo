import type { PortableTextBlock } from '@portabletext/types'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Product } from './types'

/** Description / Nutritional Facts / Feeding Instructions / Ingredients & Use, only the ones with content. */
export function ProductTabs({ product }: { product: Product }) {
  const tabs = [
    { key: 'description', label: 'Description', value: product.description },
    ...(product.showAdditionalInfo !== false
      ? [
          { key: 'nutrition', label: 'Nutritional Facts', value: product.nutritionalInfo },
          { key: 'feeding', label: 'Feeding Instructions', value: product.feedingInstructions },
          { key: 'ingredients', label: 'Ingredients & Use', value: product.ingredientsAndUse }
        ]
      : [])
  ].filter((t) => t.value?.length)
  if (!tabs.length) return null

  return (
    <Tabs defaultValue={tabs[0]!.key} className="gap-6">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent px-4 py-3 text-base font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="max-w-4xl">
          <PortableTextRenderer value={t.value as PortableTextBlock[]} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
