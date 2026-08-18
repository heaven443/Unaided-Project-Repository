<template>
  <div class="homePage">
    <div class="homepage-content-wrapper">
      <nav class="nav-bar">
        <div class="logo-group">
          <div class="logo-badge"><div class="ticket-percent"></div></div>
          <div class="logo-text">CaleTracker</div>
        </div>

        <div class="nav-filters">
          <div class="filter-All">All</div>
          <div class="filter-Shopping">Shopping</div>
          <div class="filter-Gaming">Gaming</div>
        </div>

        <div class="auth-actions">
          <button @click="showSignIn = true" class="sign-in-btn">Sign In</button>
          <button @click="showSignUp = true" class="sign-up-btn">Sign Up</button>
        </div>
      </nav>

      <section class="hero-section">
        <div class="hero-badge">COMMUNITY-MANAGED DISCOUNTS</div>
        <h1>Community-Powered Sale Tracking</h1>
        <p class="hero-copy">Never miss a deal again. CaleTracker is a public directory maintained by shoppers and gamers to track, verify, and monitor global discounts across top retailers and platforms.</p>
      </section>

      <section class="deals-section">
        <div class="deals-header">
          <div class="Frame">
            <div class="active-title">Active Sale Trackers</div>
            <div class="active-sub">Showing verified active trackers posted by community members</div>
          </div>
          <div class="search-bar">
            <input class="search-input" placeholder="Search deals or platforms..." />
          </div>
        </div>

        <div class="deals-grid">
          <div v-if="cards.length === 0" class="no-trackers">No active trackers</div>
          <div v-else>
            <div v-for="(card, i) in cards" :key="i" class="deal-card">
              <div class="card-meta-row">
                <div class="category-badge">{{ card.category }}</div>
              </div>
              <div class="card-content-block">
                <div class="discount-headline"><div class="discount-amount">{{ card.discount }}%</div><div class="off">OFF</div></div>
                <div class="deal-title">{{ card.title }}</div>
                <div class="deal-sub">on {{ card.platform }}</div>
              </div>
              <div class="Line"></div>
              <div class="card-footer-info">
                <div class="info-row-expiry">Ends: {{ card.ends }}</div>
                <div class="info-row-uploader">By: {{ card.author }}</div>
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
      <div v-if="showSignIn || showSignUp" class="modal-overlay" @click.self="closeModals">
        <div :class="['modal', showSignUp ? 'signup' : 'signin']">
          

          <div class="modal-header">
            <h3 v-if="showSignIn">Sign In</h3>
            <h3 v-else>Create Account</h3>
            <p class="modal-sub" v-if="showSignIn">Welcome back to CaleTracker</p>
            <p class="modal-sub" v-else>Join CaleTracker to start submitting deals</p>
          </div>

          <form class="modal-form" @submit="showSignIn ? submitSignIn($event) : submitSignUp($event)">
            <div class="form-field">
              <div class="field-label">Email</div>
              <div class="input-wrapper"><input type="email" required placeholder="you@example.com" /></div>
            </div>

            <div class="form-field">
              <div class="field-label">Password</div>
              <div class="input-wrapper"><input type="password" required placeholder="••••••••" /></div>
            </div>

            <div v-if="showSignUp" class="form-field">
              <div class="field-label">Confirm Password</div>
              <div class="input-wrapper"><input type="password" required placeholder="••••••••" /></div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="submit-btn">{{ showSignIn ? 'Sign In' : 'Create Account' }}</button>
              <button type="button" class="modal-help-btn" v-if="showSignIn" @click.prevent="showSignIn = false; showSignUp = true">Don't have an account? <span class="modal-link">Sign Up</span></button>
              <button type="button" class="modal-help-btn" v-else @click.prevent="showSignUp = false; showSignIn = true">Already have an account? <span class="modal-link">Sign In</span></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cards = ref([])
const showSignIn = ref(false)
const showSignUp = ref(false)

function closeModals(){ showSignIn.value = false; showSignUp.value = false }

