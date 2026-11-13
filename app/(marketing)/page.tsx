import SiteNav from '@/components/landing/SiteNav'
import HeroScope from '@/components/landing/HeroScope'
import FeatureStory from '@/components/landing/FeatureStory'
import NetWorth from '@/components/landing/NetWorth'
import Details from '@/components/landing/Details'
import Closing from '@/components/landing/Closing'

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <HeroScope />
        <FeatureStory />
        <NetWorth />
        <Details />
      </main>
      <Closing />
    </>
  )
}
