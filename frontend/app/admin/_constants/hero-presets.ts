export interface HeroPreset {
  name: string
  eyebrow: string
  headline: string
  highlight: string
  subtitle: string
}

export const HERO_PRESETS: HeroPreset[] = [
  {
    name: 'Zero-Deposit Focus',
    eyebrow: 'SalonDesk Marketplace',
    headline: 'Book salon services with',
    highlight: 'zero upfront charge.',
    subtitle:
      'Reserve appointments with PayPal authorization holds. $0 is debited today, guaranteeing your stylist time without payment lock-in.',
  },
  {
    name: 'Luxury & Signature',
    eyebrow: 'Curated Boutique Network',
    headline: 'Discover premier treatments from',
    highlight: 'master stylists.',
    subtitle:
      'Indulge in bespoke color artistry, precision cuts, and private studio experiences backed by transparent cancellation policies.',
  },
  {
    name: 'Top-Rated Discovery',
    eyebrow: 'Verified Client Reviews',
    headline: 'Book high-demand salons rated',
    highlight: '4.8 stars or higher.',
    subtitle:
      'Browse top-ranked salons and stylists in your area with authentic post-visit feedback and seamless online scheduling.',
  },
]
