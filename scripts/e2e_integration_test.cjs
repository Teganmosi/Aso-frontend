const http = require('http');

const BASE_URL = 'http://127.0.0.1:8000';
const API_PREFIX = '/api/v1';

class TestClient {
  constructor() {
    this.cookies = {};
    this.csrfToken = null;
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  saveCookies(headers) {
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      setCookie.forEach((cookieStr) => {
        const parts = cookieStr.split(';')[0].split('=');
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        this.cookies[key] = val;
        if (key === 'csrftoken') {
          this.csrfToken = val;
        }
      });
    }
  }

  async request(method, path, body = null, extraHeaders = {}) {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${API_PREFIX}${path}`);
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': this.getCookieString(),
      'Origin': 'http://127.0.0.1:8000',
      'Referer': 'http://127.0.0.1:8000/',
      ...extraHeaders,
    };

    if (this.csrfToken && !headers['X-CSRFToken'] && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['X-CSRFToken'] = this.csrfToken;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    return new Promise((resolve, reject) => {
      const req = http.request(
        url,
        {
          method,
          headers,
        },
        (res) => {
          this.saveCookies(res.headers);
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed = data;
            try {
              parsed = JSON.parse(data);
            } catch (e) {}
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsed,
            });
          });
        }
      );

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 STARTING ASO MARKETPLACE E2E INTEGRATION SUITE');
  console.log('====================================================\n');

  const results = [];
  const logTest = (id, name, pass, evidence, error = null) => {
    results.push({ id, name, pass, evidence, error });
    console.log(`[${pass ? '✅ PASS' : '❌ FAIL'}] ${id}: ${name}`);
    if (evidence) console.log(`   Evidence: ${JSON.stringify(evidence).substring(0, 150)}...`);
    if (error) console.log(`   Error: ${JSON.stringify(error)}`);
    console.log('');
  };

  const client = new TestClient();

  try {
    // -------------------------------------------------------------
    // PHASE 1: CSRF & AUTHENTICATION (C-01)
    // -------------------------------------------------------------
    console.log('--- Phase 1: CSRF & Customer Account (C-01) ---');
    const csrfRes = await client.request('GET', '/auth/csrf/');
    const csrfToken = csrfRes.data?.csrfToken || csrfRes.data?.csrf_token || client.csrfToken;
    if (csrfToken) {
      client.csrfToken = csrfToken;
    }
    logTest('C-01.1', 'Fetch CSRF Token', csrfRes.status === 200 && !!client.csrfToken, {
      status: csrfRes.status,
      hasToken: !!client.csrfToken,
    });

    const timestamp = Date.now();
    const customerEmail = `customer_${timestamp}@testaso.com`;
    const customerPhone = `080${Math.floor(10000000 + Math.random() * 90000000)}`;
    const customerPassword = 'TestPassword123!';

    const regRes = await client.request('POST', '/auth/register/', {
      email: customerEmail,
      password: customerPassword,
      first_name: 'Adewale',
      last_name: 'Bakare',
      phone_number: customerPhone,
    });
    console.log('   Registration Response:', JSON.stringify(regRes.data));
    logTest('C-01.2', 'Customer Registration', [200, 201].includes(regRes.status), {
      status: regRes.status,
      user: regRes.data?.user?.email || regRes.data?.email || regRes.data,
    });

    const loginRes = await client.request('POST', '/auth/login/', {
      email: customerEmail,
      password: customerPassword,
    });
    console.log('   Login Response:', JSON.stringify(loginRes.data));
    logTest('C-01.3', 'Customer Login & Session Cookie', loginRes.status === 200, {
      status: loginRes.status,
      sessionCookie: !!client.cookies['sessionid'],
      user: loginRes.data?.user?.first_name,
    });

    const meRes = await client.request('GET', '/me/');
    logTest('C-01.4', 'Session Persistence (GET /me/)', meRes.status === 200, {
      status: meRes.status,
      email: meRes.data?.email || meRes.data?.user?.email,
      is_vendor: meRes.data?.is_vendor ?? meRes.data?.user?.is_vendor,
    });

    // Add delivery address
    const addrRes = await client.request('POST', '/auth/addresses/', {
      full_name: 'Adewale Bakare',
      phone_number: customerPhone,
      street_address: '14 Victoria Island Boulevard',
      city: 'Lagos',
      state: 'Lagos',
      landmark: 'Near Eko Hotel',
      is_default: true,
    });
    const createdAddress = addrRes.data?.address || addrRes.data;
    const addressId = createdAddress?.id;
    logTest('C-01.5', 'Create Shipping Address', [200, 201].includes(addrRes.status) && !!addressId, {
      status: addrRes.status,
      addressId,
      city: createdAddress?.city,
    });

    // -------------------------------------------------------------
    // PHASE 2: MARKETPLACE DISCOVERY (C-02)
    // -------------------------------------------------------------
    console.log('--- Phase 2: Marketplace Discovery (C-02) ---');
    const productsRes = await client.request('GET', '/products/');
    const productsList = Array.isArray(productsRes.data)
      ? productsRes.data
      : productsRes.data?.products || productsRes.data?.results || [];

    logTest('C-02.1', 'Catalog Discovery from DB', productsRes.status === 200 && productsList.length > 0, {
      status: productsRes.status,
      count: productsList.length,
      sampleProduct: productsList[0]?.title,
      sampleVendor: productsList[0]?.vendor?.store_name,
      samplePrice: productsList[0]?.base_price_naira,
    });

    // Group products by vendor
    const productsByVendor = {};
    for (const p of productsList) {
      const vId = p.vendor?.id || p.vendor?.store_name || 'unknown';
      if (!productsByVendor[vId]) productsByVendor[vId] = [];
      productsByVendor[vId].push(p);
    }
    const vendorKeys = Object.keys(productsByVendor);
    console.log(`   Found ${vendorKeys.length} distinct vendors with live products.`);

    const firstProduct = productsList[0];
    const productDetailRes = await client.request('GET', `/products/${firstProduct.slug || firstProduct.id}/`);
    const productDetail = productDetailRes.data?.product || productDetailRes.data;
    logTest('C-02.2', 'Product Detail & Real Variants', productDetailRes.status === 200, {
      status: productDetailRes.status,
      title: productDetail?.title,
      variantsCount: productDetail?.variants?.length || 0,
      vendor: productDetail?.vendor?.store_name,
    });

    // Find variant with stock for checkout
    let targetVariantId = null;
    let targetProduct = null;
    if (productDetail?.variants && productDetail.variants.length > 0) {
      const activeVariant = productDetail.variants.find((v) => v.stock_quantity > 0) || productDetail.variants[0];
      targetVariantId = activeVariant.id;
      targetProduct = productDetail;
    } else {
      // Look through other products for a variant
      for (const p of productsList) {
        const pRes = await client.request('GET', `/products/${p.slug || p.id}/`);
        const pd = pRes.data?.product || pRes.data;
        if (pd?.variants && pd.variants.length > 0) {
          const av = pd.variants.find((v) => v.stock_quantity > 0) || pd.variants[0];
          targetVariantId = av.id;
          targetProduct = pd;
          break;
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 3: CART & MULTI-VENDOR CONSTRAINTS (C-03)
    // -------------------------------------------------------------
    console.log('--- Phase 3: Cart Authority & Single-Vendor Constraint (C-03) ---');
    if (targetVariantId) {
      const addCartRes = await client.request('POST', '/cart/items/', {
        variant_id: targetVariantId,
        quantity: 1,
      });
      logTest('C-03.1', 'Add Item to Cart (POST /cart/items/)', [200, 201].includes(addCartRes.status), {
        status: addCartRes.status,
        cartData: addCartRes.data,
      });

      const getCartRes = await client.request('GET', '/cart/');
      const cartItems = getCartRes.data?.data?.items || getCartRes.data?.items || [];
      logTest('C-03.2', 'Cart Persistence (GET /cart/)', getCartRes.status === 200, {
        status: getCartRes.status,
        itemsCount: cartItems.length,
        subtotal: getCartRes.data?.data?.subtotal_naira || getCartRes.data?.subtotal_naira,
      });

      // Test Multi-Vendor Rejection: Attempt adding product from a DIFFERENT vendor
      if (vendorKeys.length >= 2) {
        const otherVendorId = vendorKeys.find((v) => v !== (targetProduct.vendor?.id || targetProduct.vendor?.store_name));
        const otherProduct = productsByVendor[otherVendorId][0];
        const otherDetailRes = await client.request('GET', `/products/${otherProduct.slug || otherProduct.id}/`);
        const otherDetail = otherDetailRes.data?.product || otherDetailRes.data;
        const otherVariant = otherDetail?.variants?.[0];

        if (otherVariant) {
          const multiVendorRes = await client.request('POST', '/cart/items/', {
            variant_id: otherVariant.id,
            quantity: 1,
          });
          logTest('C-03.3', 'Single-Vendor Enforcement (Server Rejects Multi-Vendor Cart)', multiVendorRes.status === 400, {
            status: multiVendorRes.status,
            expected: '400 Bad Request',
            detail: multiVendorRes.data?.detail || multiVendorRes.data?.message || multiVendorRes.data,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 4: CHECKOUT & AUTHORITATIVE PRICING (C-04)
    // -------------------------------------------------------------
    console.log('--- Phase 4: Authoritative Order Creation & Checkout (C-04) ---');
    let createdOrder = null;
    if (addressId) {
      const orderRes = await client.request('POST', '/orders/', {
        address_id: addressId,
      });
      createdOrder = orderRes.data?.data || orderRes.data?.order || orderRes.data;
      logTest('C-04.1', 'Server-Authoritative Order Creation (POST /orders/)', [200, 201].includes(orderRes.status), {
        status: orderRes.status,
        orderNumber: createdOrder?.order_number,
        orderStatus: createdOrder?.order_status,
        subtotal: createdOrder?.subtotal_naira,
        deliveryFee: createdOrder?.delivery_fee_naira,
        totalAmount: createdOrder?.total_amount_naira,
      });
    }

    // -------------------------------------------------------------
    // PHASE 5: PAYSTACK PAYMENT INITIALIZATION (C-05)
    // -------------------------------------------------------------
    console.log('--- Phase 5: Paystack Payment Flow (C-05) ---');
    if (createdOrder?.id) {
      const payInitRes = await client.request('POST', '/payments/initialize/', {
        order_id: createdOrder.id,
      });
      const payData = payInitRes.data?.data || payInitRes.data;
      logTest('C-05.1', 'Paystack Transaction Initialization', [200, 201].includes(payInitRes.status) && !!payData?.reference, {
        status: payInitRes.status,
        reference: payData?.reference,
        authorizationUrl: payData?.authorization_url ? payData.authorization_url.substring(0, 60) + '...' : null,
        amountKobo: payData?.amount_kobo,
      });

      // Verify order detail from server
      const orderDetailRes = await client.request('GET', `/orders/${createdOrder.id}/`);
      const fetchedOrder = orderDetailRes.data?.data || orderDetailRes.data;
      logTest('C-05.2', 'Customer Order Detail & Address Snapshot', orderDetailRes.status === 200, {
        status: orderDetailRes.status,
        orderStatus: fetchedOrder?.order_status,
        itemsCount: fetchedOrder?.items?.length,
        addressSnapshot: fetchedOrder?.shipping_address_snapshot?.street_address,
      });

      // State Machine Enforcement: Attempt illegal status transition on unpaid order
      const illegalTransitionRes = await client.request('POST', `/orders/${createdOrder.id}/ready/`);
      logTest('OM-01', 'State Machine Blocks Illegal Transition (UNPAID -> READY)', [400, 403].includes(illegalTransitionRes.status), {
        status: illegalTransitionRes.status,
        expected: '400 Bad Request or 403 Forbidden',
        detail: illegalTransitionRes.data?.detail || illegalTransitionRes.data?.error || illegalTransitionRes.data,
      });
    }

    // -------------------------------------------------------------
    // PHASE 6: DESIGNER APPLICATION LIFECYCLE (V-01)
    // -------------------------------------------------------------
    console.log('--- Phase 6: Designer Application Lifecycle & Dynamic Status (V-01) ---');
    const designerClient = new TestClient();
    await designerClient.request('GET', '/auth/csrf/');

    const vendorEmail = `designer_${timestamp}@testaso.com`;
    const vendorPhone = `081${Math.floor(10000000 + Math.random() * 90000000)}`;
    const vendorRegRes = await designerClient.request('POST', '/auth/register/', {
      email: vendorEmail,
      password: 'DesignerPassword123!',
      first_name: 'Folake',
      last_name: 'Coker',
      phone_number: vendorPhone,
    });

    const vendorLoginRes = await designerClient.request('POST', '/auth/login/', {
      email: vendorEmail,
      password: 'DesignerPassword123!',
    });

    // Apply as a designer
    const appRes = await designerClient.request('POST', '/vendors/register/', {
      store_name: `Tiffany Amber Atelier ${timestamp}`,
      description: 'Luxury ready-to-wear and bespoke ceremonial couture.',
      city: 'Lagos',
      state: 'Lagos',
      workshop_address: '22 Victoria Island Crescent',
      landmark: 'Beside Civic Centre',
      instagram_handle: '@tiffanyamber_ng',
      kyc_tier: 'TIER_2_VERIFIED',
    });

    const vendorMeRes = await designerClient.request('GET', '/me/');
    const vendorMe = vendorMeRes.data?.user || vendorMeRes.data;
    const vendorStatus = vendorMe?.vendor_profile?.status;

    logTest('V-01.1', 'Designer Application & PENDING Status', [200, 201].includes(appRes.status) && vendorStatus === 'PENDING', {
      status: appRes.status,
      vendorStatus: vendorStatus,
      storeName: vendorMe?.vendor_profile?.store_name,
    });

    // -------------------------------------------------------------
    // PHASE 7: MULTI-TENANT ISOLATION & PERMISSION GUARDS (T-11)
    // -------------------------------------------------------------
    console.log('--- Phase 7: Multi-Tenant Vendor Resource Isolation (T-11) ---');
    // Normal customer attempts to access vendor dashboard endpoints
    const forbiddenVendorProducts = await client.request('GET', '/vendor/products/');
    logTest('T-11.1', 'Customer Blocked from Vendor Products (403 Forbidden)', forbiddenVendorProducts.status === 403, {
      status: forbiddenVendorProducts.status,
      expected: '403 Forbidden',
    });

    // Customer attempts to mutate order as a vendor
    if (createdOrder?.id) {
      const unauthorizedAccept = await client.request('POST', `/orders/${createdOrder.id}/accept/`);
      logTest('T-11.2', 'Customer Blocked from Accepting Order (400/403 Backend Ownership Check)', [400, 403].includes(unauthorizedAccept.status), {
        status: unauthorizedAccept.status,
        expected: '400 Bad Request or 403 Forbidden',
        detail: unauthorizedAccept.data?.detail || unauthorizedAccept.data?.error || unauthorizedAccept.data,
      });
    }

    // -------------------------------------------------------------
    // PHASE 8: FINANCIAL INVARIANT GUARDS (T-15)
    // -------------------------------------------------------------
    console.log('--- Phase 8: Financial Invariant & Payout Isolation (T-15) ---');
    const customerPayoutAttempt = await client.request('POST', '/payouts/withdraw/', {
      amount_kobo: 5000000,
    });
    logTest('T-15.1', 'Customer Blocked from Payout Withdrawal (403 Forbidden)', customerPayoutAttempt.status === 403, {
      status: customerPayoutAttempt.status,
      expected: '403 Forbidden',
    });

    const customerBalanceCheck = await client.request('GET', '/payouts/balance/');
    logTest('T-15.2', 'Customer Blocked from Vendor Balance (403 Forbidden)', customerBalanceCheck.status === 403, {
      status: customerBalanceCheck.status,
      expected: '403 Forbidden',
    });

  } catch (err) {
    console.error('Test suite caught unhandled exception:', err);
  }

  console.log('\n====================================================');
  console.log('🏁 ASO MARKETPLACE E2E TEST SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter((r) => r.pass).length;
  console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}\n`);

  return results;
}

runE2ETests().then(() => process.exit(0));
