import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

const align: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
}

export default function RichContentBlock(
  props: BlockOf<'rich-content-block'> & { isFirst?: boolean }
) {
  const { title, content, backgroundColor, textAlign, showLink, link, padding, isFirst } = props
  const Heading = isFirst ? 'h1' : 'h2'
  return (
    <Section padding={padding} background={backgroundColor}>
      <div className={cn('container', align[stegaClean(textAlign) ?? 'left'])}>
        {title && <Heading className="mb-6">{title}</Heading>}
        <PortableTextRenderer value={content as never} />
        {showLink && <ButtonLink link={link} className="mt-6" />}
      </div>
    </Section>
  )
}
