import clsx from 'clsx'
import s from './Skeleton.module.scss'

export function Skeleton({ height = 16, width = '100%', className }: { height?: number; width?: number | string; className?: string }) {
  return <span className={clsx(s.skeleton, className)} style={{ blockSize: height, inlineSize: width }} aria-hidden="true" />
}
