const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const SellerProfile = require('../src/models/SellerProfile');
const Product = require('../src/models/Product');
const InventoryItem = require('../src/models/InventoryItem');
const Address = require('../src/models/Address');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const Review = require('../src/models/Review');

describe('Full Backend API Integration Suite', () => {
  let buyerToken, buyerUser;
  let sellerToken, sellerUser, sellerProfile;
  let adminToken, adminUser;
  let category, product;

  beforeEach(async () => {
    // 1. Create Buyer
    const buyerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Buyer Priya',
        email: 'buyer@example.com',
        phone: '9876543210',
        password: 'password123',
        role: 'BUYER',
      });
    buyerToken = buyerRes.body.data.accessToken;
    buyerUser = buyerRes.body.data.user;

    // 2. Create Seller & Profile
    const sellerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Seller Anita',
        email: 'seller@example.com',
        phone: '9876543211',
        password: 'password123',
        role: 'SELLER',
      });
    sellerToken = sellerRes.body.data.accessToken;
    sellerUser = sellerRes.body.data.user;

    sellerProfile = await SellerProfile.create({
      userId: sellerUser._id,
      shgName: 'Mahila Gram Udyog',
      description: 'Handcrafted bamboo products',
      location: { state: 'Assam', district: 'Kamrup' },
      verificationStatus: 'VERIFIED',
      isActive: true,
    });

    // 3. Create Admin
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: 'password123',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    const { signAccessToken } = require('../src/services/auth.service');
    adminToken = signAccessToken(adminUser._id, 'ADMIN');

    // 4. Create Category
    category = await Category.create({
      name: 'Bamboo Crafts',
      slug: 'bamboo-crafts',
      description: 'Traditional handcrafted bamboo products',
      active: true,
    });

    // 5. Create Product
    product = await Product.create({
      sellerId: sellerProfile._id,
      title: 'Handmade Bamboo Basket',
      description: 'Eco-friendly handwoven basket',
      categoryId: category._id,
      price: { amount: 350, currency: 'INR' },
      type: 'STANDARD',
      status: 'PUBLISHED',
    });

    await InventoryItem.create({
      productId: product._id,
      sku: `${product._id}-STD-1`,
      quantity: 50,
      reserved: 0,
      status: 'AVAILABLE',
    });
  });

  describe('User Profile & Session Routes', () => {
    it('PATCH /api/v1/users/me updates profile fields with 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Priya Sharma Updated',
          preferences: { language: 'hi' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Priya Sharma Updated');
      expect(res.body.data.user.preferences.language).toBe('hi');
    });

    it('PATCH /api/v1/users/me returns 400 when no fields provided', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_UPDATE_FIELDS');
    });

    it('PATCH /api/v1/users/me/password changes password with 200 OK', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBeDefined();
    });

    it('PATCH /api/v1/users/me/password returns 422 for short password', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'short',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/users/me/sessions returns list of sessions with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.sessions)).toBe(true);
    });
  });

  describe('Categories Routes', () => {
    it('GET /api/v1/categories returns list of active categories', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/categories auto-seeds defaults if collection is empty', async () => {
      await Category.deleteMany({});
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const seeded = await Category.find({});
      expect(seeded.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/category and /categories route aliases work', async () => {
      const res1 = await request(app).get('/api/v1/category');
      expect(res1.status).toBe(200);
      expect(Array.isArray(res1.body.data)).toBe(true);

      const res2 = await request(app).get('/categories');
      expect(res2.status).toBe(200);
      expect(Array.isArray(res2.body.data)).toBe(true);
    });

    it('GET /api/v1/categories?format=array returns direct array of categories', async () => {
      const res = await request(app).get('/api/v1/categories?format=array');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/categories/:id returns single category', async () => {
      const res = await request(app).get(`/api/v1/categories/${category._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Bamboo Crafts');
    });

    it('POST /api/v1/categories creates category as admin with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Clay Pottery',
          slug: 'clay-pottery',
          description: 'Handmade terracotta pottery',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Clay Pottery');
    });

    it('POST /api/v1/categories returns 403 Forbidden for non-admin', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'Clay Pottery' });

      expect(res.status).toBe(403);
    });
  });

  describe('Product Routes', () => {
    it('GET /api/v1/products returns catalog with 200 OK', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/products/samples returns dummy sample products linked to categories', async () => {
      const res = await request(app).get('/api/v1/products/samples');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      const titles = res.body.data.map((p) => p.title);
      expect(titles).toContain('Handwoven Bamboo Basket');
      expect(titles).toContain('Organic Cotton Scarf');
      expect(titles).toContain('Clay Pot Set');
    });

    it('GET /api/v1/products/:id returns product details', async () => {
      const res = await request(app).get(`/api/v1/products/${product._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Handmade Bamboo Basket');
    });

    it('POST /api/v1/products creates product as seller with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Handcrafted Cane Mat',
          description: '100% natural cane mat',
          categoryId: category._id.toString(),
          price: 499,
          quantity: 20,
          type: 'STANDARD',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Handcrafted Cane Mat');
      expect(res.body.data.price.amount).toBe(499);
    });

    it('POST /api/v1/products returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: '',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.title).toBeDefined();
    });

    it('PATCH /api/v1/products/:id/inventory updates inventory with 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${product._id}/inventory`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          quantity: 75,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(75);
    });

    it('POST /api/v1/products/:id/unique-item registers a unique item', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${product._id}/unique-item`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          attributes: { color: 'natural' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('AVAILABLE');
      expect(res.body.data.quantity).toBe(1);
    });
  });

  describe('Seller Routes', () => {
    it('GET /api/v1/sellers/:id allows public access to seller profile without auth', async () => {
      const res = await request(app).get(`/api/v1/sellers/${sellerProfile._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.shgName).toBe('Mahila Gram Udyog');
    });

    it('GET /api/v1/sellers/me returns authenticated seller profile with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shgName).toBe('Mahila Gram Udyog');
    });

    it('PATCH /api/v1/sellers/me updates seller profile', async () => {
      const res = await request(app)
        .patch('/api/v1/sellers/me')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          description: 'Updated SHG description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated SHG description');
    });

    it('GET /api/v1/sellers/me/dashboard returns seller dashboard stats with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.revenue).toBeDefined();
      expect(res.body.data.orders).toBeDefined();
      expect(res.body.data.products).toBeDefined();
      expect(res.body.data.rating).toBeDefined();
    });

    it('GET /api/v1/sellers/me/analytics returns seller analytics with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me/analytics')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.revenue).toBeDefined();
      expect(res.body.data.orders).toBeDefined();
      expect(Array.isArray(res.body.data.topProducts)).toBe(true);
      expect(Array.isArray(res.body.data.monthlyRevenue)).toBe(true);
    });

    it('GET /api/v1/sellers/me/products returns seller product list with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me/products')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('GET /api/v1/seller/orders returns seller orders with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/seller/orders')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('GET /api/v1/seller/dashboard alias works without 404', async () => {
      const res = await request(app)
        .get('/api/v1/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.revenue).toBeDefined();
    });
  });

  describe('Cart Routes', () => {
    it('GET /api/v1/cart returns user cart with items array', async () => {
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('POST /api/v1/cart/items adds an item to cart with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].quantity).toBe(2);
    });

    it('POST /api/v1/cart/items returns 422 if productId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          quantity: 2,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PATCH /api/v1/cart/items/:id updates item quantity', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const res = await request(app)
        .patch(`/api/v1/cart/items/${product._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(4);
    });

    it('DELETE /api/v1/cart/items/:id removes item from cart', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const res = await request(app)
        .delete(`/api/v1/cart/items/${product._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('POST /api/v1/cart/validate validates available stock', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const res = await request(app)
        .post('/api/v1/cart/validate')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
    });
  });

  describe('Address Routes', () => {
    let addressId;

    it('POST /api/v1/addresses creates an address with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          line1: 'House 42, Village Rampur',
          city: 'Guwahati',
          state: 'Assam',
          pincode: '781001',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.address).toBeDefined();
      expect(res.body.data.city).toBe('Guwahati');
      addressId = res.body.data.address._id;
    });

    it('POST /api/v1/addresses returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          line1: '',
          city: '',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.line1).toBeDefined();
    });

    it('GET /api/v1/addresses returns user addresses with 200 OK', async () => {
      await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          line1: '123 Main St',
          city: 'Dispur',
          state: 'Assam',
          pincode: '781005',
        });

      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Checkout and Orders End-to-End', () => {
    let address;

    beforeEach(async () => {
      address = await Address.create({
        userId: buyerUser._id,
        name: 'Priya Sharma',
        phone: '9876543210',
        line1: 'House 12, Ward 4',
        city: 'Guwahati',
        state: 'Assam',
        pincode: '781001',
      });
    });

    it('POST /api/v1/checkout/quote returns subtotal, taxes, shipping with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/quote')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 2 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subtotal).toBe(700);
      expect(res.body.data.total).toBeDefined();
    });

    it('POST /api/v1/checkout/create-order creates order with 201 Created and reserves inventory', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/create-order')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          addressId: address._id.toString(),
          items: [{ productId: product._id.toString(), quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order).toBeDefined();
      expect(res.body.data.order.status).toBe('PENDING_PAYMENT');
      expect(res.body.data.order.items.length).toBe(1);

      // Verify inventory reserved
      const inv = await InventoryItem.findOne({ productId: product._id });
      expect(inv.reserved).toBe(2);
    });

    it('POST /api/v1/orders/:id/reorder adds past order items to cart with 200 OK', async () => {
      const orderRes = await request(app)
        .post('/api/v1/checkout/create-order')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          addressId: address._id.toString(),
          items: [{ productId: product._id.toString(), quantity: 1 }],
        });

      const orderId = orderRes.body.data.order._id;

      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/reorder`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Items added to cart');
      expect(res.body.data.cart.items.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/orders/:id/cancel cancels order and releases reserved inventory', async () => {
      const orderRes = await request(app)
        .post('/api/v1/checkout/create-order')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          addressId: address._id.toString(),
          items: [{ productId: product._id.toString(), quantity: 2 }],
        });

      const orderId = orderRes.body.data.order._id;

      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Changed mind' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Verify inventory released
      const inv = await InventoryItem.findOne({ productId: product._id });
      expect(inv.reserved).toBe(0);
    });

    it('POST /api/v1/payments/create-intent creates payment intent with 201 Created', async () => {
      const orderRes = await request(app)
        .post('/api/v1/checkout/create-order')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          addressId: address._id.toString(),
          items: [{ productId: product._id.toString(), quantity: 1 }],
        });

      const orderId = orderRes.body.data.order._id;

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId });

      expect(res.status).toBe(201);
      expect(res.body.data.paymentId).toBeDefined();
      expect(res.body.data.amount).toBeDefined();
    });

    it('POST /api/v1/payments/create-intent returns 400 when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_ORDER_ID');
    });
  });

  describe('Reviews Routes', () => {
    it('GET /api/v1/products/:id/reviews returns reviews with 200 OK', async () => {
      const res = await request(app).get(`/api/v1/products/${product._id}/reviews`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/products/:id/reviews returns 422 if rating is missing or invalid', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${product._id}/reviews`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          orderId: '60c72b2f9b1d8b2bad000001',
          rating: 6,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Search and Discovery Routes', () => {
    it('GET /api/v1/search finds products with 200 OK', async () => {
      const res = await request(app).get('/api/v1/search?q=Basket');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/search/suggestions returns autocomplete suggestions with 200 OK', async () => {
      const res = await request(app).get('/api/v1/search/suggestions?q=Handmade');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/search/trending returns popular products with 200 OK', async () => {
      const res = await request(app).get('/api/v1/search/trending');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('AI Chat Route', () => {
    it('POST /api/v1/ai/chat returns intent classification and reply with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          message: 'Show me bamboo baskets under 500',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.intent).toBe('PRODUCT_SEARCH');
    });

    it('POST /api/v1/ai/chat returns 400 when message is empty', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_MESSAGE');
    });
  });

  describe('Admin Routes', () => {
    it('GET /api/v1/admin/stats returns platform statistics with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeDefined();
      expect(res.body.data.totalProducts).toBeDefined();
    });

    it('GET /api/v1/admin/sellers/pending returns pending sellers with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/sellers/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/products/pending returns pending products with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
