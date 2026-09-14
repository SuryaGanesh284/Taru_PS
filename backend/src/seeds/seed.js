const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const bcrypt = require('bcryptjs');

const SEED_CATEGORIES = [
  {
    name: 'Bamboo Crafts',
    slug: 'bamboo-crafts',
    description: 'Eco-friendly bamboo and cane baskets, homeware, furniture, and handicrafts',
    sortOrder: 1,
    active: true,
  },
  {
    name: 'Handloom',
    slug: 'handloom',
    description: 'Traditional handloom fabrics, sarees, dupattas, scarves, and artisanal textiles',
    sortOrder: 2,
    active: true,
  },
  {
    name: 'Organic Food',
    slug: 'organic-food',
    description: 'Naturally grown grains, pulses, spices, organic pickles, and raw forest honey',
    sortOrder: 3,
    active: true,
  },
  {
    name: 'Pottery',
    slug: 'pottery',
    description: 'Handcrafted clay cookware, terracotta pottery, and ceramic kitchenware',
    sortOrder: 4,
    active: true,
  },
  {
    name: 'Handicrafts',
    slug: 'handicrafts',
    description: 'Traditional handcrafted items, artisan creations, and rustic home decor',
    sortOrder: 5,
    active: true,
  },
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Handmade ethnic jewellery, brass ornaments, terracotta beads, and tribal necklaces',
    sortOrder: 6,
    active: true,
  },
  {
    name: 'Jute Crafts',
    slug: 'jute-crafts',
    description: 'Sustainable jute bags, wall hangings, table runners, and braided mats',
    sortOrder: 7,
    active: true,
  },
  {
    name: 'Woodcrafts',
    slug: 'woodcrafts',
    description: 'Hand-carved wooden sculptures, kitchen utilities, and traditional artifacts',
    sortOrder: 8,
    active: true,
  },
];

