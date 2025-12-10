import Link from 'next/link'
import { cn } from '@/lib/utils'

// Use absolute URL to ensure logos load correctly across all domains
const LOGO_WHITE_URL = 'https://trefa.mx/images/logoblanco.png'

const TrefaLogo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <img
        src={LOGO_WHITE_URL}
        alt="TREFA Logo"
        className="h-16 lg:h-20 w-auto"
        loading="lazy"
        decoding="async"
      />
    </Link>
  )
}

export default TrefaLogo
