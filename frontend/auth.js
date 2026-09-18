// auth.js - Handles Cognito Authentication via Fetch API

const COGNITO_CLIENT_ID = '13n8v8pvik5ivn399l7f17vcmh';
const COGNITO_REGION = 'ca-central-1';

function showLoginModal() {
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-[#1c2028] p-8 rounded-xl shadow-2xl w-full max-w-sm border border-[#3c4a42]">
      <div class="flex items-center justify-center mb-6">
        <div class="w-12 h-12 rounded bg-[#31353e] flex items-center justify-center text-[#4edea3] font-bold text-xl shadow-inner">P</div>
      </div>
      <h2 class="text-2xl font-semibold text-center mb-2 text-[#dfe2ee]">Payless Portal</h2>
      <p class="text-center text-sm text-[#bbcabf] mb-6">Please sign in to continue</p>
      
      <div id="login-error" class="hidden mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-200 text-sm rounded"></div>
      
      <form id="login-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#86948a] mb-1">Email</label>
          <input type="email" id="email" class="w-full bg-[#0a0e16] border border-[#3c4a42] text-[#dfe2ee] rounded p-2 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] outline-none transition-all" required>
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#86948a] mb-1">Password</label>
          <input type="password" id="password" class="w-full bg-[#0a0e16] border border-[#3c4a42] text-[#dfe2ee] rounded p-2 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] outline-none transition-all" required>
        </div>
        <button type="submit" class="w-full py-2.5 mt-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded font-bold transition-colors">
          Sign In
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = e.target.querySelector('button');
    
    errorDiv.classList.add('hidden');
    btn.textContent = 'Authenticating...';
    btn.disabled = true;

    try {
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      });

      const data = await response.json();
      
      if (data.AuthenticationResult) {
        localStorage.setItem('idToken', data.AuthenticationResult.IdToken);
        localStorage.setItem('accessToken', data.AuthenticationResult.AccessToken);
        modal.remove();
        updateProfileUI(data.AuthenticationResult.IdToken);
        // Load data after successful login
        if (typeof window.loadLedger === 'function') {
          window.loadLedger();
        }
      } else if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        errorDiv.textContent = 'Please login via AWS CLI to set your permanent password first.';
        errorDiv.classList.remove('hidden');
      } else {
        errorDiv.textContent = data.message || 'Authentication failed';
        errorDiv.classList.remove('hidden');
      }
    } catch (err) {
      errorDiv.textContent = 'Network error during login';
      errorDiv.classList.remove('hidden');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}

function checkAuth() {
  const token = localStorage.getItem('idToken');
  if (!token) {
    showLoginModal();
    return false;
  }
  updateProfileUI(token);
  return true;
}

function initAuth() {
  if (window.location.pathname.includes('technician.html')) {
    checkAuth();
  } else {
    checkAuth();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

function updateProfileUI(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    const email = payload.email || '';
    
    let name = email;
    let role = 'User';
    if (email.startsWith('owner')) { name = 'Khaled Mousa'; role = 'Owner'; }
    else if (email.startsWith('controller')) { name = 'Arfa'; role = 'Controller'; }
    else if (email.startsWith('technician')) { name = 'Technician'; role = 'Technician'; }
    
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = name;
    const roleEl = document.getElementById('profile-role');
    if (roleEl) roleEl.textContent = role;
  } catch(e) {
    console.error("Failed to parse token for profile UI", e);
  }
}
