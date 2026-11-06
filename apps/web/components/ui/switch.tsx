'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Switch as SwitchPrimitive } from 'radix-ui'

/**
 * Composed from Radix's switch parts instead of `Root`, which server-renders a hidden checkbox
 * next to every switch (it can't tell yet whether the switch sits in a form) and gives that
 * checkbox no accessible name. Here the checkbox is only rendered for switches that post with a
 * form (`name` or `form` set), and it carries the switch's own name.
 */
function Switch({
  className,
  size = 'default',
  checked,
  defaultChecked,
  required,
  disabled,
  onCheckedChange,
  name,
  form,
  value,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SwitchPrimitive.unstable_Provider
      checked={checked}
      defaultChecked={defaultChecked}
      required={required}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      name={name}
      form={form}
      value={value}
    >
      <SwitchPrimitive.unstable_Trigger
        data-slot="switch"
        data-size={size}
        className={cn(
          'peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            'pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground'
          )}
        />
      </SwitchPrimitive.unstable_Trigger>
      {(name || form) && (
        <SwitchPrimitive.unstable_BubbleInput
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
        />
      )}
    </SwitchPrimitive.unstable_Provider>
  )
}

export { Switch }
