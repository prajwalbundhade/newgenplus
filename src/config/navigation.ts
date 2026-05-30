/**
 * Navigation configuration for the public site.
 *
 * Data-driven so the header and footer render from a single declaration.
 * Links reference the central route map.
 */
import { routes } from '@/config/routes'

export interface NavLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: NavLink[]
}

/** Primary header navigation. */
export const primaryNav: NavLink[] = [
  { label: 'Explore', href: routes.home },
  { label: 'Search', href: routes.search() },
]

/** Footer link columns. */
export const footerNav: FooterColumn[] = [
  {
    title: 'Discover',
    links: [
      { label: 'Explore', href: routes.home },
      { label: 'Search', href: routes.search() },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: routes.about },
      { label: 'Contact', href: routes.contact },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: routes.privacy },
      { label: 'Terms', href: routes.terms },
    ],
  },
]
