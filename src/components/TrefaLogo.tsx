import Link from 'next/link'
import { cn } from '@/lib/utils'

const TrefaLogo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/images/logoblanco.png"
        alt="TREFA Logo"
        className="h-16 lg:h-20 w-auto"
        loading="lazy"
        decoding="async"
      />
    </Link>
  )
}

export default TrefaLogo
