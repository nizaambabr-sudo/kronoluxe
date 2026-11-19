const SUPABASE_URL = "https://xklzrtugimsojteulfdk.supabase.co";
const SUPABASE_KEY = "sb_publishable_1X66XjofPFkRecMAhw_V_w_mErtJyz8";
const WA_NUMBER = "917416990870";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = [];
let curCat = 'All';
let curCountry = 'India';
let curCode = 'INR';
let curSymbol = '₹';
let curRate = 1;

function hidePreloader() {
  const wel = document.getElementById('welcome');
  if (wel && !wel.classList.contains('hide')) {
    wel.classList.add('hide');
  }
}
setTimeout(hidePreloader, 3500);

function openCountryModal() {
  document.getElementById('countryModal').style.display = 'flex';
}

function closeCountryModal() {
  document.getElementById('countryModal').style.display = 'none';
}

function formatCurrency(inrPrice) {
  const base = parseFloat(String(inrPrice).replace(/[^0-9.]/g, '')) || 0;
  const val = curRate === 1 ? base : (curRate < 0.008 ? (base * curRate).toFixed(2) : Math.round(base * curRate));
  return curSymbol + Number(val).toLocaleString('en-IN');
}

function setCountry(countryName, code, symbol, rate) {
  curCountry = countryName;
  curCode = code;
  curSymbol = symbol;
  curRate = rate;
  closeCountryModal();
  document.getElementById('topRegionBtn').innerText = `${code} (${symbol.trim()})`;
  render();
}

function extractGallery(p) {
  let list = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    list = p.images.filter(Boolean);
  }
  const rawMain = p.Img || p.img || p.image_url || '';
  if (list.length === 0 && rawMain) {
    if (rawMain.trim().startsWith('[')) {
      try { list = JSON.parse(rawMain).filter(Boolean); } catch (e) { list = [rawMain]; }
    } else if (rawMain.includes('||')) {
      list = rawMain.split('||').map(s => s.trim()).filter(Boolean);
    } else {
      list = [rawMain];
    }
  }
  return list;
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: false });

  if (error || !data) {
    document.getElementById('list').innerHTML = '<p class="status-msg">ARCHIVE TEMPORARILY UNAVAILABLE.</p>';
    hidePreloader();
    return;
  }

  allProducts = data.map(p => {
    const gallery = extractGallery(p);
    return {
      ...p,
      gallery: gallery,
      img: gallery[0] || ''
    };
  });

  render();
  setTimeout(hidePreloader, 300);
}

function optimizeImgUrl(rawSrc) {
  if (!rawSrc) return '';
  if (rawSrc.startsWith('http') && !rawSrc.includes('wsrv.nl') && !rawSrc.includes('supabase.co')) {
    return 'https://wsrv.nl/?url=' + encodeURIComponent(rawSrc) + '&w=900&q=88&output=webp';
  }
  return rawSrc;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function defaultCraftSpecs(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('watch')) return "Precision-crafted timepiece featuring scratch-resistant crystal glass, weighted luxury casing, and signature KRONOLUXE double-layer vault presentation.";
  if (c.includes('perfume')) return "High-concentration extrait de parfum formulated with rare aromatic oils for commanding projection and all-day longevity.";
  if (c.includes('daily') || c.includes('shoe')) return "Limited-archive silhouette crafted with premium textured uppers, cushioned architectural sole, and collector's dust-bag packaging.";
  return "Authenticated KRONOLUXE archive edition, complete with multi-point quality inspection and royal double-layer protective sealing.";
}

