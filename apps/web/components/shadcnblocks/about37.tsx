import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

interface Image {
  src: string
  alt: string
  srcDark?: string
}
interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}

interface AboutBasicProps {
  heading: string
  description?: string
  images?: Image[]
  buttons?: Buttons
  className?: string
}

interface About37Props extends AboutBasicProps {}
type Props = Partial<About37Props>

const defaultProps: About37Props = {
  heading: 'About Us',
  description:
    'We are a passionate team dedicated to creating innovative solutions that empower businesses to thrive in the digital age. With years of experience in design and development, we craft beautiful, accessible components that help teams build faster.',
  images: [
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-1-16x9.jpg',
      alt: 'Team collaboration'
    },
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-2-16x9.jpg',
      alt: 'Studio workspace'
    },
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-3-16x9.jpg',
      alt: 'Team meeting'
    },
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-4-16x9.jpg',
      alt: 'Office interior'
    },
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-5-16x9.jpg',
      alt: 'Workshop session'
    },
    {
      src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/about/photo-6-16x9.jpg',
      alt: 'Founding team'
    }
  ],
  buttons: {
    primary: {
      text: 'Get to know the team',
      url: 'https://www.shadcnblocks.com'
    },
    secondary: {
      text: 'View open roles',
      url: 'https://www.shadcnblocks.com'
    }
  }
}

const MAX_IMAGES = 2

const About37 = (props: Props) => {
  const { heading, description, images, buttons, className } = {
    ...defaultProps,
    ...props
  }

  const gallery = (images ?? []).slice(0, MAX_IMAGES)

  return (
    <section className={cn('py-32', className)}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-12 md:gap-16">
          <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-16">
            <div className="flex max-w-xl flex-col items-start gap-6">
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{heading}</h1>
              {buttons?.primary && (
                <Button variant="outline" size="lg" asChild>
                  <a href={buttons.primary.url}>{buttons.primary.text}</a>
                </Button>
              )}
            </div>
            {description && (
              <p className="text-lg text-muted-foreground md:text-xl">{description}</p>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {gallery.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className="aspect-video w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { About37 }