function submitSignIn(e){ e.preventDefault(); /* implement auth */ closeModals() }
function submitSignUp(e){ e.preventDefault(); /* implement register */ closeModals() }
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
  min-height: 1024px;
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
.logo-badge{ width:32px; height:32px; background:#2563EB; border-radius:8px; display:flex; align-items:center; justify-content:center }
.logo-text{ font-weight:700; font-size:20px; color:#0F172A }

.nav-filters{ display:flex; gap:8px; align-items:center; background:#F1F5F9; border-radius:100px; padding:4px }
.filter-All{ background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.03); padding:6px 16px; border-radius:100px; font-weight:600 }
.filter-Shopping, .filter-Gaming{ padding:6px 16px; border-radius:100px; color:#475569 }

.auth-actions{ display:flex; gap:12px; align-items:center }
.auth-actions button, .auth-actions .sign-in-btn, .auth-actions .sign-up-btn{ height:36px; padding:8px 26px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; border:1px solid transparent; min-width:110px }
.sign-in-btn{ background:transparent; color:#0f172a; border-color:transparent }
.sign-in-btn:hover{ background:#f1f5f9 }
.sign-up-btn{ background:#2563EB; color:#fff; border-color:#2563EB }
.sign-up-btn:hover{ filter:brightness(.95) }

/* hero-section */
.hero-section{ display:flex; flex-direction:column; align-items:center; padding:96px 80px; gap:24px; background: linear-gradient(180deg,#EEF2F6 0%, #F8FAFC 100%); text-align:center }
.hero-badge{ background:#E0F2FE; padding:6px 12px; border-radius:100px; color:#2563EB; font-weight:600; font-size:12px }
.hero-section h1{ font-size:56px; font-weight:800; color:#0F172A; max-width:800px }
.hero-copy{ max-width:600px; color:#475569; font-size:18px; line-height:1.5 }

/* deals-section */
.deals-section{ padding:64px 80px }
.deals-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:32px }
.active-title{ font-weight:700; font-size:24px; color:#0F172A }
.active-sub{ color:#475569; font-size:14px }
.search-bar input{ padding:8px 12px; border-radius:8px; border:1px solid #E2E8F0 }

.deals-grid{ display:flex; flex-wrap:wrap; gap:24px }
.deal-card{ box-sizing:border-box; display:flex; flex-direction:column; padding:20px; gap:16px; width:410px; background:#fff; border:1px solid #E2E8F0; border-radius:12px; box-shadow:0 4px 12px rgba(15,23,42,0.02) }
.category-badge{ background:#EEF2F6; padding:4px 10px; border-radius:6px; font-weight:600; font-size:11px; color:#475569 }
.discount-amount{ font-size:32px; font-weight:800; color:#10B981 }
.off{ font-size:14px; color:#475569; margin-left:8px }
.deal-title{ font-weight:700; color:#0F172A; font-size:16px }
.deal-sub{ color:#475569 }
.Line{ height:0; border-top:1px solid #E2E8F0; width:100% }
.card-footer-info{ color:#475569; font-size:12px }
/* No active trackers message */
.no-trackers { color: #ef4444; font-weight: 700; font-size: 18px; background: rgba(239,68,68,0.12); padding: 8px 12px; border-radius: 6px; display: inline-block }

/* footer */
.footer{ padding:48px 80px; background:#fff; border-top:1px solid #E2E8F0 }
.footer-top{ display:flex; justify-content:space-between; align-items:center }
.footer-bottom{ color:#94A3B8; margin-top:12px }
.footer-brand, .footer-links { color: #000000 }

/* modal styles */
.modal-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.45); display:flex; align-items:center; justify-content:center; z-index:60 }

/* signup-modal */
.modal.signup{
  display:flex; flex-direction:column; align-items:stretch; padding:16px; gap:12px;
  position:relative; width:400px; max-height:90vh; background:#FFFFFF; box-shadow:0px 16px 32px rgba(0,0,0,0.12549); border-radius:16px; z-index:2;
  box-sizing:border-box; overflow-y:auto;
}

/* signin-modal */
.modal.signin{
  display:flex; flex-direction:column; align-items:stretch; padding:16px; gap:12px;
  position:relative; width:400px; max-height:90vh; background:#FFFFFF; box-shadow:0px 16px 32px rgba(0,0,0,0.12549); border-radius:16px; z-index:2;
  box-sizing:border-box; overflow-y:auto;
}

.modal-close{ display:none }
.modal-header{ display:flex; flex-direction:column; align-items:flex-start; padding:0; gap:6px; width:100%; max-width:none }
.modal-header h3{ font-weight:800; font-size:24px; color:#0F172A; margin:0 }
.modal-sub{ font-weight:400; font-size:14px; color:#475569; margin:0 }

.modal-form{ display:flex; flex-direction:column; gap:12px; width:100%; max-width:none }
.form-field{ display:flex; flex-direction:column; gap:6px; width:100% }
.field-label{ font-weight:600; font-size:13px; color:#0F172A }
.input-wrapper{ display:flex; align-items:center; padding:0 12px; gap:8px; width:100%; height:40px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; box-sizing:border-box }
.input-wrapper input{ border:0; background:transparent; width:100%; padding:8px 0; font-size:14px; color:#475569 }

.modal-actions{ display:flex; flex-direction:column; gap:12px; width:100%; max-width:380px; align-items:stretch }
.submit-btn{ display:flex; justify-content:center; align-items:center; padding:10px 0; width:100%; height:40px; background:#2563EB; border-radius:8px; color:#fff; border:0; cursor:pointer; font-size:15px }
.modal-help{ text-align:center; color:#475569; font-size:13px }
.modal-help-btn{ display:block; width:100%; background:transparent; border:0; color:#475569; cursor:pointer; padding:0; text-align:center }
.modal-help-btn .modal-link{ color:#2563EB; font-weight:600; margin-left:6px }


@media (max-width: 900px){
  .nav-bar{ padding:0 24px }
  .hero-section{ padding:48px 24px }
  .deal-card{ width:100% }
}

</style>