async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });
  console.log('Connected to MongoDB successfully!');

  // 1. Seed Categories
  console.log('Seeding categories...');
  const categoryMap = {};
  for (const catData of SEED_CATEGORIES) {
    const category = await Category.findOneAndUpdate(
      { slug: catData.slug },
      { $set: catData },
      { upsert: true, new: true }
    );
    categoryMap[category.slug] = category;
    categoryMap[category.name] = category;
    console.log(` - Category: ${category.name} (${category.slug}) [${category._id}]`);
  }

  // 2. Seed / Find Seller User & Profile
  console.log('Setting up seller user and profile...');
  let sellerUser = await User.findOne({
    $or: [
      { role: 'SELLER' },
      { role: 'seller' },
      { email: 'lakshmi123@gmail.com' },
      { email: 'seller@taru.org' },
    ],
  });

  if (!sellerUser) {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    sellerUser = await User.create({
      name: 'Radha Devi (Artisan)',
      email: 'seller@taru.org',
      phone: '9876543210',
      passwordHash,
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    });
    console.log(` - Created new seller user: ${sellerUser.name} (${sellerUser.email})`);
  } else {
    // Ensure role is uppercase SELLER
    if (sellerUser.role !== 'SELLER') {
      sellerUser.role = 'SELLER';
      await sellerUser.save();
    }
    console.log(` - Using existing seller user: ${sellerUser.name} (${sellerUser.email})`);
  }

  let sellerProfile = await SellerProfile.findOne({ userId: sellerUser._id });
  if (!sellerProfile) {
    sellerProfile = await SellerProfile.create({
      userId: sellerUser._id,
      shgName: 'Gramin Vikas Self Help Group',
      description: 'Artisan cooperative producing authentic handcrafted rural products, handloom textiles, and organic crafts.',
      location: {
        village: 'Rampur',
        district: 'Kamrup',
        state: 'Assam',
        pincode: '781001',
      },
      contactPhone: sellerUser.phone || '9876543210',
      contactEmail: sellerUser.email,
      verificationStatus: 'VERIFIED',
      isActive: true,
    });
    console.log(` - Created seller profile: ${sellerProfile.shgName}`);
  } else {
    sellerProfile.verificationStatus = 'VERIFIED';
    sellerProfile.isActive = true;
    await sellerProfile.save();
    console.log(` - Verified existing seller profile: ${sellerProfile.shgName}`);
  }

  // 3. Seed Dummy Products
  console.log('Seeding dummy products...');
  const bambooCat = categoryMap['bamboo-crafts'] || categoryMap['Bamboo Crafts'];
  const handloomCat = categoryMap['handloom'] || categoryMap['Handloom'];
  const potteryCat = categoryMap['pottery'] || categoryMap['Pottery'];

  // Clean up any stale product with null slug from previous incomplete seed
  await Product.deleteMany({ slug: null });

  const DUMMY_PRODUCTS_TO_SEED = [
    {
      title: 'Handwoven Bamboo Basket',
      slug: 'handwoven-bamboo-basket',
      categoryId: bambooCat._id,
      price: { amount: 450, currency: 'INR' },
      type: 'STANDARD',
      status: 'PUBLISHED',
      quantity: 25,
      description: 'Eco-friendly handwoven basket crafted from natural bamboo by skilled artisans. Durable, lightweight, and versatile for everyday storage or home decor.',
      tags: ['bamboo', 'crafts', 'handmade', 'basket', 'eco-friendly'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800',
          altText: 'Handwoven Bamboo Basket',
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: 'Organic Cotton Scarf',
      slug: 'organic-cotton-scarf',
      categoryId: handloomCat._id,
      price: { amount: 650, currency: 'INR' },
      type: 'STANDARD',
      status: 'PUBLISHED',
      quantity: 15,
      description: 'Finely woven organic cotton scarf made on traditional wooden handlooms with natural plant-based dyes. Soft, breathable, and sustainably crafted.',
      tags: ['handloom', 'organic', 'cotton', 'scarf', 'textile'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
          altText: 'Organic Cotton Scarf',
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: 'Clay Pot Set',
      slug: 'clay-pot-set',
      categoryId: potteryCat._id,
      price: { amount: 550, currency: 'INR' },
      type: 'STANDARD',
      status: 'PUBLISHED',
      quantity: 20,
      description: 'Artisanal terracotta clay pot set made by traditional potters. Natural non-toxic cookware that retains heat and enhances food flavor.',
      tags: ['pottery', 'clay', 'terracotta', 'cookware', 'handmade'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
          altText: 'Clay Pot Set',
          isPrimary: true,
          order: 0,
        },
      ],
    },
  ];

  for (const prodData of DUMMY_PRODUCTS_TO_SEED) {
    const { quantity, ...productFields } = prodData;
    let product = await Product.findOne({
      $or: [{ slug: productFields.slug }, { title: productFields.title, sellerId: sellerProfile._id }],
    });

    if (!product) {
      product = await Product.create({
        ...productFields,
        sellerId: sellerProfile._id,
        publishedAt: new Date(),
      });
      console.log(` - Created product: ${product.title} (ID: ${product._id})`);
    } else {
      Object.assign(product, productFields);
      product.status = 'PUBLISHED';
      await product.save();
      console.log(` - Updated product: ${product.title} (ID: ${product._id})`);
    }

    // Ensure InventoryItem
    const sku = `${product._id.toString().slice(-6).toUpperCase()}-STD-1`;
    await InventoryItem.findOneAndUpdate(
      { productId: product._id },
      {
        $set: {
          productId: product._id,
          sku,
          quantity: quantity || 20,
          reserved: 0,
          status: 'AVAILABLE',
        },
      },
      { upsert: true, new: true }
    );
    console.log(`   Inventory SKU ${sku} updated (Qty: ${quantity || 20})`);
  }

  // Update Category productCount
  for (const catId of [bambooCat._id, handloomCat._id, potteryCat._id]) {
    const count = await Product.countDocuments({ categoryId: catId, status: 'PUBLISHED' });
    await Category.findByIdAndUpdate(catId, { productCount: count });
  }

  console.log('\nSeeding completed successfully!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, SEED_CATEGORIES };
