import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@velours.com' },
    update: {},
    create: {
      name: 'Velours Admin',
      email: 'admin@velours.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Regular User
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer@example.com',
      passwordHash: userPassword,
      role: 'USER',
    },
  });

  // Create Products
  const products = [
    {
      name: 'French Baguette Tradition',
      slug: 'french-baguette-tradition',
      description: 'Crispy outer shell with soft, chewy crumb baked according to authentic Parisian standards.',
      price: 10000,
      stock: 20,
      category: 'Artisan Bread',
      images: ['https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=600&auto=format&fit=crop'],
    },
    {
      name: 'Classic Butter Croissant',
      slug: 'classic-butter-croissant',
      description: 'Flaky, buttery, traditional French croissant baked fresh daily with pure Normandy butter.',
      price: 12000,
      stock: 40,
      category: 'Viennoiserie',
      images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop'],
    },
    {
      name: 'Pain au Chocolat',
      slug: 'pain-au-chocolat',
      description: 'Laminated pastry dough filled with rich 64% Valrhona dark chocolate bars.',
      price: 15000,
      stock: 30,
      category: 'Viennoiserie',
      images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&auto=format&fit=crop'],
    },
    {
      name: 'Almond Croissant',
      slug: 'almond-croissant',
      description: 'Twice-baked croissant filled with rich almond frangipane paste and topped with toasted sliced almonds.',
      price: 18000,
      stock: 25,
      category: 'Viennoiserie',
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop'],
    },
    {
      name: 'Artisanal Sourdough Loaf',
      slug: 'artisanal-sourdough-loaf',
      description: 'Naturally fermented for 36 hours with wild yeast starter, dark crispy crust, and open airy crumb.',
      price: 20000,
      stock: 15,
      category: 'Artisan Bread',
      images: ['https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop'],
    },
    {
      name: 'Brioche Nanterre',
      slug: 'brioche-nanterre',
      description: 'Ultra soft, rich enriched dough loaf made with fresh eggs and high fat french butter.',
      price: 25000,
      stock: 10,
      category: 'Enriched Bread',
      images: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop'],
    },
  ];

  for (const item of products) {
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
