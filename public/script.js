const API_URL = '/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentClaimItemId = null;
let loginType = 'user';

if (token) { updateUI(); } else { showWelcomeScreen(); }

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = message; toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showWelcomeScreen() {
    document.getElementById('welcome-section').classList.remove('hidden');
    document.getElementById('auth-buttons').classList.remove('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

function showAuth(type) {
    loginType = type;
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('auth-msg').innerText = '';
    document.getElementById('auth-title').innerText = type === 'admin' ? 'Admin Portal Login' : 'Student Login';
    document.querySelectorAll('.auth-actions .btn')[1].style.display = type === 'admin' ? 'none' : 'block';
}

function updateUI() {
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('auth-buttons').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser.name} (${currentUser.role.toUpperCase()})`;

    // Route to Admin or Student Dashboard based on Role
    if (currentUser.role === 'admin') {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        document.getElementById('student-dashboard').classList.add('hidden');
        loadAdminPanel();
    } else {
        document.getElementById('student-dashboard').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
        switchStudentTab('all-items', document.querySelector('.tab-btn'));
    }
}

function switchStudentTab(tabId, btnElement) {
    document.querySelectorAll('#student-dashboard .tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#student-dashboard .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`s-tab-${tabId}`).classList.remove('hidden');
    if (btnElement) btnElement.classList.add('active');

    if (tabId === 'all-items') loadItems();
    if (tabId === 'my-listings') loadMyListings();
}

// --- AUTH ---
async function login() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
        if (loginType === 'admin' && data.user.role !== 'admin') return document.getElementById('auth-msg').innerText = "Access Denied: Not an admin.";
        localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
        token = data.token; currentUser = data.user;
        showToast('Login successful!'); updateUI();
    } else { document.getElementById('auth-msg').innerText = data.message; }
}

async function register() {
    const name = document.getElementById('auth-name').value;
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password })
    });
    if (res.ok) showToast('Registered! Please login.'); 
    else { const d = await res.json(); document.getElementById('auth-msg').innerText = d.message; }
}

function logout() { localStorage.clear(); location.reload(); }

// --- STUDENT: ALL ITEMS ---
async function loadItems() {
    const search = document.getElementById('search-input').value;
    const category = document.getElementById('filter-category').value;
    let query = `?search=${search}`; if(category) query += `&category=${category}`;

    const res = await fetch(`${API_URL}/items${query}`);
    const items = await res.json();
    const grid = document.getElementById('items-grid');
    grid.innerHTML = items.length === 0 ? '<p>No items found.</p>' : '';

    items.forEach(item => {
        const badge = item.type === 'lost' ? '<span class="item-badge badge-lost">Lost</span>' : '<span class="item-badge badge-found">Found</span>';
        const showClaimBtn = item.status === 'open' && item.reportedBy !== currentUser.id;

        grid.innerHTML += `
            <div class="item-card ${item.type}">
                <div>${badge}<div class="item-title">${item.title}</div>
                <div class="item-detail">${item.description}</div>
                <div class="item-detail"><b>Loc:</b> ${item.location}</div>
                <div style="margin-top:10px; font-weight:bold; color:${item.status==='open'?'#10b981':'#ef4444'}">${item.status.toUpperCase()}</div>
                </div>
                ${showClaimBtn ? `<button class="btn btn-primary" style="width:100%; margin-top:15px;" onclick="openClaimModal('${item._id}')">Claim Item</button>` : ''}
            </div>`;
    });
}

async function submitItem() {
    const payload = {
        title: document.getElementById('item-title').value, description: document.getElementById('item-desc').value,
        type: document.getElementById('item-type').value, category: document.getElementById('item-category').value,
        location: document.getElementById('item-location').value, date: document.getElementById('item-date').value
    };
    const res = await fetch(`${API_URL}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (res.ok) { showToast('Item reported!'); switchStudentTab('all-items', document.querySelector('.tab-btn')); }
}

// --- STUDENT: MY CLAIMS ---
async function loadMyListings() {
    const claimRes = await fetch(`${API_URL}/claims/received`, { headers: { 'Authorization': `Bearer ${token}` }});
    const claims = await claimRes.json();
    const list = document.getElementById('received-claims-list');
    list.innerHTML = claims.length === 0 ? '<p>No claims received yet.</p>' : '';
    
    claims.forEach(claim => {
        list.innerHTML += `
            <div class="card" style="padding: 20px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${claim.status==='pending'?'#f59e0b':claim.status==='approved'?'#10b981':'#ef4444'};">
                <div>
                    <h3 style="margin-bottom:5px;">Item: ${claim.itemId.title}</h3>
                    <p>By: <b>${claim.claimantId.name}</b> (${claim.claimantId.email})</p>
                    <p style="color:#4f46e5;"><b>Proof:</b> "${claim.proof}"</p>
                    <p>Status: <b>${claim.status.toUpperCase()}</b></p>
                </div>
                ${claim.status === 'pending' ? `<div>
                        <button class="btn btn-success" onclick="updateClaim('${claim._id}', 'approved')">Approve</button>
                        <button class="btn btn-danger" onclick="updateClaim('${claim._id}', 'rejected')">Reject</button>
                    </div>` : ''}
            </div>`;
    });
}

// --- CLAIM MODAL ---
function openClaimModal(itemId) { currentClaimItemId = itemId; document.getElementById('claim-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('claim-modal').classList.add('hidden'); }
async function submitClaim() {
    const proof = document.getElementById('claim-proof').value;
    const message = document.getElementById('claim-message').value;
    if(!proof) return showToast("Proof is required!", 'error');

    const res = await fetch(`${API_URL}/claims`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId: currentClaimItemId, proof, message })
    });
    if (res.ok) { showToast('Claim submitted!'); closeModal(); }
    else showToast('Failed. Check backend.', 'error');
}