function render() {
  const s = (document.getElementById('search')?.value || '').trim().toLowerCase();
  const filtered = allProducts.filter(p => {
    const pCat = String(p.cat || p.category || '').toLowerCase();
    const catOk = curCat === 'All' || pCat.includes(curCat.toLowerCase());
    const pName = String(p.name || '').toLowerCase();
    return catOk && (!s || pName.includes(s) || pCat.includes(s));
  });

  if (filtered.length === 0) {
    document.getElementById('list').innerHTML = '<p class="status-msg">NO PIECES FOUND IN THIS COLLECTION.</p>';
    return;
  }

  const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%230c0c0c'/%3E%3Ctext x='50%25' y='50%25' fill='%23c5a059' font-family='serif' font-size='12' text-anchor='middle'%3EKRONOLUXE%3C/text%3E%3C/svg%3E";

  document.getElementById('list').innerHTML = filtered.map(p => {
    const finalImg = optimizeImgUrl(p.img) || placeholder;
    const secondImg = p.gallery && p.gallery[1] ? optimizeImgUrl(p.gallery[1]) : '';
    const safeTitle = escapeHtml((p.name || '').toUpperCase());
    const displayPrice = formatCurrency(p.price);
    const angleCount = p.gallery ? p.gallery.length : 1;

    return `
      <div class="card">
        <div class="card-img-wrap" onclick="openProductModal('${p.id}')"
             ${secondImg ? `onmouseenter="this.querySelector('img').src='${secondImg}'" onmouseleave="this.querySelector('img').src='${finalImg}'"` : ''}>
          <img id="img-${p.id}" src="${finalImg}" alt="${safeTitle}" loading="lazy">
          
        </div>
        <h3>${safeTitle}</h3>
        <div class="price">${displayPrice}</div>
        <button class="order" onclick="openProductModal('${p.id}')">Explore & Acquire</button>
      </div>`;
  }).join('');
}

