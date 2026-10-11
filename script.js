
const NOTIFY_KEY="koreDecorNotifySettings";
const NOTIFY_DEFAULT={email:"",whatsapp:""};
function getNotifySettings(){
  return {...NOTIFY_DEFAULT,...JSON.parse(localStorage.getItem(NOTIFY_KEY)||"{}")};
}
function saveNotificationSettings(){
  const email=(document.getElementById("notifyEmail")?.value||"").trim();
  const whatsapp=(document.getElementById("notifyWhatsapp")?.value||"").replace(/\D/g,"");
  localStorage.setItem(NOTIFY_KEY,JSON.stringify({email,whatsapp}));
  toast("Notification settings saved.");
}
function loadNotificationSettings(){
  const s=getNotifySettings();
  if(document.getElementById("notifyEmail")) document.getElementById("notifyEmail").value=s.email;
  if(document.getElementById("notifyWhatsapp")) document.getElementById("notifyWhatsapp").value=s.whatsapp;
}
function enquiryMessage(q){
  return `KORE DECOR enquiry%0A%0ACustomer: ${encodeURIComponent(q.name||"Customer")}%0APhone: ${encodeURIComponent(q.phone||"Not provided")}%0AEmail: ${encodeURIComponent(q.email||"Not provided")}%0AProduct: ${encodeURIComponent(q.product||"General enquiry")}%0AMessage: ${encodeURIComponent(q.message||"")}`;
}
function sendWhatsAppFromAdmin(id){
  const q=getEnquiries().find(x=>x.id===id); if(!q)return;
  const s=getNotifySettings();
  if(!s.whatsapp){toast("Add your WhatsApp number in Notification Settings first.");return;}
  const text=decodeURIComponent(enquiryMessage(q));
  window.open("https://wa.me/"+s.whatsapp+"?text="+encodeURIComponent(text),"whatsapp");
}
function callCustomer(phone){
  window.location.href="tel:"+String(phone).replace(/\s/g,"");
}
function emailCustomer(id){
  const q=getEnquiries().find(x=>x.id===id); if(!q)return;
  const to=q.email||"";
  const subject=encodeURIComponent("KORE DECOR enquiry — "+(q.product||"Furniture"));
  const body=encodeURIComponent(`Hello ${q.name||""},\n\nThank you for contacting KORE DECOR.\n\nProduct: ${q.product||"General enquiry"}\n\nRegards,\nKORE DECOR`);
  window.location.href=`mailto:${to}?subject=${subject}&body=${body}`;
}
function notifyNewEnquiry(q){
  const s=getNotifySettings();
  // Browser-safe fallbacks. True automatic delivery requires a backend/API.
  if(s.email){
    const subject=encodeURIComponent("New KORE DECOR enquiry — "+(q.product||"Furniture"));
    const body=encodeURIComponent(`New customer enquiry\n\nName: ${q.name||""}\nPhone: ${q.phone||""}\nEmail: ${q.email||""}\nProduct: ${q.product||""}\nMessage: ${q.message||""}`);
    // Do not force-open mail automatically; browser security/user experience is better with a visible action.
    return {email:`mailto:${s.email}?subject=${subject}&body=${body}`, whatsapp:s.whatsapp?`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(decodeURIComponent(enquiryMessage(q)))}`:""};
  }
  return {email:"",whatsapp:""};
}


const ADMIN_USER="koredecor";
const ADMIN_PASS="kore8484";
const ENQUIRY_KEY="koreDecorEnquiries";