async function updateClaim(claimId, status) {
    const res = await fetch(`${API_URL}/claims/${claimId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status })
    });
    if(res.ok) { showToast(`Claim ${status}! Item is now CLAIMED.`); loadMyListings(); }
}

// --- ADMIN DASHBOARD ---
async function loadAdminPanel() {
    // 1. Load Stats
    const res = await fetch(`${API_URL}/items`);
    const items = await res.json();
    document.getElementById('admin-stats').innerHTML = `
        <div class="card" style="text-align:center; border-top: 4px solid #4f46e5;"><h2>${items.length}</h2><p>Total Items</p></div>
        <div class="card" style="text-align:center; border-top: 4px solid #ef4444;"><h2>${items.filter(i => i.type === 'lost').length}</h2><p>Lost Items</p></div>
        <div class="card" style="text-align:center; border-top: 4px solid #10b981;"><h2>${items.filter(i => i.status === 'claimed').length}</h2><p>Resolved</p></div>
    `;

    // 2. Load All Claims (We use the /received route, but Admin sees all claims for all items)
    // Since Admin might not be the owner, we need a route for Admin to get all claims.
    // For now, we will fetch all items, then fetch claims for each item (simplified for the demo).
    const list = document.getElementById('admin-claims-list');
    list.innerHTML = '<p>Loading claims...</p>';
    
    // To make it simple: We will just fetch ALL claims.
    // We need a new backend route for this. But to save time, let's just reuse /received
    // and tell the student to make the Admin the owner of the items for the demo, OR 
    // we add a quick route below.
    
    // (Assuming we add GET /api/claims/all to the backend)
    try {
        const claimsRes = await fetch(`${API_URL}/claims/all`, { headers: { 'Authorization': `Bearer ${token}` }});
        const claims = await claimsRes.json();
        
        list.innerHTML = claims.length === 0 ? '<p>No claims in system.</p>' : '';
        claims.forEach(claim => {
            list.innerHTML += `
                <div class="card" style="padding: 15px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-left: 4px solid ${claim.status==='pending'?'#f59e0b':claim.status==='approved'?'#10b981':'#ef4444'};">
                    <div>
                        <h4 style="margin-bottom:5px;">Item: ${claim.itemId.title}</h4>
                        <p style="font-size:0.9rem;">Claimed By: ${claim.claimantId.name} | Proof: "${claim.proof}"</p>
                        <p style="font-weight:bold; color:${claim.status==='pending'?'#f59e0b':'#10b981'}">${claim.status.toUpperCase()}</p>
                    </div>
                    ${claim.status === 'pending' ? `<div>
                            <button class="btn btn-success" onclick="updateClaim('${claim._id}', 'approved')">Approve</button>
                            <button class="btn btn-danger" onclick="updateClaim('${claim._id}', 'rejected')">Reject</button>
                        </div>` : ''}
                </div>`;
        });
    } catch (e) {
        list.innerHTML = '<p>Could not load claims. Backend route missing.</p>';
    }
}