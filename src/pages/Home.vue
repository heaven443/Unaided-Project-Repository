<template>
  <div class="homePage">
    <div class="homepage-content-wrapper">
      <nav class="nav-bar">
        <div class="logo-group">
          <div class="logo-badge"><div class="ticket-percent">%</div></div>
          <div class="logo-text">CaleTracker</div>
        </div>

        <div class="nav-filters">
          <div :class="['filter-item', activeCategory === 'All' ? 'active-filter' : '']" @click="setCategory('All')">All</div>
          <div :class="['filter-item', activeCategory === 'Shopping' ? 'active-filter' : '']" @click="setCategory('Shopping')">Shopping</div>
          <div :class="['filter-item', activeCategory === 'Gaming' ? 'active-filter' : '']" @click="setCategory('Gaming')">Gaming</div>
        </div>

        <div class="auth-actions">
          <button @click="handlePostDealClick" class="post-btn">+ Post Deal</button>
          
          <template v-if="currentUser">
            <div class="user-pill">
              <span class="user-name">{{ currentUser.name }}</span>
              <span v-if="currentUser.role === 'admin'" class="role-tag admin">Admin</span>
              <span v-else-if="currentUser.is_verified" class="role-tag verified">✓ Verified</span>
              <span v-else class="role-tag unverified">⚠ Unverified</span>
            </div>
            <button @click="logout" class="sign-in-btn">Sign Out</button>
          </template>

          <template v-else>
            <button @click="openSignIn" class="sign-in-btn">Sign In</button>
            <button @click="openSignUp" class="sign-up-btn">Sign Up</button>
          </template>
        </div>
      </nav>

      <!-- Toast Notification -->
      <div v-if="toastMessage" :class="['toast-banner', toastType]">
        {{ toastMessage }}
      </div>

      <section class="hero-section">
        <div class="hero-badge">COMMUNITY-MANAGED DISCOUNTS</div>
        <h1>Community-Powered Sale Tracking</h1>
        <p class="hero-copy">Never miss a deal again. CaleTracker is a public directory maintained by shoppers and gamers to track, verify, and monitor global discounts across top retailers and platforms.</p>
        
        <div class="stats-banner" v-if="stats">
          <div class="stat-box">
            <span class="stat-num">{{ stats.totalTrackers }}</span>
            <span class="stat-lbl">Active Trackers</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-num">{{ stats.averageDiscount }}%</span>
            <span class="stat-lbl">Avg. Discount</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-num">{{ stats.topPlatform }}</span>
            <span class="stat-lbl">Top Platform</span>
          </div>
        </div>
      </section>

      <section class="deals-section">
        <div class="deals-header">
          <div class="Frame">
            <div class="active-title">Active Sale Trackers</div>
            <div class="active-sub">Showing verified active trackers posted by community members</div>
          </div>
          <div class="search-bar">
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              class="search-input"
              placeholder="Search deals or platforms..."
            />
          </div>
        </div>

        <div v-if="loading" class="loading-state">Loading trackers...</div>
        <div v-else-if="cards.length === 0" class="no-trackers">No active trackers found</div>
        <div v-else class="deals-grid">
          <div v-for="card in cards" :key="card.id" class="deal-card">
            <div class="card-meta-row">
              <div class="category-badge">{{ card.category }}</div>
              
              <div class="card-actions-group">
                <!-- Delete button for Admins and tracker creators -->
                <button
                  v-if="canDelete(card)"
                  class="delete-card-btn"
                  @click.stop="deleteTracker(card)"
                  :title="currentUser?.role === 'admin' ? 'Delete as Administrator' : 'Delete your tracker'"
                >
                  ✕ Delete
                </button>

                <button class="upvote-pill" @click="handleUpvote(card)" title="Verify and upvote deal">
                  ▲ {{ card.upvotes || 0 }}
                </button>
              </div>
            </div>

            <div class="card-content-block">
              <div class="discount-headline">
                <div class="discount-amount">{{ card.discount }}%</div>
                <div class="off">OFF</div>
              </div>
              <div class="deal-title">{{ card.title }}</div>
              <div class="deal-sub">on {{ card.platform }}</div>
            </div>

            <div class="Line"></div>

            <div class="card-footer-info">
              <div class="info-row-expiry">Ends: {{ card.ends }}</div>
              <div class="info-row-uploader">
                By: {{ card.author }}
                <span v-if="currentUser && (card.user_id === currentUser.id || card.author === currentUser.name)" class="owner-pill">You</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="footer-top">
          <div class="footer-brand"><div class="Frame-mini"></div> CaleTracker</div>
          <div class="footer-links">About • Guidelines • API • Support</div>
        </div>
        <div class="footer-bottom">© 2026 CaleTracker. Community-managed discounts and sale trackers.</div>
      </footer>

      <!-- Auth Modal (Sign In / Sign Up) -->
      <div v-if="showSignIn || showSignUp" class="modal-overlay" @click.self="closeModals">
        <div :class="['modal', showSignUp ? 'signup' : 'signin']">
          <div class="modal-header">
            <h3 v-if="showSignIn">Sign In</h3>
            <h3 v-else>Create Account</h3>
            <p class="modal-sub" v-if="showSignIn">Welcome back to CaleTracker</p>
            <p class="modal-sub" v-else>Join CaleTracker to start submitting deals</p>
          </div>

          <!-- Quick Test Account Selector (for testing) -->
          <div v-if="showSignIn" class="test-accounts-box">
            <span class="test-accounts-title">Quick Test Logins:</span>
            <div class="test-btn-group">
              <button type="button" @click="fillTestAccount('admin')" class="test-fill-btn admin-fill">Admin</button>
              <button type="button" @click="fillTestAccount('verified')" class="test-fill-btn verified-fill">Verified User</button>
              <button type="button" @click="fillTestAccount('unverified')" class="test-fill-btn unverified-fill">Unverified User</button>
            </div>
          </div>

          <div v-if="authError" class="modal-alert error">{{ authError }}</div>

          <form class="modal-form" @submit.prevent="showSignIn ? submitSignIn() : submitSignUp()">
            <div v-if="showSignUp" class="form-field">
              <div class="field-label">Full Name</div>
              <div class="input-wrapper">
                <input type="text" v-model="formName" required placeholder="Garry Pagara" />
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">Email</div>
              <div class="input-wrapper">
                <input type="email" v-model="formEmail" required placeholder="you@example.com" />
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">Password</div>
              <div class="input-wrapper">
                <input type="password" v-model="formPassword" required placeholder="••••••••" />
              </div>
            </div>

            <div v-if="showSignUp" class="form-field">
              <div class="field-label">Confirm Password</div>
              <div class="input-wrapper">
                <input type="password" v-model="formConfirmPassword" required placeholder="••••••••" />
              </div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="submit-btn" :disabled="authSubmitting">
                {{ authSubmitting ? 'Please wait...' : (showSignIn ? 'Sign In' : 'Create Account') }}
              </button>
              <button type="button" class="modal-help-btn" v-if="showSignIn" @click.prevent="openSignUp">
                Don't have an account? <span class="modal-link">Sign Up</span>
              </button>
              <button type="button" class="modal-help-btn" v-else @click.prevent="openSignIn">
                Already have an account? <span class="modal-link">Sign In</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Deal Tracker Modal -->
      <div v-if="showAddDeal" class="modal-overlay" @click.self="showAddDeal = false">
        <div class="modal add-deal-modal">
          <div class="modal-header">
            <h3>Post a Sale Tracker</h3>
            <p class="modal-sub">Verified community members can post active discounts</p>
          </div>

          <div v-if="dealError" class="modal-alert error">{{ dealError }}</div>

          <form class="modal-form" @submit.prevent="submitDeal">
            <div class="form-field">
              <div class="field-label">Deal Title / Item Name *</div>
              <div class="input-wrapper">
                <input type="text" v-model="newDeal.title" required placeholder="e.g. Logitech MX Master 3S Mouse" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <div class="field-label">Discount (%) *</div>
                <div class="input-wrapper">
                  <input type="number" min="1" max="99" v-model.number="newDeal.discount" required placeholder="e.g. 40" />
                </div>
              </div>

              <div class="form-field">
                <div class="field-label">Category *</div>
                <div class="input-wrapper">
                  <select v-model="newDeal.category" required class="select-input">
                    <option value="Shopping">Shopping</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <div class="field-label">Platform / Store *</div>
                <div class="input-wrapper">
                  <input type="text" v-model="newDeal.platform" required placeholder="Steam, Amazon, Best Buy..." />
                </div>
              </div>

              <div class="form-field">
                <div class="field-label">Ends Date *</div>
                <div class="input-wrapper">
                  <input type="text" v-model="newDeal.ends" required placeholder="e.g. Nov 15, 2026" />
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="submit-btn" :disabled="dealSubmitting">
                {{ dealSubmitting ? 'Posting...' : 'Submit Sale Tracker' }}
              </button>
              <button type="button" class="cancel-btn" @click="showAddDeal = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Verification Required Alert Modal -->
      <div v-if="showVerificationModal" class="modal-overlay" @click.self="showVerificationModal = false">
        <div class="modal verification-modal">
          <div class="modal-header">
            <div class="verification-badge-large">⚠ Verification Required</div>
            <h3>Account Not Verified</h3>
            <p class="modal-sub">
              Your account <strong>({{ currentUser?.email }})</strong> is currently <strong>unverified</strong>.
              To maintain the accuracy and quality of sale trackers, only <strong>verified community members</strong> and <strong>administrators</strong> can publish new trackers.
            </p>
          </div>

          <div class="test-helper-card">
            <span class="test-helper-title">For Testing:</span>
            <p class="test-helper-text">You can sign in with the pre-configured verified account to test deal creation and deletion:</p>
            <div class="test-helper-cred">
              <strong>Email:</strong> <code>verified@caletracker.com</code><br/>
              <strong>Password:</strong> <code>verified123</code>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="submit-btn" @click="switchToVerifiedAccount">
              Switch to Verified Account
            </button>
            <button type="button" class="cancel-btn" @click="showVerificationModal = false">
              Close
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const cards = ref([])
const stats = ref(null)
const loading = ref(true)
const activeCategory = ref('All')
const searchQuery = ref('')
let searchTimeout = null