function openAdminLogin(){
  closeAll();
  document.getElementById("adminLoginError").textContent="";
  document.getElementById("adminLoginModal").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function adminLogin(e){
  e.preventDefault();
  const u=document.getElementById("adminUsername").value.trim();
  const p=document.getElementById("adminPassword").value;
  if(u===ADMIN_USER && p===ADMIN_PASS){
    sessionStorage.setItem("koreAdminAuth","1");
    closeAll();
    openAdmin();
  }else{
    document.getElementById("adminLoginError").textContent="Invalid username or password.";
  }
}
function logoutAdmin(){
  sessionStorage.removeItem("koreAdminAuth");
  closeAll();
  toast("Studio Panel logged out.");
}
function getEnquiries(){
  return JSON.parse(localStorage.getItem(ENQUIRY_KEY)||"[]");
}
function saveEnquiry(data){
  const a=getEnquiries();
  a.unshift({...data,email:data.email||"",id:Date.now().toString(),createdAt:new Date().toLocaleString("en-IN")});
  localStorage.setItem(ENQUIRY_KEY,JSON.stringify(a));
  const notification=notifyNewEnquiry(a[0]);
  window.lastKoreDecorNotification=notification;
  renderAdminDashboard();
}
function renderAdminDashboard(){
  const products=getAdminProducts();
  const enquiries=getEnquiries();
  const reviews=JSON.parse(localStorage.getItem("koreDecorReviews")||"[]");
  document.getElementById("dashProducts").textContent=products.length;
  document.getElementById("dashCategories").textContent=Object.keys(catalog).length;
  document.getElementById("dashEnquiries").textContent=enquiries.length;
  document.getElementById("dashReviews").textContent=reviews.length;
  document.getElementById("adminEnquiries").innerHTML=enquiries.length?enquiries.map(q=>`
    <div class="queryCard">
      <div><b>${esc(q.name||"Customer")}</b><span>${esc(q.createdAt||"")}</span></div>
      <p><strong>Product:</strong> ${esc(q.product||"General enquiry")}</p>
      <p><strong>Phone:</strong> ${esc(q.phone||"Not provided")} · <strong>Message:</strong> ${esc(q.message||"")}</p>
      <button class="filter" onclick="deleteEnquiry('${q.id}')">Delete</button>
    </div>`).join(""):`<div class="emptyAdmin">No customer enquiries yet.</div>`;
  document.getElementById("adminReviews").innerHTML=reviews.length?reviews.map((r,i)=>`
    <div class="queryCard"><div><b>${esc(r.name||"Customer")}</b><span>${"★".repeat(r.rating||0)}</span></div><p>${esc(r.text||"")}</p><button class="filter" onclick="deleteReview(${i})">Delete</button></div>`).join(""):`<div class="emptyAdmin">No customer reviews yet.</div>`;
}
function deleteEnquiry(id){
  localStorage.setItem(ENQUIRY_KEY,JSON.stringify(getEnquiries().filter(x=>x.id!==id)));
  renderAdminDashboard();
}
function deleteReview(i){
  const r=JSON.parse(localStorage.getItem("koreDecorReviews")||"[]");
  r.splice(i,1); localStorage.setItem("koreDecorReviews",JSON.stringify(r)); renderReviews(); renderAdminDashboard();
}
function switchAdminTab(tab,btn){
  document.querySelectorAll(".adminTab").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("adminProductsTab").style.display=tab==="products"?"block":"none";
  document.getElementById("adminEnquiriesTab").style.display=tab==="enquiries"?"block":"none";
  document.getElementById("adminReviewsTab").style.display=tab==="reviews"?"block":"none";
  renderAdminDashboard();
}

const catalog={
"Sofas":[
["Modern L-Shape Sofa","Premium fabric · Custom colours","₹45,000","https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1100&q=90","BESTSELLER"],
["Cloud Lounge Sofa","Deep seating · Soft-touch upholstery","₹52,000","https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=1100&q=90","NEW"],
["Classic 3-Seater","Timeless profile · Custom finish","₹38,500","https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Luxury Corner Sofa","Large format · Premium upholstery","₹68,000","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8?auto=format&fit=crop&w=1100&q=90","PREMIUM"]],
"Centre Tables":[
["Designer Centre Table","Stone top · Brass details","₹18,500","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8?auto=format&fit=crop&w=1100&q=90","BESTSELLER"],
["Marble Gold Table","Marble finish · Metal base","₹24,000","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1100&q=90","PREMIUM"],
["Round Accent Table","Compact · Statement design","₹12,500","https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1100&q=90","NEW"],
["Wooden Coffee Table","Solid wood · Hand finished","₹16,900","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=90","HANDCRAFTED"]],
"Beds":[
["Luxury Wooden Bed","Solid wood · Hand finished","₹62,000","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1100&q=90","BESTSELLER"],
["Upholstered King Bed","Premium fabric · Soft headboard","₹55,000","https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1100&q=90","PREMIUM"],
["Modern Storage Bed","Hydraulic storage · Custom size","₹49,500","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Classic Panel Bed","Elegant wood profile","₹44,000","https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1100&q=90","NEW"]],
"Jhula / Swings":[
["Royal Jhula","Carved wood · Custom finish","₹1,25,000","https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1100&q=90","HANDCRAFTED"],
["Classic Wooden Swing","Solid wood · Custom stain","₹72,000","https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Cane Hanging Swing","Natural cane · Comfortable seat","₹34,000","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=90","NEW"],
["Designer Jhula","Premium carving · Statement piece","₹98,000","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=90","PREMIUM"]],
"Wardrobes":[
["Modern 3-Door Wardrobe","Engineered wood · Custom size","₹48,000","https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Sliding Wardrobe","Soft-close · Mirror option","₹58,000","https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1100&q=90","NEW"],
["Classic Wood Wardrobe","Hand finished · Solid wood","₹74,000","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=90","PREMIUM"],
["Compact Wardrobe","Space saving · Custom colour","₹31,500","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1100&q=90","BESTSELLER"]],
"Chairs":[
["Accent Lounge Chair","Soft fabric · Sculpted form","₹14,500","https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1100&q=90","NEW"],
["Classic Armchair","Premium upholstery · Solid frame","₹18,000","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Dining Chair","Custom fabric · Wood legs","₹7,500","https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=1100&q=90","BESTSELLER"],
["Royal Chair","Carved wood · Luxury fabric","₹26,000","https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1100&q=90","HANDCRAFTED"]],
"Antique Items":[
["Antique Console","Carved details · Heritage finish","₹85,000","https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1100&q=90","HANDCRAFTED"],
["Heritage Cabinet","Vintage inspired · Detailed carving","₹92,000","https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1100&q=90","PREMIUM"],
["Decorative Sideboard","Classic profile · Brass details","₹64,000","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=90","POPULAR"],
["Antique Accent Piece","Statement furniture · Custom finish","₹42,000","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=90","NEW"]],
"Custom Furniture":[
["Custom Sofa","Made to your room · Any fabric","From ₹35,000","https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1100&q=90","CUSTOM"],
["Custom Bed","Your size · Your finish","From ₹45,000","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1100&q=90","CUSTOM"],
["Custom Table","Choose top · base · size","From ₹12,000","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8?auto=format&fit=crop&w=1100&q=90","CUSTOM"],
["Custom Storage","Designed for your space","From ₹25,000","https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1100&q=90","CUSTOM"]]
};
const catImages={
"Sofas":"https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=500&q=80",
"Centre Tables":"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8?auto=format&fit=crop&w=500&q=80",
"Beds":"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80",
"Jhula / Swings":"https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=500&q=80",
"Wardrobes":"https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=500&q=80",
"Chairs":"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=500&q=80",
"Antique Items":"https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=500&q=80",
"Custom Furniture":"https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80"};
let active="Sofas";

function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function renderCategories(){
 document.getElementById("categoryRail").innerHTML=Object.keys(catalog).map(c=>`<button class="category ${c===active?"selected":""}" onclick="choose('${c.replace(/'/g,"\\'")}')"><img src="${catImages[c]}" alt="${esc(c)}"><div><b>${esc(c)}</b><span>→</span></div></button>`).join("");
}
function renderProducts(){
 document.getElementById("catalogTitle").textContent=active;
 document.getElementById("filters").innerHTML=Object.keys(catalog).map(c=>`<button class="filter ${c===active?"active":""}" onclick="choose('${c.replace(/'/g,"\\'")}')">${esc(c)}</button>`).join("");
 document.getElementById("productGrid").innerHTML=catalog[active].map(p=>`
 <article class="product" onclick="openInquiry('${p[0].replace(/'/g,"\\'")}')">
  <div class="photo"><span class="label">${esc(p[4])}</span><img loading="lazy" src="${p[3]}" alt="${esc(p[0])}"></div>
  <div class="productInfo"><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p><div class="productFoot"><span class="productPrice">${esc(p[2])}</span><button class="arrow" onclick="event.stopPropagation();openInquiry('${p[0].replace(/'/g,"\\'")}')">↗</button></div></div>
 </article>`).join("");
}
function choose(c){active=c;renderCategories();renderProducts();document.getElementById("catalog").scrollIntoView({behavior:"smooth"})}
function openDrawer(){document.getElementById("drawer").classList.add("open");document.getElementById("overlay").classList.add("open")}
function openInquiry(product="General Enquiry"){closeDrawer();document.getElementById("inqProduct").value=product;document.getElementById("inquiryModal").classList.add("open");document.getElementById("overlay").classList.add("open")}
function openReview(){closeDrawer();document.getElementById("reviewModal").classList.add("open");document.getElementById("overlay").classList.add("open")}
function openSearch(){closeDrawer();document.getElementById("searchModal").classList.add("open");document.getElementById("overlay").classList.add("open");setTimeout(()=>document.getElementById("searchInput").focus(),100)}
function closeDrawer(){document.getElementById("drawer").classList.remove("open")}
function closeAll(){document.querySelectorAll(".modal").forEach(x=>x.classList.remove("open"));closeDrawer();document.getElementById("overlay").classList.remove("open")}
function toast(m){let t=document.getElementById("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function submitInquiry(e){e.preventDefault();let n=document.getElementById("inqName").value,p=document.getElementById("inqPhone").value,pr=document.getElementById("inqProduct").value,m=document.getElementById("inqMessage").value;let msg=`Hi KORE DECOR,%0A%0AName: ${encodeURIComponent(n)}%0APhone: ${encodeURIComponent(p)}%0AProduct: ${encodeURIComponent(pr)}%0AMessage: ${encodeURIComponent(m)}`;window.open(`https://wa.me/918484861930?text=${msg}`,"_blank");closeAll();toast("Opening WhatsApp enquiry…")}
function submitReview(e){e.preventDefault();let file=document.getElementById("revPhoto").files[0];let save=(photo="")=>{let a=JSON.parse(localStorage.getItem("koreDecorReviews")||"[]");a.unshift({name:document.getElementById("revName").value,rating:+document.getElementById("revRating").value,text:document.getElementById("revText").value,photo});localStorage.setItem("koreDecorReviews",JSON.stringify(a.slice(0,20)));renderReviews();closeAll();toast("Review submitted successfully.");};if(file){let r=new FileReader();r.onload=()=>save(r.result);r.readAsDataURL(file)}else save("")}
function renderReviews(){
 const custom=JSON.parse(localStorage.getItem("koreDecorReviews")||"[]");
 const list=document.getElementById("reviewsList");
 if(!custom.length){
   list.innerHTML=`<div style="grid-column:1/-1;padding:34px;border:1px dashed #d8cec2;background:#fcfaf7;text-align:center;color:#777"><div style="font:25px 'Playfair Display';color:#2a211b;margin-bottom:8px">Be our first customer to review.</div><div style="font-size:11px;line-height:1.7">Customer reviews will appear here after they are submitted.</div></div>`;
   return;
 }
 const visible=custom.slice(0,4);
 list.innerHTML=visible.map(r=>`<article class="review"><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>“${esc(r.text)}”</p><div class="person">${r.photo?`<img src="${r.photo}" alt="">`:`<div style="width:35px;height:35px;border-radius:50%;background:#d7bea1"></div>`}<b>${esc(r.name)}</b></div></article>`).join("");
 if(custom.length>4) list.insertAdjacentHTML("beforeend",`<button class="lightBtn" style="grid-column:1/-1;margin-top:5px;border:1px solid #c9b39c" onclick="showAllReviews()">See More Reviews →</button>`);
}
function showAllReviews(){
 const custom=JSON.parse(localStorage.getItem("koreDecorReviews")||"[]");
 document.getElementById("reviewsList").innerHTML=custom.map(r=>`<article class="review"><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>“${esc(r.text)}”</p><div class="person">${r.photo?`<img src="${r.photo}" alt="">`:`<div style="width:35px;height:35px;border-radius:50%;background:#d7bea1"></div>`}<b>${esc(r.name)}</b></div></article>`).join("");
}

const ADMIN_KEY="koreDecorAdminProducts";
function getAdminProducts(){return JSON.parse(localStorage.getItem(ADMIN_KEY)||"[]")}
function setAdminProducts(a){localStorage.setItem(ADMIN_KEY,JSON.stringify(a));renderLatestProducts();renderAdminProducts()}
function openAdmin(){closeAll();document.getElementById("adminModal").classList.add("open");document.getElementById("overlay").classList.add("open");renderAdminProducts()}
function resetAdminForm(){document.getElementById("adminEditId").value="";document.getElementById("adminName").value="";document.getElementById("adminPrice").value="";document.getElementById("adminDesc").value="";document.getElementById("adminImage").value="";document.getElementById("adminImageUrl").value="";document.getElementById("adminSaveBtn").textContent="Add Product →"}
function saveAdminProduct(e){e.preventDefault();const finish=image=>{const all=getAdminProducts(),id=document.getElementById("adminEditId").value,item={id:id||Date.now().toString(),name:document.getElementById("adminName").value.trim(),category:document.getElementById("adminCategory").value,price:document.getElementById("adminPrice").value.trim(),desc:document.getElementById("adminDesc").value.trim()||"Premium furniture · KORE DECOR",image:image||"https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=900&q=85"};if(id){const i=all.findIndex(x=>x.id===id);if(i>-1)all[i]=item}else all.unshift(item);if(setAdminProducts(all)){resetAdminForm();toast(id?"Product updated successfully.":"Product added to Latest Collections.")}};const url=document.getElementById("adminImageUrl").value.trim(),file=document.getElementById("adminImage").files[0];if(file){compressAdminImage(file).then(finish).catch(()=>{toast("Image could not be processed.");});}else{const cur=getAdminProducts().find(x=>x.id===document.getElementById("adminEditId").value);finish(url||cur?.image||"")}}
function compressAdminImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const img=new Image();img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",.78));};img.onerror=reject;img.src=r.result};r.readAsDataURL(file)})}
function editAdminProduct(id){const p=getAdminProducts().find(x=>x.id===id);if(!p)return;document.getElementById("adminEditId").value=p.id;document.getElementById("adminName").value=p.name;document.getElementById("adminCategory").value=p.category;document.getElementById("adminPrice").value=p.price;document.getElementById("adminDesc").value=p.desc;document.getElementById("adminImageUrl").value=p.image.startsWith("data:")?"":p.image;document.getElementById("adminSaveBtn").textContent="Update Product →"}
function deleteAdminProduct(id){if(!confirm("Delete this product from Latest Collections?"))return;setAdminProducts(getAdminProducts().filter(x=>x.id!==id));toast("Product removed.")}
function renderAdminProducts(){const all=getAdminProducts();document.getElementById("adminCount").textContent=all.length+" added";document.getElementById("adminProducts").innerHTML=all.length?all.map(p=>`<div class="adminItem"><img src="${p.image}" alt=""><div><h4>${esc(p.name)}</h4><p>${esc(p.category)} · ${esc(p.price)}</p></div><div class="adminActions"><button onclick="editAdminProduct('${p.id}')">Edit</button><button class="delete" onclick="deleteAdminProduct('${p.id}')">Delete</button></div></div>`).join(""):`<div style="padding:25px 5px;font-size:11px;color:#888">No extra products yet. Add as many as you want.</div>`}
function renderLatestProducts(filter="All"){
 const base=[];Object.entries(catalog).forEach(([category,items])=>items.forEach(p=>base.push({name:p[0],category,price:p[2],desc:p[1],image:p[3],badge:p[4]})));
 const extra=getAdminProducts().map(p=>({...p,badge:"NEW"})),all=[...extra,...base];
 const categories=["All",...Object.keys(catalog)];
 document.getElementById("latestTabs").innerHTML=categories.map(c=>`<button class="latestTab ${c===filter?"active":""}" onclick="renderLatestProducts('${c.replace(/'/g,"\\'")}')">${esc(c)}</button>`).join("");
 const shown=all.filter(p=>filter==="All"||p.category===filter);
 document.getElementById("latestRail").innerHTML=shown.slice(0,16).map(p=>`<article class="latestCard" onclick="openInquiry('${p.name.replace(/'/g,"\\'")}')"><div class="latestPhoto"><span class="latestBadge">${esc(p.badge||"COLLECTION")}</span><img loading="lazy" src="${p.image}" alt="${esc(p.name)}"></div><div class="latestCardBody"><div class="latestLine"><h3>${esc(p.name)}</h3><span class="price">${esc(p.price)}</span></div><p>${esc(p.desc||"KORE DECOR furniture")}</p></div></article>`).join("")}
function renderFeaturedCollections(){const wanted=["Sofas","Beds","Chairs","Centre Tables"];document.getElementById("featuredCollections").innerHTML=wanted.map(c=>`<button class="featuredCollection" onclick="choose('${c}')"><img src="${catImages[c]}" alt="${esc(c)}"><div class="fcText"><small>KORE DECOR</small><h3>${esc(c)}</h3><span>Explore collection →</span></div></button>`).join("")}
function scrollToCatalog(){document.getElementById("catalog").scrollIntoView({behavior:"smooth"})}

addEventListener("scroll",()=>{document.getElementById("nav").classList.toggle("stuck",scrollY>35);document.getElementById("topline").style.width=(scrollY/(document.body.scrollHeight-innerHeight)*100)+"%"});
renderCategories();renderProducts();renderReviews();renderFeaturedCollections();renderLatestProducts();

function submitCustomerEnquiry(data){
  saveEnquiry(data);
}

function openLeadNotification(type){
  const n=window.lastKoreDecorNotification||{};
  if(type==="email"&&n.email) window.location.href=n.email;
  if(type==="whatsapp"&&n.whatsapp) window.open(n.whatsapp,"whatsapp");
}

// Keep the right-side menu vertically scrollable on desktop and mobile.
document.addEventListener("wheel", function(e){
  const links=e.target.closest(".drawerLinks");
  if(!links) return;
  if(links.scrollHeight > links.clientHeight){
    const atTop=links.scrollTop<=0;
    const atBottom=links.scrollTop+links.clientHeight>=links.scrollHeight-1;
    if((atTop && e.deltaY<0)||(atBottom && e.deltaY>0)) e.preventDefault();
  }
},{passive:false});

// adminTab delegated click
document.addEventListener("click",function(e){const b=e.target.closest(".adminTab");if(!b)return;const m=b.getAttribute("onclick")?.match(/switchAdminTab\(\'([^\']+)/);if(m){switchAdminTab(m[1],b);}});

window.addEventListener("load",()=>{
  setTimeout(()=>document.getElementById("pageLoader")?.classList.add("done"),650);
  const els=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");io.unobserve(e.target)}}),{threshold:.12,rootMargin:"0px 0px -40px"});
    els.forEach((e,i)=>{e.style.transitionDelay=Math.min(i*45,250)+"ms";io.observe(e)});
  }else els.forEach(e=>e.classList.add("visible"));
});
(()=>{
 const g=document.getElementById("cursorGlow"); if(!g||matchMedia("(pointer:coarse)").matches)return;
 let x=0,y=0,tx=0,ty=0;
 addEventListener("mousemove",e=>{tx=e.clientX;ty=e.clientY;g.style.opacity="1"});
 addEventListener("mouseleave",()=>g.style.opacity="0");
 (function f(){x+=(tx-x)*.12;y+=(ty-y)*.12;g.style.left=x+"px";g.style.top=y+"px";requestAnimationFrame(f)})();
})();
