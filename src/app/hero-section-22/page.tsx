import Header from '@/components/shadcn-studio/blocks/hero-section-22/header'
import HeroSection from '@/components/shadcn-studio/blocks/hero-section-22/hero-section-22'
import type { NavigationSection } from '@/components/shadcn-studio/blocks/menu-navigation'

const navigationData: NavigationSection[] = [
  {
    title: 'Home',
    href: '#'
  },
  {
    title: 'About us',
    href: '#'
  },
  {
    title: 'Doctors',
    href: '#'
  },
  {
    title: 'Departments',
    href: '#'
  }
]

const HeroSectionPage = () => {
  return (
    <div className='flex flex-col'>
      {/* Header Section */}
      <Header navigationData={navigationData} />

      {/* Main Content */}
      <main className='flex flex-col'>
        <HeroSection />
      </main>
    </div>
  )
}

export default HeroSectionPage