// Modals
const showSignIn = ref(false)
const showSignUp = ref(false)
const showAddDeal = ref(false)
const showVerificationModal = ref(false)

// Notifications
const toastMessage = ref('')
const toastType = ref('success')
let toastTimeout = null

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 4000)
}

// Auth state
const currentUser = ref(null)
const authToken = ref('')
const authError = ref('')
const authSubmitting = ref(false)

// Form fields
const formName = ref('')
const formEmail = ref('')
const formPassword = ref('')
const formConfirmPassword = ref('')

// Add deal form
const dealError = ref('')
const dealSubmitting = ref(false)
const newDeal = ref({
  title: '',
  discount: 30,
  category: 'Gaming',
  platform: 'Steam',
  ends: 'Nov 15, 2026'
})

onMounted(() => {
  const savedUser = localStorage.getItem('caletracker_user')
  const savedToken = localStorage.getItem('caletracker_token')
  if (savedUser && savedToken) {
    try {
      currentUser.value = JSON.parse(savedUser)
      authToken.value = savedToken
    } catch (e) {
      localStorage.removeItem('caletracker_user')
      localStorage.removeItem('caletracker_token')
    }
  }

  fetchDeals()
  fetchStats()
})

async function fetchDeals() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (activeCategory.value && activeCategory.value !== 'All') {
      params.append('category', activeCategory.value)
    }
    if (searchQuery.value && searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    const queryStr = params.toString()
    const url = `/api/deals${queryStr ? '?' + queryStr : ''}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.success) {
      cards.value = data.deals
    }
  } catch (err) {
    console.error('Failed to fetch deals:', err)
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/deals/stats')
    const data = await res.json()
    if (data.success) {
      stats.value = data.stats
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err)
  }
}

function setCategory(cat) {
  activeCategory.value = cat
  fetchDeals()
}

function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchDeals()
  }, 300)
}

function canDelete(card) {
  if (!currentUser.value) return false
  if (currentUser.value.role === 'admin') return true
  return card.user_id === currentUser.value.id || card.author === currentUser.value.name
}

async function deleteTracker(card) {
  const isOwner = card.user_id === currentUser.value?.id || card.author === currentUser.value?.name
  const roleText = currentUser.value?.role === 'admin' && !isOwner ? 'as Administrator' : ''
  const confirmed = confirm(`Are you sure you want to delete "${card.title}" ${roleText}?`)
  if (!confirmed) return

  try {
    const res = await fetch(`/api/deals/${card.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken.value}`
      }
    })
    const data = await res.json()
    if (data.success) {
      cards.value = cards.value.filter(c => c.id !== card.id)
      fetchStats()
      showToast(`Sale tracker "${card.title}" deleted successfully.`, 'success')
    } else {
      showToast(data.message || 'Failed to delete sale tracker.', 'error')
    }
  } catch (err) {
    showToast('Failed to connect to server to delete tracker.', 'error')
  }
}

function handlePostDealClick() {
  if (!currentUser.value) {
    authError.value = 'Please sign in with a verified account to post sale trackers.'
    openSignIn()
    return
  }

  // Check verification
  if (!currentUser.value.is_verified && currentUser.value.role !== 'admin') {
    showVerificationModal.value = true
    return
  }

  dealError.value = ''
  showAddDeal.value = true
}

function switchToVerifiedAccount() {
  showVerificationModal.value = false
  logout()
  openSignIn()
  fillTestAccount('verified')
}

async function handleUpvote(card) {
  try {
    const res = await fetch(`/api/deals/${card.id}/upvote`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      card.upvotes = data.upvotes
    }
  } catch (err) {
    console.error('Failed to upvote:', err)
  }
}

function openSignIn() {
  authError.value = ''
  showSignIn.value = true
  showSignUp.value = false
}

function openSignUp() {
  authError.value = ''
  showSignUp.value = true
  showSignIn.value = false
}

function closeModals() {
  showSignIn.value = false
  showSignUp.value = false
  authError.value = ''
}

function fillTestAccount(type) {
  if (type === 'admin') {
    formEmail.value = 'admin@caletracker.com'
    formPassword.value = 'admin123'
  } else if (type === 'verified') {
    formEmail.value = 'verified@caletracker.com'
    formPassword.value = 'verified123'
  } else if (type === 'unverified') {
    formEmail.value = 'unverified@caletracker.com'
    formPassword.value = 'unverified123'
  }
}

async function submitSignIn() {
  authError.value = ''
  authSubmitting.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formEmail.value,
        password: formPassword.value
      })
    })
    const data = await res.json()
    if (!data.success) {
      authError.value = data.message || 'Login failed'
      return
    }

    currentUser.value = data.user
    authToken.value = data.token
    localStorage.setItem('caletracker_user', JSON.stringify(data.user))
    localStorage.setItem('caletracker_token', data.token)
    closeModals()
    showToast(`Signed in as ${data.user.name} (${data.user.role === 'admin' ? 'Admin' : (data.user.is_verified ? 'Verified' : 'Unverified')})`, 'success')
    formEmail.value = ''
    formPassword.value = ''
  } catch (err) {
    authError.value = 'Failed to connect to authentication server'
  } finally {
    authSubmitting.value = false
  }
}

async function submitSignUp() {
  authError.value = ''
  if (formPassword.value !== formConfirmPassword.value) {
    authError.value = 'Passwords do not match'
    return
  }

  authSubmitting.value = true
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName.value,
        email: formEmail.value,
        password: formPassword.value
      })
    })
    const data = await res.json()
    if (!data.success) {
      authError.value = data.message || 'Registration failed'
      return
    }

    currentUser.value = data.user
    authToken.value = data.token
    localStorage.setItem('caletracker_user', JSON.stringify(data.user))
    localStorage.setItem('caletracker_token', data.token)
    closeModals()
    showToast(`Account created! You are currently unverified until approved.`, 'info')
    formName.value = ''
    formEmail.value = ''
    formPassword.value = ''
    formConfirmPassword.value = ''
  } catch (err) {
    authError.value = 'Failed to connect to authentication server'
  } finally {
    authSubmitting.value = false
  }
}

function logout() {
  currentUser.value = null
  authToken.value = ''
  localStorage.removeItem('caletracker_user')
  localStorage.removeItem('caletracker_token')
  showToast('Signed out.', 'info')
}

async function submitDeal() {
  dealError.value = ''
  dealSubmitting.value = true
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken.value}`
    }

    const payload = {
      title: newDeal.value.title,
      discount: newDeal.value.discount,
      category: newDeal.value.category,
      platform: newDeal.value.platform,
      ends: newDeal.value.ends
    }

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!data.success) {
      dealError.value = data.message || 'Failed to submit deal'
      return
    }

    showAddDeal.value = false
    newDeal.value.title = ''
    newDeal.value.discount = 30
    fetchDeals()
    fetchStats()
    showToast('Sale tracker posted successfully!', 'success')
  } catch (err) {
    dealError.value = 'Failed to submit deal'
  } finally {
    dealSubmitting.value = false
  }
}
</script>