function filterCat(c, btn) {
  curCat = c;
  document.querySelectorAll('.cats button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function openProductModal(id) {
  const prod = allProducts.find(p => String(p.id) === String(id));
  if (!prod) return;

  const gallery = prod.gallery && prod.gallery.length ? prod.gallery : [prod.img];
  const mainImg = document.getElementById("modalImage");
  mainImg.src = gallery[0] ? optimizeImgUrl(gallery[0]) : '';

  const thumbContainer = document.getElementById("modalThumbs");
  if (gallery.length > 1) {
    thumbContainer.style.display = "flex";
    thumbContainer.innerHTML = gallery.map((imgUrl, idx) => {
      const cleanUrl = optimizeImgUrl(imgUrl);
      return `<img src="${cleanUrl}" class="${idx === 0 ? 'active' : ''}" onclick="switchModalAngle(this, '${cleanUrl}')" alt="Angle ${idx + 1}">`;
    }).join('');
  } else {
    thumbContainer.style.display = "none";
    thumbContainer.innerHTML = "";
  }

  document.getElementById("modalEditionTag").innerText = `KRONOLUXE ARCHIVE • REF #${prod.id}`;
  document.getElementById("modalTitle").innerText = (prod.name || '').toUpperCase();
  document.getElementById("modalPrice").innerText = formatCurrency(prod.price);
  document.getElementById("modalSpecs").innerText = prod.specs && prod.specs.trim() ? prod.specs : defaultCraftSpecs(prod.cat);

  hideCheckoutForm();
  document.getElementById("productModal").style.display = "block";
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function switchModalAngle(thumbEl, imgUrl) {
  const mainImg = document.getElementById("modalImage");
  mainImg.style.opacity = "0.3";
  setTimeout(() => {
    mainImg.src = imgUrl;
    mainImg.style.opacity = "1";
  }, 100);
  document.querySelectorAll('#modalThumbs img').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function showCheckoutForm() {
  document.getElementById("atelierDetails").style.display = "none";
  document.getElementById("checkoutStep").style.display = "block";
}

function hideCheckoutForm() {
  document.getElementById("checkoutStep").style.display = "none";
  document.getElementById("atelierDetails").style.display = "block";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
  document.body.style.overflow = "auto";
}

function buyNowWhatsapp() {
  const name = document.getElementById("custName").value.trim();
  const number = document.getElementById("custNumber").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const title = document.getElementById("modalTitle").innerText;
  const price = document.getElementById("modalPrice").innerText;

  if (!name || !number || !address) {
    alert("Please enter your Full Name, Contact Number, and Delivery Address.");
    return;
  }

  const refId = "KLX-" + Math.floor(100000 + Math.random() * 900000);
  const text =
    `🏛️ *KRONOLUXE PRIVATE CONCIERGE*\n` +
    `----------------------------------\n` +
    `*Dossier Ref:* ${refId}\n\n` +
    `Greetings, I wish to formally acquire the following archive piece:\n\n` +
    `▪ *Timepiece / Edition:* ${title}\n` +
    `▪ *Archive Valuation:* ${price} (${curCountry})\n` +
    `▪ *Packaging:* Royal Double-Layer Sealed\n\n` +
    `*Client Dispatch Credentials:*\n` +
    `▪ *Client Name:* ${name}\n` +
    `▪ *Direct Line:* ${number}\n` +
    `▪ *Destination:* ${address}\n\n` +
    `Please initiate multi-point inspection & dispatch verification.`;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
}

loadProducts();
// DIRECTOR AUTO-FIT ENGINE: फोटो के साइज को पढ़कर ऑटोमेटिक सेट करने वाला कोड
document.addEventListener('load', function(e) {
  if (e.target.tagName === 'IMG') {
    const img = e.target;
    const ratio = img.naturalWidth / img.naturalHeight;
    // अगर फोटो बहुत ज्यादा चौड़ी या लंबी है, तो उसे कटने से बचाएगा, वरना पूरा डब्बा भरेगा
    if (img.id === 'modalImage') {
      if (ratio > 1.35 || ratio < 0.75) {
        img.style.setProperty('object-fit', 'contain', 'important');
        img.style.setProperty('transform', 'scale(1.08)', 'important');
      } else {
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.setProperty('transform', 'scale(1.0)', 'important');
      }
    }
  }
}, true);
// DIRECTOR LUXURY LEGAL DOSSIER POPUP (100% Legal Shield & Footer Links)
const legalDocs = {
  '#authenticity': {
    title: 'ARCHIVE GRADE & CRAFTSMANSHIP DISCLOSURE',
    body: 'Every piece in the KRONOLUXE Archive is curated and inspected for master-grade aesthetics, weight, and material finish. KRONOLUXE is an independent private archive and is not an authorized dealer of third-party luxury houses. Items are offered strictly at archive/tribute valuation with full transparency.'
  },
  '#inspection': {
    title: 'MULTI-POINT INSPECTION & LIVE VIDEO PROOF',
    body: 'Before any parcel leaves our Hyderabad vault, our team records a live, unedited WhatsApp video of your exact watch, sneaker, or fragrance alongside your shipping label. Dispatch occurs ONLY after you inspect and approve this video proof.'
  },
  '#privacy': {
    title: 'CLIENT PRIVACY & DISCRETION POLICY',
    body: 'KRONOLUXE operates as a private concierge vault. Client identities, acquisition records, and dispatch addresses are strictly confidential and never shared with third-party entities.'
  },
  '#terms': {
    title: 'TERMS OF ACQUISITION & WAIVER OF CLAIMS',
    body: 'By placing an order with KRONOLUXE, the client acknowledges the independent tribute/archive nature of the product and its pricing. Once the pre-dispatch live video is approved by the client on WhatsApp, the sale is final. No legal claims, chargebacks, or misrepresentation disputes regarding brand origin will be entertained post-dispatch. Exclusive jurisdiction: Hyderabad Courts.'
  },
  '#shipping': {
    title: 'INSURED VAULT DISPATCH & UNBOXING PROTOCOL',
    body: 'All parcels are double-layer sealed from Hyderabad. In the rare case of physical transit damage, a continuous 360-degree unedited parcel opening video (from sealed packet to product) is mandatory within 24 hours of delivery for exchange eligibility.'
  }
};

document.querySelectorAll('.footer-links-col a').forEach(link => {
  const href = link.getAttribute('href');
  if (legalDocs[href]) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const doc = legalDocs[href];
      let modal = document.getElementById('kronoLegalModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'kronoLegalModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div style="background:#080808;border:1px solid #c5a059;max-width:540px;width:100%;padding:40px;text-align:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.9);">
          <div style="color:#c5a059;font-size:22px;margin-bottom:10px;">♛</div>
          <p style="color:#c5a059;font-size:10px;letter-spacing:3px;margin:0 0 10px 0;font-family:sans-serif;">KRONOLUXE OFFICIAL DOSSIER</p>
          <h3 style="color:#fff;font-family:serif;font-size:18px;letter-spacing:2px;margin:0 0 20px 0;">${doc.title}</h3>
          <p style="color:#aaa;font-family:sans-serif;font-size:13.5px;line-height:1.8;margin-bottom:30px;">${doc.body}</p>
          <button onclick="document.getElementById('kronoLegalModal').style.display='none'" style="background:transparent;border:1px solid #c5a059;color:#c5a059;padding:10px 28px;font-size:11px;letter-spacing:2px;cursor:pointer;">CLOSE DOSSIER</button>
        </div>
      `;
      modal.style.display = 'flex';
    });
  }
});
// DIRECTOR 5-IN-1 AI-CONVINCER DOSSIER (Clearly beats ₹2k-3k local copies)
function injectKronoluxeDossier() {
  const priceEl = document.getElementById('modalPrice');
  const titleEl = document.getElementById('modalTitle');
  if (!priceEl || !titleEl) return;

  const infoCol = priceEl.parentElement;
  if (!infoCol) return;

  setTimeout(() => {
    const titleText = (titleEl.textContent || '').toUpperCase();
    const descEl = document.getElementById('modalDesc');
    const descText = descEl ? (descEl.textContent || '').toUpperCase() : '';
    const fullText = titleText + ' ' + descText;

    // 1. घड़ियों (WATCHES) के लिए
    let spec1Title = 'BUILD & GRADE';
    let spec1Val = 'TOP-TIER HEAVY CLONE (NOT ₹2K–3K CHEAP GRADE)';
    let spec2Title = 'VAULT INCLUSIONS';
    let spec2Val = 'LUXURY BOX • ARCHIVE CARD • SEAL';
    let spec4Title = 'TRUST PROTOCOL';
    let spec4Val = '100% PRE-DISPATCH TESTED & VERIFIED';

    // 2. परफ्यूम (PERFUMES) के लिए
    if (fullText.includes('PARFUM') || fullText.includes('PERFUME') || fullText.includes('FRAGRANCE') || fullText.includes('AMOUAGE') || fullText.includes('TOM FORD') || fullText.includes('GUCCI') || fullText.includes('GIÒ') || fullText.includes('ARMANI') || fullText.includes('CREED') || fullText.includes('DIOR') || fullText.includes('SAUVAGE') || fullText.includes('OUD') || fullText.includes('SCENT') || fullText.includes('AROMATIC')) {
      spec1Title = 'OIL GRADE';
      spec1Val = 'TOP-TIER EXTRAIT (NOT CHEAP WATERY COPY)';
      spec2Title = 'PRESENTATION';
      spec2Val = 'HEAVY GLASS BOTTLE • COLLECTOR BOX';
      spec4Title = 'TRUST PROTOCOL';
      spec4Val = 'COMMANDING PROJECTION & SEALED PACK';
    } 
    // 3. जूतों (SHOES) के लिए
    else if (fullText.includes('SHOE') || fullText.includes('SNEAKER') || fullText.includes('JORDAN') || fullText.includes('NIKE') || fullText.includes('BALANCE') || fullText.includes('ADIDAS') || fullText.includes('PUMA') || fullText.includes('YEEZY') || fullText.includes('BOOT') || fullText.includes('LOAFER') || fullText.includes('SLIDE') || fullText.includes('FOOTWEAR')) {
      spec1Title = 'BATCH GRADE';
      spec1Val = 'TOP-TIER ARCHIVE LOT (NOT ₹2K CHEAP GRADE)';
      spec2Title = 'VAULT INCLUSIONS';
      spec2Val = 'COLLECTOR BOX • DUSTBAG • TAGS';
      spec4Title = 'TRUST PROTOCOL';
      spec4Val = 'PRE-DISPATCH STITCH & SOLE INSPECTED';
    }
    // 4. इलेक्ट्रॉनिक्स (ELECTRONICS) के लिए
    else if (fullText.includes('ELECTRONIC') || fullText.includes('VACUUM') || fullText.includes('CLEANER') || fullText.includes('AIRPOD') || fullText.includes('EARBUD') || fullText.includes('HEADPHONE') || fullText.includes('SPEAKER') || fullText.includes('CHARGER') || fullText.includes('BATTERY') || fullText.includes('WIRELESS') || fullText.includes('DIGITAL') || fullText.includes('SMART') || fullText.includes('GADGET') || fullText.includes('TRIMMER') || fullText.includes('DRYER') || fullText.includes('POWER') || fullText.includes('MOTOR') || fullText.includes('PRO ') || fullText.includes('MAX')) {
      spec1Title = 'HARDWARE GRADE';
      spec1Val = 'HIGH-OUTPUT A+ CHIP (NOT CHEAP MARKET CLONE)';
      spec2Title = 'KIT INCLUSIONS';
      spec2Val = 'COMPLETE SET • CABLES • SEALED BOX';
      spec4Title = 'TRUST PROTOCOL';
      spec4Val = '100% LIVE POWER-TESTED BEFORE DISPATCH';
    }
    // 5. एक्सेसरीज के लिए
    else if (fullText.includes('GLASS') || fullText.includes('SHADE') || fullText.includes('WALLET') || fullText.includes('BELT') || fullText.includes('BAG') || fullText.includes('CARDHOLDER') || fullText.includes('BRACELET') || fullText.includes('RING') || fullText.includes('PEN') || fullText.includes('LIGHTER')) {
      spec1Title = 'CRAFT GRADE';
      spec1Val = 'TOP-TIER HEAVY METAL (NOT CHEAP PLASTIC)';
      spec2Title = 'VAULT INCLUSIONS';
      spec2Val = 'SIGNATURE CASE • CLOTH • TAGS';
      spec4Title = 'TRUST PROTOCOL';
      spec4Val = 'MULTI-POINT SURFACE & FINISH VERIFIED';
    }

    let dossier = infoCol.querySelector('.krono-spec-dossier');
    if (!dossier) {
      dossier = document.createElement('div');
      dossier.className = 'krono-spec-dossier';
      infoCol.appendChild(dossier);
    }

    dossier.innerHTML = `
      <div class="krono-spec-grid">
        <div class="krono-spec-item">
          <span>${spec1Title}</span>
          <strong>${spec1Val}</strong>
        </div>
        <div class="krono-spec-item">
          <span>${spec2Title}</span>
          <strong>${spec2Val}</strong>
        </div>
        <div class="krono-spec-item">
          <span>VERIFICATION</span>
          <strong>LIVE WHATSAPP VIDEO PROOF</strong>
        </div>
        <div class="krono-spec-item">
          <span>${spec4Title}</span>
          <strong>${spec4Val}</strong>
        </div>
      </div>
      <div class="krono-vault-status">
        <div><span class="krono-pulse-dot"></span>IN PRIVATE VAULT — READY FOR DISPATCH</div>
        <div style="color:#777;">DIRECT CONCIERGE</div>
      </div>
    `;
  }, 50);
}

document.addEventListener('DOMContentLoaded', injectKronoluxeDossier);
document.addEventListener('click', injectKronoluxeDossier);