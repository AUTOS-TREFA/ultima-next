import {
  CalendarRangeIcon,
  LayoutPanelLeftIcon,
  Layers2Icon,
  DatabaseIcon,
  BookOpenIcon,
  PresentationIcon
} from 'lucide-react'

import Features from '@/components/shadcn-studio/blocks/features-section-11/features-section-11'

const leftSection = [
  {
    icon: CalendarRangeIcon,
    title: 'User Onboarding Flows',
    description: 'Design custom onboarding experiences to guide users through your product'
  },
  {
    icon: LayoutPanelLeftIcon,
    title: 'Result Tracking',
    description: 'Monitor the performance of your SaaS product with real-time analytics.'
  },
  {
    icon: Layers2Icon,
    title: 'App Integrations',
    description: 'Bring all your tools & data together & join with many of other apps.'
  }
]

const rightSection = [
  {
    icon: PresentationIcon,
    title: 'Presentation',
    description: 'Create and share live product demos or pitch decks directly from the platform.'
  },
  {
    icon: BookOpenIcon,
    title: 'Special Guide',
    description: 'Step-by-step product-building guide to help launch faster.'
  },
  {
    icon: DatabaseIcon,
    title: 'Data Reporting',
    description: 'Comprehensive dashboards to track usage, churn, MRR, and other SaaS KPIs.'
  }
]

const FeaturesPage = () => {
  return <Features leftSection={leftSection} rightSection={rightSection} />
}

export default FeaturesPage
