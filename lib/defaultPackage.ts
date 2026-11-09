import { PackageData, BookletPageItem } from '@/types';

export const DEFAULT_BOOKLET_PAGES: BookletPageItem[] = [
  { id: 'cover', type: 'cover' },
  { id: 'story', type: 'story' },
  { id: 'scope', type: 'scope' },
  { id: 'deliverables', type: 'deliverables' },
  { id: 'terms', type: 'terms' },
  { id: 'delivery', type: 'delivery' },
  { id: 'policies', type: 'policies' },
  { id: 'contact', type: 'contact' },
];

export const DEFAULT_PACKAGE: PackageData = {
  title: 'Signature Wedding Proposal',
  coverImage:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  coverBrand: 'REELMAN',
  coverSubtitle: 'Production',
  coverFooterText: 'REELMAN PRODUCTION.',
  whoWeAreTitle: 'Who we are?',
  whoWeAreText:
    "Reelman Production is a team of passionate photographers dedicated to capturing life's most meaningful moments. With a blend of creativity, skill, and storytelling, we transform ordinary scenes into extraordinary memories. Whether it's a wedding, a corporate event, or a creative project, we bring a fresh perspective and an artistic touch to every shot. Let us turn your vision into timeless imagery.",
  whoWeAreFooter: 'Reelman Production',
  pricelistTitle: 'WEDDING',
  pricelistSubtitle: 'pricelist',
  deliverablesTitle: 'DELIVERABLES',
  events: [
    {
      name: 'PRE WEDDING',
      crew: ['One Photographer', 'One Filmmaker'],
    },
    {
      name: 'WEDDING DAY',
      crew: ['One Photographer', 'One Filmmaker'],
    },
  ],
  deliverables: [
    'Raw Images',
    'Edited Images',
    'Wedding Highlight',
    'Wedding Teaser',
    'Pre Wedding Film',
    'Insta Reel',
    'Online Gallery',
  ],
  totalAmount: '55,000/-',
  totalAmountLabel: 'Total Amount :',
  amountNote: '(Travel expenses will be an additional)',
  termsTitle: 'Terms and Conditions',
  terms: [
    {
      title: 'Booking Confirmation',
      description:
        'A booking is considered confirmed only after a non-refundable deposit were received.',
    },
    {
      title: 'Deposit',
      description:
        'A non-refundable deposit of 25% is required to secure the booking. This deposit must be paid at the time of booking to confirm the services.',
    },
    {
      title: 'Payment on Wedding Day',
      description:
        'On the day of the wedding, the client is required to pay 65% of the total agreed-upon fee.',
    },
    {
      title: 'Final Payment (After Delivery)',
      description:
        'Upon delivery of the final edited photos and video, the client agrees to pay the remaining 10% of the total fee. This payment must be made after the delivery of the final work.',
    },
  ],
  deliveriesTitle: 'Delivery Timelines',
  deliveries: [
    {
      title: 'Delivery of Key Photos',
      description:
        'The client will receive the following key photos as part of the final deliverables:\n• Single Photo\n• Couple Photo\n• Main Family Photo\n• Reel\nThese key photos will be delivered within 2 Days after the wedding day.',
    },
    {
      title: 'Full file Delivery',
      description:
        'The full set of final photo and video will be delivered within 1 month following the wedding day.',
    },
    {
      title: 'Delivery Method',
      description:
        'The final edited images will be delivered via online gallery, USB drive (Additional charge applied). A link to access the online gallery will be provided to the client upon delivery.',
    },
  ],
  policiesTitle: 'Additional Requests',
  policies: [
    'The client collect all final data and responsible for saving and backing up their image.',
    'Reelman Production will store the final images for a period of up to 3 months from the date the images are made available to the client. After this period, Reelman Production will not be responsible for any loss or damage to the data.',
    'If the client fails to follow the terms and conditions, Reelman Production reserves the right to take appropriate action.',
    'It is mandatory that the couple has to provide half an hour time for the crew for shoot before and after the wedding.',
    'Accommodation (Standard AC Room) and travel expenses should be included based on distance.',
    'Coverage for the evening function is limited up to 10:30 PM only. The photographer/team will not stay beyond 10:30 PM. Any extension in timing will be subject to prior discussion and additional charges.',
  ],
  getInTouchTitle: 'Get in Touch',
  contactWebsite: 'www.reelmanproduction.com',
  contactPhones: ['8848164440', '9895943440'],
  tagline: 'REEL OF MEMORIES, REAL EMOTIONS',
  headlineFont: 'Cormorant Garamond',
  scriptFont: 'Alex Brush',
  bodyFont: 'Montserrat',
  headlineFontWeight: '400',
  scriptFontWeight: '400',
  bodyFontWeight: '400',
  headlineItalic: false,
  scriptItalic: false,
  bodyItalic: false,
  headlineFontSize: 'base',
  bodyFontSize: 'base',
  pagesList: DEFAULT_BOOKLET_PAGES,
  pageBackgrounds: {},
};
