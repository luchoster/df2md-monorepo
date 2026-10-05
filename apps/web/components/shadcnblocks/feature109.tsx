import { ChevronRight, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
interface Feature109Props {
  className?: string
}

const Feature109 = ({ className }: Feature109Props) => {
  return (
    <section className={cn('py-32', className)}>
      <div className="container">
        <div className="grid place-items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Badge variant="outline" className="w-fit bg-background">
              Modern Tactics
            </Badge>
            <h3 className="text-3xl font-semibold lg:text-5xl">Make your site a true standout.</h3>
            <p className="text-muted-foreground lg:text-lg">
              Discover new web trends that help you craft sleek, highly functional sites that drive
              traffic and convert leads into customers.
            </p>
            <Button className="mt-2.5 w-fit gap-2" size="lg">
              View Features
              <Menu className="h-auto w-4" />
            </Button>
          </div>
          <div className="relative rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1567320743368-9db24e12ebf0?q=80&w=2039&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="placeholder"
              className="rounded-lg object-cover md:aspect-video lg:aspect-auto"
            />
            <div className="absolute top-0 right-0 bottom-0 left-0 rounded-lg bg-linear-to-t from-primary via-transparent to-transparent"></div>
            <div className="absolute top-0 flex h-full w-full flex-col justify-between p-7">
              <span className="ml-auto flex w-fit items-center gap-2 rounded-full bg-background/30 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
                <Avatar className="size-7 rounded-full">
                  <AvatarImage
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp"
                    alt="placeholder"
                  />
                </Avatar>
                Tailored for experts
              </span>
              <div className="flex flex-col gap-5 text-background">
                <h4 className="text-lg font-semibold lg:text-3xl">
                  Elevate your platform to the next level.
                </h4>
                <a href="#" className="flex items-center gap-1 font-medium">
                  Explore all features
                  <ChevronRight className="h-auto w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Feature109 }
