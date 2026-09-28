import type { BlockOf } from '../types'

// Placeholder until the old-app spec lands (docs/design/OLD-APP-SPEC.md).
export default function Placeholder(props: BlockOf<'hero-slider'>) {
  return <div data-type={props._type} />
}
