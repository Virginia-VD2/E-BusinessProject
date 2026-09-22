import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧹 Clearing old database records...');

  // Delete dependent records first
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.digitalReceipt.deleteMany().catch(() => {});
  await prisma.complaint.deleteMany().catch(() => {});
  await prisma.review.deleteMany().catch(() => {});
  await prisma.quotation.deleteMany().catch(() => {});
  await prisma.subscription.deleteMany().catch(() => {});
  await prisma.activityLog.deleteMany().catch(() => {});
  await prisma.customerPreference.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.cutOption.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  console.log('🐓 Seeding AYAMAJA Fresh Chicken database with explicit IDs...');

  // 1. Create Admin & Seller Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.create({
    data: {
      id: 'usr-admin',
      name: 'AYAMAJA Admin',
      email: 'admin@ayamaja.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      customerType: 'BUSINESS',
      businessName: 'AYAMAJA Head Office Minut',
    },
  });

  await prisma.user.create({
    data: {
      id: 'usr-seller',
      name: 'Mitra Seller Kalawat',
      email: 'seller@ayamaja.com',
      passwordHash: sellerPassword,
      role: 'SELLER',
      customerType: 'BUSINESS',
      businessName: 'Rumah Potong Ayam Kalawat',
      phone: '081234567890',
      address: 'Jl. Raya Manado-Bitung Km 12, Kalawat, Minahasa Utara',
    },
  });

  // 2. Create Customers
  await prisma.user.create({
    data: {
      id: 'usr-customer1',
      name: 'Nathan Tambuku',
      email: 'nathantambuku13@gmail.com',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      customerType: 'PERSONAL',
      phone: '082199887766',
      address: 'Perumahan Airmadidi Asri Blok C-12, Airmadidi, Minahasa Utara',
      loyaltyPoints: 120,
    },
  });

  await prisma.user.create({
    data: {
      id: 'usr-customer2',
      name: 'Resto Minahasa Jaya',
      email: 'warung.mbakani@gmail.com',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      customerType: 'BUSINESS',
      businessName: 'Resto Minahasa Jaya',
      phone: '085244332211',
      address: 'Jalan Utama Sukur, Kauditan, Minahasa Utara',
      loyaltyPoints: 450,
    },
  });

  // 3. Create AYAMAJA Products with explicit IDs matching storefront
  const productsData = [
    {
      id: 'prod-1',
      name: 'Ayam Broiler Segar (Per Kg)',
      slug: 'ayam-broiler-segar',
      description: 'Dipotong fresh setiap jam 04:00 WITA dari peternakan lokal Minahasa Utara. Bebas bahan pengawet.',
      pricePerKg: 36000,
      stockKg: 150.0,
      category: 'AYAM_SEGAR',
      images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80'],
    },
    {
      id: 'prod-2',
      name: 'Dada Ayam Fillet Segar',
      slug: 'dada-ayam-fillet',
      description: '100% daging dada ayam bersih tanpa tulang & lemak. Tinggi protein cocok untuk diet & resto.',
      pricePerKg: 48000,
      stockKg: 45.0,
      category: 'PART_CUT',
      images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80'],
    },
    {
      id: 'prod-3',
      name: 'Paha Ayam Segar (Paha Atas & Bawah)',
      slug: 'paha-ayam-segar',
      description: 'Juicy, gurih, dan tekstur empuk pas untuk ayam goreng krispi & bakar woku.',
      pricePerKg: 42000,
      stockKg: 60.0,
      category: 'PART_CUT',
      images: ['https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80'],
    },
    {
      id: 'prod-4',
      name: 'Hati & Ampela Ayam Segar (Per Pasang)',
      slug: 'hati-ampela-segar',
      description: 'Pilihan jeroan ayam bersih & segar dipotong subuh.',
      pricePerKg: 20000,
      stockKg: 30.0,
      category: 'JEROAN',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'],
    },
    {
      id: 'prod-5',
      name: 'Ayam Kampung Segar Utuh',
      slug: 'ayam-kampung-segar',
      description: 'Ayam kampung asli Minahasa Utara, daging manis gurih cocok untuk masakan khas Minahasa (Tinutuan / Woku).',
      pricePerKg: 65000,
      stockKg: 25.0,
      category: 'AYAM_KAMPUNG',
      images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80'],
    },
  ];

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }

  console.log('✅ Database AYAMAJA successfully reset & seeded with explicit IDs (prod-1 to prod-5)!');
  console.log('------------------------------------------------');
  console.log('Kredensial Login Testing AYAMAJA:');
  console.log('1. ADMIN : admin@ayamaja.com / admin123');
  console.log('2. SELLER: seller@ayamaja.com / seller123');
  console.log('3. USER  : nathantambuku13@gmail.com / user123');
  console.log('4. UMKM  : warung.mbakani@gmail.com / user123');
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
