import ProductOverview from '@/components/shadcn-studio/blocks/product-overview-05/product-overview-05'

const overviewData = [
  {
    name: 'Apple Watch Series 9 GPS + Cellular 45mm With Sport Band',
    inStock: true,
    stock: 254,
    totalReview: 1547,
    itemSold: 1204,
    rating: 4.5,
    price: 684,
    description:
      'The Apple Watch Series 9 (GPS + Cellular) - 45mm is a powerful smartwatch designed to keep you connected, active, and healthy. With an advanced S9 SiP chip, stunning Retina display, and a sleek, durable design, it offers seamless integration with your iPhone and the Apple ecosystem.',
    image1: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/product-overview/image-20.png',
    alt1: 'image-20',
    image2: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/product-overview/image-19.png',
    alt2: 'image-19',
    image3: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/product-overview/image-18.png',
    alt3: 'image-18',
    offers: [
      {
        title: 'No Cost EMI',
        context: 'Upto $10 EMI interest savings on Amazon pay ICICI',
        numberOfOffer: 1,
        href: '#'
      },
      {
        title: 'Bank Offer',
        context: 'Upto $30 Discount on select credit cards, select...',
        numberOfOffer: 28,
        href: '#'
      },
      {
        title: 'Partner Offers',
        context: 'Get GST invoice and save up to 28% on business...',
        numberOfOffer: 1,
        href: '#'
      }
    ],
    defaultSize: '46',
    defaultColorOption: 'black'
  }
]

const sizes = [
  {
    value: '42',
    label: '42'
  },
  {
    value: '46',
    label: '46'
  }
]

const colors = [
  {
    value: 'black',
    colorOption:
      'has-data-[state=checked]:outline-solid has-data-[state=checked]:outline has-data-[state=checked]:outline-offset-2 has-data-[state=checked]:outline-black bg-black'
  },
  {
    value: 'red',
    colorOption:
      'has-data-[state=checked]:outline-solid has-data-[state=checked]:outline has-data-[state=checked]:outline-offset-2 has-data-[state=checked]:outline-red-600 bg-red-600'
  },
  {
    value: 'green',
    colorOption:
      'has-data-[state=checked]:outline-solid has-data-[state=checked]:outline has-data-[state=checked]:outline-offset-2 has-data-[state=checked]:outline-green-800 bg-green-800'
  },
  {
    value: 'purple',
    colorOption:
      'has-data-[state=checked]:outline-solid has-data-[state=checked]:outline has-data-[state=checked]:outline-offset-2 has-data-[state=checked]:outline-purple-500 bg-purple-500 '
  },
  {
    value: 'pink',
    colorOption:
      'has-data-[state=checked]:outline-solid has-data-[state=checked]:outline has-data-[state=checked]:outline-offset-2 has-data-[state=checked]:outline-pink-500 bg-pink-500 '
  }
]

const ProductOverviewPage = () => {
  return <ProductOverview productItems={overviewData} sizesChart={sizes} colorsChart={colors} />
}

export default ProductOverviewPage