<style scoped>
/* homePage */
.homePage {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #F8FAFC;
}

.homepage-content-wrapper { width: 100%; }

/* nav-bar */
.nav-bar{
  box-sizing: border-box;
  display:flex;
  flex-direction:row;
  justify-content:space-between;
  align-items:center;
  padding:0 80px;
  height:72px;
  background:#FFFFFF;
  border-bottom:1px solid #E2E8F0;
}

.logo-group{ display:flex; align-items:center; gap:8px }
.logo-badge{
  width:32px; height:32px; background:#2563EB; border-radius:8px;
  display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:16px;
}
.logo-text{ font-weight:700; font-size:20px; color:#0F172A }

.nav-filters{ display:flex; gap:8px; align-items:center; background:#F1F5F9; border-radius:100px; padding:4px }
.filter-item{ padding:6px 16px; border-radius:100px; color:#475569; font-weight:600; cursor:pointer; user-select:none; transition:all 0.15s ease }
.filter-item:hover{ color:#0F172A }
.filter-item.active-filter{ background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.06); color:#0F172A }

.auth-actions{ display:flex; gap:12px; align-items:center }
.auth-actions button{
  height:36px; padding:8px 18px; border-radius:8px; font-weight:600; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; border:1px solid transparent;
}
.sign-in-btn{ background:transparent; color:#0f172a; border-color:transparent }
.sign-in-btn:hover{ background:#f1f5f9 }
.sign-up-btn{ background:#2563EB; color:#fff; border-color:#2563EB }
.sign-up-btn:hover{ filter:brightness(.95) }
.post-btn{ background:#10B981; color:#fff; border-color:#10B981 }
.post-btn:hover{ filter:brightness(.95) }

.user-pill{
  display:flex; align-items:center; gap:8px; background:#F1F5F9; padding:4px 12px;
  border-radius:100px; font-size:13px; font-weight:600; color:#0F172A; border:1px solid #E2E8F0;
}
.role-tag{
  font-size:11px; padding:2px 8px; border-radius:100px; font-weight:700;
}
.role-tag.admin{ background:#EDE9FE; color:#7C3AED }
.role-tag.verified{ background:#DCFCE7; color:#15803D }
.role-tag.unverified{ background:#FEF3C7; color:#B45309 }

/* Toast */
.toast-banner{
  width:100%; padding:10px 80px; text-align:center; font-weight:600; font-size:14px;
  box-sizing:border-box; transition:all 0.2s;
}
.toast-banner.success{ background:#DCFCE7; color:#166534; border-bottom:1px solid #BBF7D0 }
.toast-banner.error{ background:#FEE2E2; color:#991B1B; border-bottom:1px solid #FECACA }
.toast-banner.info{ background:#E0F2FE; color:#075985; border-bottom:1px solid #BAE6FD }

/* hero-section */
.hero-section{ display:flex; flex-direction:column; align-items:center; padding:64px 80px 40px; gap:20px; background: linear-gradient(180deg,#EEF2F6 0%, #F8FAFC 100%); text-align:center }
.hero-badge{ background:#E0F2FE; padding:6px 12px; border-radius:100px; color:#2563EB; font-weight:600; font-size:12px; letter-spacing:0.5px }
.hero-section h1{ font-size:52px; font-weight:800; color:#0F172A; max-width:800px; margin:0; line-height:1.15 }
.hero-copy{ max-width:600px; color:#475569; font-size:17px; line-height:1.5; margin:0 }

.stats-banner{
  display:flex; align-items:center; gap:24px; background:#FFFFFF; border:1px solid #E2E8F0;
  box-shadow:0 4px 12px rgba(15,23,42,0.04); border-radius:12px; padding:12px 28px; margin-top:8px;
}
.stat-box{ display:flex; flex-direction:column; align-items:center }
.stat-num{ font-size:20px; font-weight:800; color:#2563EB }
.stat-lbl{ font-size:12px; font-weight:500; color:#64748B }
.stat-divider{ width:1px; height:28px; background:#E2E8F0 }

/* deals-section */
.deals-section{ padding:40px 80px }
.deals-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; gap:16px; flex-wrap:wrap }
.active-title{ font-weight:700; font-size:24px; color:#0F172A }
.active-sub{ color:#475569; font-size:14px; margin-top:4px }
.search-bar input{ padding:9px 14px; border-radius:8px; border:1px solid #CBD5E1; min-width:260px; font-size:14px; outline:none }
.search-bar input:focus{ border-color:#2563EB }

.deals-grid{ display:flex; flex-wrap:wrap; gap:24px }
.deal-card{
  box-sizing:border-box; display:flex; flex-direction:column; padding:20px; gap:16px; width:calc(33.333% - 16px);
  min-width:300px; background:#fff; border:1px solid #E2E8F0; border-radius:12px;
  box-shadow:0 4px 12px rgba(15,23,42,0.03); transition:transform 0.2s, box-shadow 0.2s;
}
.deal-card:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,0.06) }

.card-meta-row{ display:flex; justify-content:space-between; align-items:center }
.category-badge{ background:#EEF2F6; padding:4px 10px; border-radius:6px; font-weight:600; font-size:11px; color:#475569 }

.card-actions-group{ display:flex; align-items:center; gap:8px }
.delete-card-btn{
  background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; border-radius:6px;
  padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s;
}
.delete-card-btn:hover{ background:#DC2626; color:#FFFFFF; border-color:#DC2626 }

.upvote-pill{
  background:#F1F5F9; border:1px solid #E2E8F0; border-radius:100px; padding:3px 10px;
  font-size:12px; font-weight:600; color:#2563EB; cursor:pointer; transition:all 0.15s;
}
.upvote-pill:hover{ background:#E0F2FE; border-color:#93C5FD }

.discount-headline{ display:flex; align-items:baseline }
.discount-amount{ font-size:32px; font-weight:800; color:#10B981 }
.off{ font-size:14px; color:#475569; margin-left:8px; font-weight:700 }
.deal-title{ font-weight:700; color:#0F172A; font-size:16px; line-height:1.3; margin-top:4px }
.deal-sub{ color:#475569; font-size:14px; margin-top:2px }
.Line{ height:0; border-top:1px solid #E2E8F0; width:100% }
.card-footer-info{ display:flex; justify-content:space-between; align-items:center; color:#64748B; font-size:12px }
.owner-pill{ background:#E0F2FE; color:#0369A1; font-weight:700; padding:1px 6px; border-radius:4px; font-size:10px; margin-left:4px }

.no-trackers{ color:#ef4444; font-weight:700; font-size:16px; background:rgba(239,68,68,0.1); padding:12px 18px; border-radius:8px; display:inline-block }
.loading-state{ color:#64748B; font-weight:600; font-size:16px; padding:20px 0 }

/* footer */
.footer{ padding:48px 80px; background:#fff; border-top:1px solid #E2E8F0; margin-top:auto }
.footer-top{ display:flex; justify-content:space-between; align-items:center }
.footer-bottom{ color:#94A3B8; margin-top:12px; font-size:13px }
.footer-brand, .footer-links{ color:#0F172A; font-weight:600; font-size:14px }

/* modal styles */
.modal-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.5); display:flex; align-items:center; justify-content:center; z-index:100 }
.modal{
  display:flex; flex-direction:column; align-items:stretch; padding:24px; gap:16px;
  position:relative; width:440px; max-height:90vh; background:#FFFFFF; box-shadow:0px 16px 32px rgba(0,0,0,0.15); border-radius:16px;
  box-sizing:border-box; overflow-y:auto;
}

.modal-header h3{ font-weight:800; font-size:22px; color:#0F172A; margin:0 }
.modal-sub{ font-weight:400; font-size:13px; color:#64748B; margin:4px 0 0; line-height:1.4 }
.modal-alert.error{ background:#FEE2E2; color:#B91C1C; padding:8px 12px; border-radius:6px; font-size:13px }

/* Test accounts helper in modal */
.test-accounts-box{
  background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px;
  display:flex; flex-direction:column; gap:6px;
}
.test-accounts-title{ font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px }
.test-btn-group{ display:flex; gap:6px; flex-wrap:wrap }
.test-fill-btn{
  font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; border:1px solid transparent; cursor:pointer;
}
.admin-fill{ background:#EDE9FE; color:#7C3AED; border-color:#DDD6FE }
.verified-fill{ background:#DCFCE7; color:#15803D; border-color:#BBF7D0 }
.unverified-fill{ background:#FEF3C7; color:#B45309; border-color:#FDE68A }

.modal-form{ display:flex; flex-direction:column; gap:12px; width:100% }
.form-field{ display:flex; flex-direction:column; gap:4px; width:100% }
.form-row{ display:flex; gap:12px }
.form-row .form-field{ flex:1 }
.field-label{ font-weight:600; font-size:13px; color:#0F172A }
.input-wrapper{ display:flex; align-items:center; padding:0 12px; width:100%; height:40px; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:8px; box-sizing:border-box }
.input-wrapper input, .select-input{ border:0; background:transparent; width:100%; font-size:14px; color:#0F172A; outline:none }
.select-input{ height:100% }

.modal-actions{ display:flex; flex-direction:column; gap:10px; margin-top:8px }
.submit-btn{
  display:flex; justify-content:center; align-items:center; padding:10px 0; width:100%; height:40px;
  background:#2563EB; border-radius:8px; color:#fff; border:0; cursor:pointer; font-size:14px; font-weight:600;
}
.submit-btn:disabled{ opacity:0.6; cursor:not-allowed }
.cancel-btn{
  background:transparent; border:1px solid #CBD5E1; border-radius:8px; height:36px;
  color:#64748B; font-weight:600; cursor:pointer;
}
.modal-help-btn{ background:transparent; border:0; color:#64748B; cursor:pointer; font-size:13px; text-align:center }
.modal-help-btn .modal-link{ color:#2563EB; font-weight:600 }

/* Verification Modal */
.verification-badge-large{
  display:inline-block; background:#FEF3C7; color:#B45309; padding:4px 10px;
  border-radius:100px; font-size:12px; font-weight:700; margin-bottom:4px;
}
.test-helper-card{
  background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:12px; margin-top:4px;
}
.test-helper-title{ font-size:12px; font-weight:700; color:#1D4ED8; text-transform:uppercase }
.test-helper-text{ font-size:13px; color:#1E3A8A; margin:4px 0 6px }
.test-helper-cred{ font-size:13px; color:#1E40AF }
.test-helper-cred code{ background:#DBEAFE; padding:1px 6px; border-radius:4px; font-weight:700 }

@media (max-width: 900px){
  .nav-bar{ padding:0 20px }
  .toast-banner{ padding:10px 20px }
  .hero-section{ padding:48px 20px }
  .deals-section{ padding:32px 20px }
  .deal-card{ width:100% }
  .footer{ padding:32px 20px }
}
</style>
